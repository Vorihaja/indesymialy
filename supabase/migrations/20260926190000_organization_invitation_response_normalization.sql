begin;

-- ================================================================================================
-- Canonical organization invitation read contract
-- ================================================================================================

create or replace function public.list_my_organization_invitations()
returns table (
    id uuid,
    organization_id uuid,
    organization_name text,
    organization_type text,
    member_role text,
    status text,
    expires_at timestamptz,
    created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $function$
    select
        invitation.id,
        invitation.organization_id,
        organization.name as organization_name,
        organization.type as organization_type,
        invitation.member_role,
        invitation.status,
        invitation.expires_at,
        invitation.created_at
    from
        public.organization_invitations invitation
    join
        public.organizations organization
            on organization.id = invitation.organization_id
    left join
        public.profiles profile
            on profile.id = auth.uid()
    where
        auth.uid() is not null
        and invitation.status = 'pending'
        and invitation.expires_at > now()
        and (
            invitation.invited_profile_id = auth.uid()
            or (
                invitation.invited_profile_id is null
                and profile.email is not null
                and lower(coalesce(invitation.invited_email, '')) =
                    lower(profile.email)
            )
        )
    order by
        invitation.created_at desc;
$function$;

revoke all on function public.list_my_organization_invitations()
from public, anon;

grant execute
on function public.list_my_organization_invitations()
to authenticated;


-- ================================================================================================
-- Canonical organization invitation decision contract
-- ================================================================================================

create or replace function public.respond_organization_invitation(
    p_invitation_id uuid,
    p_accept boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
    v_invitation public.organization_invitations%rowtype;
    v_email text;
begin
    if auth.uid() is null then
        raise exception
            using
                errcode = '28000',
                message = 'Authentication required';
    end if;

    select
        *
    into
        v_invitation
    from
        public.organization_invitations
    where
        id = p_invitation_id
    for update;

    if not found then
        raise exception
            using
                errcode = 'P0002',
                message = 'Invitation not found';
    end if;

    if v_invitation.status <> 'pending' then
        raise exception
            using
                errcode = '22023',
                message = 'Invitation is no longer pending';
    end if;

    if v_invitation.expires_at <= now() then
        raise exception
            using
                errcode = '22023',
                message = 'Invitation has expired';
    end if;

    select
        lower(profile.email)
    into
        v_email
    from
        public.profiles profile
    where
        profile.id = auth.uid();

    if
        v_invitation.invited_profile_id is not null
        and v_invitation.invited_profile_id <> auth.uid()
    then
        raise exception
            using
                errcode = '42501',
                message = 'Invitation does not belong to this profile';
    end if;

    if
        v_invitation.invited_profile_id is null
        and lower(
            coalesce(
                v_invitation.invited_email,
                ''
            )
        ) <>
            coalesce(
                v_email,
                ''
            )
    then
        raise exception
            using
                errcode = '42501',
                message = 'Invitation email does not match this profile';
    end if;

    update
        public.organization_invitations
    set
        status =
            case
                when p_accept then 'accepted'
                else 'declined'
            end,
        invited_profile_id =
            coalesce(
                invited_profile_id,
                auth.uid()
            ),
        invited_email =
            case
                when invited_profile_id is null
                then null
                else invited_email
            end,
        responded_at =
            now()
    where
        id = p_invitation_id;

    if p_accept then

        -- Do not depend on an unverified UNIQUE constraint.
        -- Activate every existing membership for this organization/profile first.
        update
            public.organization_members
        set
            role = v_invitation.member_role,
            status = 'active',
            joined_at = coalesce(joined_at, now()),
            left_at = null
        where
            organization_id = v_invitation.organization_id
            and profile_id = auth.uid();

        -- If there was no existing membership, create exactly one.
        if not found then
            insert into
                public.organization_members (
                    organization_id,
                    profile_id,
                    role,
                    status,
                    joined_at,
                    left_at
                )
            values (
                v_invitation.organization_id,
                auth.uid(),
                v_invitation.member_role,
                'active',
                now(),
                null
            );
        end if;
    end if;
end;
$function$;

revoke all on function public.respond_organization_invitation(uuid, boolean)
from public, anon;

grant execute
on function public.respond_organization_invitation(uuid, boolean)
to authenticated;


-- ================================================================================================
-- Invitation decisions are now mutation-authoritative through the canonical RPC.
-- Keep direct invitee SELECT but remove direct invitee UPDATE.
-- Organization managers retain their existing management policy.
-- ================================================================================================

drop policy if exists
    organization_invitations_invitee_update
on
    public.organization_invitations;


-- ================================================================================================
-- Marketplace compatibility wrapper
--
-- organization_invitations remains the single invitation authority.
-- Existing seller clients can keep calling their historical RPC.
-- ================================================================================================

create or replace function
public.marketplace_respond_seller_personnel_invitation(
    p_invitation_id uuid,
    p_accept boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
begin
    perform public.respond_organization_invitation(
        p_invitation_id,
        p_accept
    );
end;
$function$;

revoke all
on function public.marketplace_respond_seller_personnel_invitation(uuid, boolean)
from public, anon;

grant execute
on function public.marketplace_respond_seller_personnel_invitation(uuid, boolean)
to authenticated;

commit;