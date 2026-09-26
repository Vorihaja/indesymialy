begin;

-- ================================================================================================
-- EVENT INVITATION RECIPIENT CONTRACT
--
-- event_invitations remains the canonical record authority.
--
-- Historical organizer workflow invitations use the table default "pending".
-- ERP-created invitations use "sent".
--
-- Both states therefore represent an unanswered invitation and are intentionally
-- actionable by the linked recipient profile.
-- ================================================================================================


create or replace function public.list_my_event_invitations()
returns table (
    id uuid,
    event_id uuid,
    event_title text,
    invitation_type text,
    role text,
    status text,
    sent_at timestamptz,
    event_starts_at timestamptz,
    event_venue text
)
language sql
stable
security definer
set search_path = ''
as $function$
    select
        invitation.id,
        invitation.event_id,
        coalesce(event.title, 'Événement')::text as event_title,
        invitation.invitation_type,
        invitation.role,
        invitation.status,
        invitation.sent_at,
        event.starts_at as event_starts_at,
        event.venue as event_venue
    from
        public.event_invitations invitation
    join
        public.events event
            on event.id = invitation.event_id
    where
        auth.uid() is not null
        and invitation.invitee_profile_id = auth.uid()
        and invitation.status in ('pending', 'sent')
    order by
        invitation.sent_at desc;
$function$;

revoke all
on function public.list_my_event_invitations()
from public, anon;

grant execute
on function public.list_my_event_invitations()
to authenticated;


create or replace function public.respond_event_invitation(
    p_invitation_id uuid,
    p_accept boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
    v_invitation public.event_invitations%rowtype;
begin
    if auth.uid() is null then
        raise exception
            using
                errcode = '28000',
                message = 'Authentication required';
    end if;

    select
        invitation.*
    into
        v_invitation
    from
        public.event_invitations invitation
    where
        invitation.id = p_invitation_id
    for update;

    if not found then
        raise exception
            using
                errcode = 'P0002',
                message = 'Event invitation not found';
    end if;

    if
        v_invitation.invitee_profile_id is null
        or v_invitation.invitee_profile_id <> auth.uid()
    then
        raise exception
            using
                errcode = '42501',
                message = 'Event invitation does not belong to this profile';
    end if;

    if
        v_invitation.status not in ('pending', 'sent')
    then
        raise exception
            using
                errcode = '22023',
                message = 'Event invitation is no longer actionable';
    end if;

    update
        public.event_invitations
    set
        status =
            case
                when p_accept then 'accepted'
                else 'declined'
            end,
        responded_at = now()
    where
        id = p_invitation_id;
end;
$function$;

revoke all
on function public.respond_event_invitation(uuid, boolean)
from public, anon;

grant execute
on function public.respond_event_invitation(uuid, boolean)
to authenticated;


comment on function public.list_my_event_invitations() is
'Recipient-scoped read model for pending/sent event invitations linked to the authenticated profile.';

comment on function public.respond_event_invitation(uuid, boolean) is
'Canonical recipient decision mutation for event_invitations. Organizer management authority remains separate.';

commit;