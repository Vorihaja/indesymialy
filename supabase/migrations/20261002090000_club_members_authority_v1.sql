begin;

create or replace function public.can_manage_club_membership(
  p_organization_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    auth.uid() is not null
    and exists (
      select 1
      from public.organizations o
      where o.id = p_organization_id
        and o.type = 'club'
        and (
          o.owner_id = auth.uid()
          or public.is_super_admin()
          or exists (
            select 1
            from public.organization_members om
            where om.organization_id = o.id
              and om.profile_id = auth.uid()
              and om.role in (
                'owner',
                'admin',
                'manager',
                'organizer'
              )
              and coalesce(
                om.status,
                'active'
              ) = 'active'
          )
        )
    );
$$;

revoke all
on function public.can_manage_club_membership(uuid)
from public, anon;

grant execute
on function public.can_manage_club_membership(uuid)
to authenticated;

alter table public.club_members
enable row level security;

alter table public.attendances
enable row level security;

drop policy if exists
club_members_select_members
on public.club_members;

drop policy if exists
club_members_insert_members
on public.club_members;

drop policy if exists
club_members_update_members
on public.club_members;

drop policy if exists
club_members_delete_members
on public.club_members;

create policy
club_members_select_members
on public.club_members
for select
to authenticated
using (
  profile_id = auth.uid()
  or public.is_organization_member(
    organization_id
  )
  or public.can_manage_club_membership(
    organization_id
  )
);

create policy
club_members_insert_managers
on public.club_members
for insert
to authenticated
with check (
  public.can_manage_club_membership(
    organization_id
  )
);

create policy
club_members_update_managers
on public.club_members
for update
to authenticated
using (
  public.can_manage_club_membership(
    organization_id
  )
)
with check (
  public.can_manage_club_membership(
    organization_id
  )
);

create policy
club_members_delete_managers
on public.club_members
for delete
to authenticated
using (
  public.can_manage_club_membership(
    organization_id
  )
);

drop policy if exists
attendances_select_members
on public.attendances;

drop policy if exists
attendances_insert_members
on public.attendances;

drop policy if exists
attendances_update_members
on public.attendances;

drop policy if exists
attendances_delete_members
on public.attendances;

create policy
attendances_select_members
on public.attendances
for select
to authenticated
using (
  public.is_organization_member(
    organization_id
  )
  or public.can_manage_club_membership(
    organization_id
  )
  or exists (
    select 1
    from public.club_members cm
    where cm.id = attendances.member_id
      and cm.profile_id = auth.uid()
  )
);

create policy
attendances_insert_managers
on public.attendances
for insert
to authenticated
with check (
  public.can_manage_club_membership(
    organization_id
  )
);

create policy
attendances_update_managers
on public.attendances
for update
to authenticated
using (
  public.can_manage_club_membership(
    organization_id
  )
)
with check (
  public.can_manage_club_membership(
    organization_id
  )
);

create policy
attendances_delete_managers
on public.attendances
for delete
to authenticated
using (
  public.can_manage_club_membership(
    organization_id
  )
);

commit;