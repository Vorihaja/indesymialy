-- Real event geography and co-organization workflow.
alter table public.events
  add column if not exists region_id uuid references public.regions(id) on delete set null,
  add column if not exists district_id uuid references public.districts(id) on delete set null,
  add column if not exists city_id uuid references public.cities(id) on delete set null,
  add column if not exists commune_id uuid references public.communes(id) on delete set null,
  add column if not exists address text;

create index if not exists events_region_idx on public.events(region_id);
create index if not exists events_city_idx on public.events(city_id);

create table if not exists public.event_coorganizers (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  role text not null default 'coorganizer',
  status text not null default 'pending' check (status in ('pending','accepted','declined','revoked')),
  invited_by uuid not null references public.profiles(id),
  invited_at timestamptz not null default now(),
  responded_at timestamptz,
  unique(event_id, organization_id)
);

create index if not exists event_coorganizers_organization_idx on public.event_coorganizers(organization_id,status);
alter table public.event_coorganizers enable row level security;

create or replace function public.can_manage_event(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_platform_admin() or exists (
    select 1
    from public.events e
    where e.id = p_event_id
      and (
        public.can_manage_organization(e.organizer_id)
        or exists (
          select 1 from public.event_coorganizers eco
          where eco.event_id=e.id and eco.status='accepted'
            and public.can_manage_organization(eco.organization_id)
        )
      )
  );
$$;

create policy event_coorganizers_parties_read on public.event_coorganizers
for select to authenticated using (
  public.can_manage_event(event_id) or public.can_manage_organization(organization_id)
);
create policy event_coorganizers_owner_manage on public.event_coorganizers
for all to authenticated using (
  exists(select 1 from public.events e where e.id=event_id and public.can_manage_organization(e.organizer_id))
) with check (
  exists(select 1 from public.events e where e.id=event_id and public.can_manage_organization(e.organizer_id))
);

create or replace function public.list_event_coorganizer_candidates()
returns table(id uuid,name text,type text,region_id uuid,city_id uuid)
language sql
stable
security definer
set search_path = ''
as $$
  select o.id,o.name,o.type,o.region_id,o.city_id
  from public.organizations o
  where auth.uid() is not null and coalesce(o.status,'active') not in ('suspended','deleted')
  order by o.name;
$$;

create or replace function public.save_organizer_event_workflow_v2(
  p_event_id uuid,
  p_payload jsonb,
  p_status text default 'draft'
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event_id uuid;
  v_item jsonb;
  v_organization_id uuid;
begin
  v_event_id := public.save_organizer_event_workflow(p_event_id,p_payload,p_status);

  update public.events set
    region_id=nullif(p_payload #>> '{event,regionId}','')::uuid,
    district_id=nullif(p_payload #>> '{event,districtId}','')::uuid,
    city_id=nullif(p_payload #>> '{event,cityId}','')::uuid,
    commune_id=nullif(p_payload #>> '{event,communeId}','')::uuid,
    address=nullif(trim(p_payload #>> '{event,address}'),'')
  where id=v_event_id;

  delete from public.event_coorganizers where event_id=v_event_id and status in ('pending','declined','revoked');
  for v_item in select value from jsonb_array_elements(coalesce(p_payload->'coorganizers','[]'::jsonb)) loop
    v_organization_id := nullif(v_item->>'organizationId','')::uuid;
    if v_organization_id is not null and not exists (
      select 1 from public.events e where e.id=v_event_id and e.organizer_id=v_organization_id
    ) then
      insert into public.event_coorganizers(event_id,organization_id,role,status,invited_by)
      values(v_event_id,v_organization_id,coalesce(nullif(v_item->>'role',''),'coorganizer'),'pending',auth.uid())
      on conflict(event_id,organization_id) do update set
        role=excluded.role,
        status=case when public.event_coorganizers.status='accepted' then 'accepted' else 'pending' end,
        invited_by=excluded.invited_by,
        invited_at=case when public.event_coorganizers.status='accepted' then public.event_coorganizers.invited_at else now() end;
    end if;
  end loop;
  return v_event_id;
end;
$$;

revoke all on function public.list_event_coorganizer_candidates() from public,anon;
revoke all on function public.save_organizer_event_workflow_v2(uuid,jsonb,text) from public,anon;
grant execute on function public.list_event_coorganizer_candidates() to authenticated;
grant execute on function public.save_organizer_event_workflow_v2(uuid,jsonb,text) to authenticated;
grant select on public.event_coorganizers to authenticated;