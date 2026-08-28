-- Co-organizer response workflow.
create or replace function public.respond_event_coorganization(p_invitation_id uuid,p_accept boolean)
returns void
language plpgsql
security definer
set search_path=''
as $$
begin
  update public.event_coorganizers eco set
    status=case when p_accept then 'accepted' else 'declined' end,
    responded_at=now()
  where eco.id=p_invitation_id
    and eco.status='pending'
    and public.can_manage_organization(eco.organization_id);
  if not found then raise exception 'Coorganization invitation unavailable or access denied'; end if;
end;
$$;
revoke all on function public.respond_event_coorganization(uuid,boolean) from public,anon;
grant execute on function public.respond_event_coorganization(uuid,boolean) to authenticated;