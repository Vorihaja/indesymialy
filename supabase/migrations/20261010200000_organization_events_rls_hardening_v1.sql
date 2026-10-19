begin;

alter table public.organization_members
enable row level security;

alter table public.events
enable row level security;

create or replace function public.is_organization_member(
  target_organization_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null
    and exists (
      select 1
      from public.organization_members om
      where om.organization_id = target_organization_id
        and om.profile_id = auth.uid()
        and om.status = 'active'
    );
$$;

drop policy if exists "read members"
on public.organization_members;

drop policy if exists "write members"
on public.organization_members;

drop policy if exists organization_members_select_scoped
on public.organization_members;

drop policy if exists organization_members_insert_managers
on public.organization_members;

drop policy if exists organization_members_update_managers
on public.organization_members;

drop policy if exists organization_members_delete_managers
on public.organization_members;

create policy organization_members_select_scoped
on public.organization_members
for select
to authenticated
using (
  profile_id = auth.uid()
  or public.is_organization_member(organization_id)
  or public.can_manage_organization(organization_id)
);

create policy organization_members_insert_managers
on public.organization_members
for insert
to authenticated
with check (
  public.can_manage_organization(organization_id)
);

create policy organization_members_update_managers
on public.organization_members
for update
to authenticated
using (
  public.can_manage_organization(organization_id)
)
with check (
  public.can_manage_organization(organization_id)
);

create policy organization_members_delete_managers
on public.organization_members
for delete
to authenticated
using (
  public.can_manage_organization(organization_id)
);

drop policy if exists "read events"
on public.events;

drop policy if exists "write events"
on public.events;

revoke all privileges
on table public.organization_members
from public, anon, authenticated;

revoke all privileges
on table public.events
from public, anon, authenticated;

grant select, insert, update, delete
on table public.organization_members
to authenticated;

grant select
on table public.events
to anon, authenticated;

grant insert, update, delete
on table public.events
to authenticated;

grant all privileges
on table public.organization_members, public.events
to service_role;

revoke all
on function public.is_organization_member(uuid)
from public, anon;

revoke all
on function public.can_manage_organization(uuid)
from public, anon;

revoke all
on function public.can_manage_event(uuid)
from public, anon;

grant execute
on function public.is_organization_member(uuid)
to authenticated, service_role;

grant execute
on function public.can_manage_organization(uuid)
to authenticated, service_role;

grant execute
on function public.can_manage_event(uuid)
to authenticated, service_role;

commit;
