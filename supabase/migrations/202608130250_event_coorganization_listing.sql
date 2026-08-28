-- Read model for co-organization invitations in ERP workspaces.
create or replace function public.list_my_event_coorganizations()
returns table(id uuid,event_id uuid,event_title text,organization_id uuid,organization_name text,role text,status text,invited_at timestamptz)
language sql
stable
security definer
set search_path=''
as $$
  select eco.id,eco.event_id,e.title,eco.organization_id,o.name,eco.role,eco.status,eco.invited_at
  from public.event_coorganizers eco
  join public.events e on e.id=eco.event_id
  join public.organizations o on o.id=eco.organization_id
  where public.can_manage_organization(eco.organization_id)
     or public.can_manage_organization(e.organizer_id)
  order by eco.invited_at desc;
$$;
revoke all on function public.list_my_event_coorganizations() from public,anon;
grant execute on function public.list_my_event_coorganizations() to authenticated;