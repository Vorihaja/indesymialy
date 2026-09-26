begin;

-- ================================================================================================
-- PROFILE-LINKED STAFF ASSIGNMENT RECIPIENT CONTRACT
--
-- staff_assignments remains the canonical authority.
--
-- IMPORTANT:
-- - profile_id IS NULL represents manual / non-Indesy personnel and is intentionally excluded.
-- - only profile-linked "invited" assignments are recipient-actionable.
-- - organizer management remains separate and unchanged.
-- - direct recipient UPDATE is removed in favor of the canonical RPC.
-- ================================================================================================


create or replace function public.list_my_staff_assignments()
returns table (
    id uuid,
    event_id uuid,
    event_title text,
    staff_name text,
    role text,
    status text,
    assigned_at timestamptz,
    starts_at timestamptz,
    ends_at timestamptz,
    zone text,
    event_starts_at timestamptz,
    event_venue text
)
language sql
stable
security definer
set search_path = ''
as $function$
    select
        assignment.id,
        assignment.event_id,
        coalesce(event.title, 'Événement')::text,
        assignment.staff_name,
        assignment.role,
        assignment.status,
        assignment.assigned_at,
        assignment.starts_at,
        assignment.ends_at,
        assignment.zone,
        event.starts_at,
        event.venue
    from
        public.staff_assignments assignment
    join
        public.events event
            on event.id = assignment.event_id
    where
        auth.uid() is not null
        and assignment.profile_id = auth.uid()
        and assignment.status = 'invited'
    order by
        coalesce(
            assignment.starts_at,
            event.starts_at,
            assignment.assigned_at
        ),
        assignment.assigned_at desc;
$function$;


revoke all
on function public.list_my_staff_assignments()
from public, anon;

grant execute
on function public.list_my_staff_assignments()
to authenticated;


create or replace function public.respond_staff_assignment(
    p_assignment_id uuid,
    p_accept boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
    v_assignment public.staff_assignments%rowtype;
begin
    if auth.uid() is null then
        raise exception
            using
                errcode = '28000',
                message = 'Authentication required';
    end if;

    select
        assignment.*
    into
        v_assignment
    from
        public.staff_assignments assignment
    where
        assignment.id = p_assignment_id
    for update;

    if not found then
        raise exception
            using
                errcode = 'P0002',
                message = 'Staff assignment not found';
    end if;

    if
        v_assignment.profile_id is null
        or v_assignment.profile_id <> auth.uid()
    then
        raise exception
            using
                errcode = '42501',
                message = 'Staff assignment does not belong to this profile';
    end if;

    if v_assignment.status <> 'invited' then
        raise exception
            using
                errcode = '22023',
                message = 'Staff assignment is no longer actionable';
    end if;

    update
        public.staff_assignments
    set
        status =
            case
                when p_accept then 'confirmed'
                else 'declined'
            end,
        confirmed_at =
            case
                when p_accept then now()
                else null
            end
    where
        id = p_assignment_id;
end;
$function$;


revoke all
on function public.respond_staff_assignment(uuid, boolean)
from public, anon;

grant execute
on function public.respond_staff_assignment(uuid, boolean)
to authenticated;


-- Recipient mutations are now canonicalized through respond_staff_assignment().
-- Recipient read remains available.
-- Organizer management remains available.
drop policy if exists
    staff_assignments_self_confirm
on
    public.staff_assignments;


comment on function public.list_my_staff_assignments() is
'Returns only actionable staff assignments linked to the authenticated Indesy profile. Manual personnel rows are excluded.';

comment on function public.respond_staff_assignment(uuid, boolean) is
'Canonical confirm/decline mutation for a profile-linked invited staff assignment.';

commit;