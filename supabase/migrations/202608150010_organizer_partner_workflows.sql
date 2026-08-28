begin;

alter table public.sponsors
  add column if not exists contact_name text,
  add column if not exists contact_phone text,
  add column if not exists website_url text,
  add column if not exists notes text,
  add column if not exists managing_organization_id uuid references public.organizations(id) on delete cascade,
  add column if not exists created_by uuid references public.profiles(id) on delete set null,
  add column if not exists updated_at timestamptz not null default now();

create table public.sponsor_packages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  event_id uuid references public.events(id) on delete cascade,
  name text not null,
  description text,
  price numeric(14,2) not null default 0 check (price >= 0),
  currency_code text not null default 'MGA' check (currency_code ~ '^[A-Z]{3}$'),
  capacity integer check (capacity is null or capacity > 0),
  allocated_count integer not null default 0 check (allocated_count >= 0),
  benefits text,
  status text not null default 'draft' check (status in ('draft','published','closed','archived')),
  valid_from timestamptz,
  valid_until timestamptz,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sponsor_packages_name_key unique nulls not distinct (organization_id, event_id, name),
  constraint sponsor_packages_allocation_capacity_check check (capacity is null or allocated_count <= capacity),
  constraint sponsor_packages_dates_check check (valid_until is null or valid_from is null or valid_until > valid_from)
);
create index sponsor_packages_org_status_idx on public.sponsor_packages(organization_id, status);

alter table public.event_sponsors
  add column if not exists package_id uuid references public.sponsor_packages(id) on delete set null,
  add column if not exists status text not null default 'prospect',
  add column if not exists contact_name text,
  add column if not exists contact_email text,
  add column if not exists payment_status text not null default 'pending',
  add column if not exists signed_at timestamptz,
  add column if not exists created_by uuid references public.profiles(id) on delete set null,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();
alter table public.event_sponsors
  add constraint event_sponsors_status_check check (status in ('prospect','negotiating','contracted','active','completed','cancelled')),
  add constraint event_sponsors_payment_status_check check (payment_status in ('pending','partial','paid','overdue','refunded')),
  add constraint event_sponsors_amount_check check (amount >= 0),
  add constraint event_sponsors_dates_check check (contract_end is null or contract_start is null or contract_end >= contract_start);
create unique index event_sponsors_event_sponsor_unique_idx on public.event_sponsors(event_id, sponsor_id);

create table public.sponsor_contracts (
  id uuid primary key default gen_random_uuid(),
  event_sponsor_id uuid not null unique references public.event_sponsors(id) on delete cascade,
  package_id uuid references public.sponsor_packages(id) on delete set null,
  reference text not null unique,
  title text not null,
  amount numeric(14,2) not null check (amount >= 0),
  currency_code text not null default 'MGA' check (currency_code ~ '^[A-Z]{3}$'),
  starts_on date not null,
  ends_on date not null,
  status text not null default 'draft' check (status in ('draft','sent','negotiation','signed','active','completed','terminated')),
  payment_status text not null default 'pending' check (payment_status in ('pending','partial','paid','overdue','refunded')),
  document_path text,
  terms text,
  signed_at timestamptz,
  terminated_reason text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sponsor_contracts_dates_check check (ends_on >= starts_on),
  constraint sponsor_contracts_signed_document_check check (status not in ('signed','active','completed') or document_path is not null),
  constraint sponsor_contracts_termination_check check (status <> 'terminated' or terminated_reason is not null)
);
create index sponsor_contracts_status_idx on public.sponsor_contracts(status, ends_on);

create table public.sponsor_visibility_items (
  id uuid primary key default gen_random_uuid(),
  event_sponsor_id uuid not null references public.event_sponsors(id) on delete cascade,
  channel text not null check (channel in ('venue','ring','digital','social','press','broadcast','ticketing','merchandising')),
  placement text not null,
  starts_at timestamptz,
  ends_at timestamptz,
  target_impressions bigint check (target_impressions is null or target_impressions >= 0),
  actual_impressions bigint not null default 0 check (actual_impressions >= 0),
  target_reach bigint check (target_reach is null or target_reach >= 0),
  actual_reach bigint not null default 0 check (actual_reach >= 0),
  status text not null default 'planned' check (status in ('planned','live','completed','cancelled')),
  evidence_path text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sponsor_visibility_dates_check check (ends_at is null or starts_at is null or ends_at > starts_at)
);
create index sponsor_visibility_sponsor_status_idx on public.sponsor_visibility_items(event_sponsor_id, status);

create table public.sponsor_activations (
  id uuid primary key default gen_random_uuid(),
  event_sponsor_id uuid not null references public.event_sponsors(id) on delete cascade,
  title text not null,
  activation_type text not null check (activation_type in ('booth','sampling','contest','content','hospitality','appearance','other')),
  description text,
  location text,
  starts_at timestamptz,
  ends_at timestamptz,
  budget numeric(14,2) check (budget is null or budget >= 0),
  target_contacts integer check (target_contacts is null or target_contacts >= 0),
  actual_contacts integer not null default 0 check (actual_contacts >= 0),
  status text not null default 'draft' check (status in ('draft','approved','scheduled','live','completed','cancelled')),
  evidence_path text,
  owner_profile_id uuid references public.profiles(id) on delete set null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sponsor_activations_dates_check check (ends_at is null or starts_at is null or ends_at > starts_at)
);
create index sponsor_activations_sponsor_status_idx on public.sponsor_activations(event_sponsor_id, status);

create table public.sponsor_pipeline_history (
  id uuid primary key default gen_random_uuid(),
  pipeline_id uuid not null references public.sponsor_pipeline(id) on delete cascade,
  from_stage text,
  to_stage text not null,
  note text,
  changed_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);
create index sponsor_pipeline_history_pipeline_idx on public.sponsor_pipeline_history(pipeline_id, created_at desc);

create table public.sponsor_contract_history (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.sponsor_contracts(id) on delete cascade,
  from_status text,
  to_status text not null,
  note text,
  changed_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);
create index sponsor_contract_history_contract_idx on public.sponsor_contract_history(contract_id, created_at desc);

alter table public.sponsors enable row level security;
alter table public.sponsor_packages enable row level security;
alter table public.sponsor_contracts enable row level security;
alter table public.sponsor_visibility_items enable row level security;
alter table public.sponsor_activations enable row level security;
alter table public.sponsor_pipeline_history enable row level security;
alter table public.sponsor_contract_history enable row level security;

create policy sponsors_authenticated_read on public.sponsors for select to authenticated using (true);
create policy sponsors_organizer_create on public.sponsors for insert to authenticated
with check (public.can_manage_organization(managing_organization_id) and created_by = auth.uid());
create policy sponsors_organizer_update on public.sponsors for update to authenticated
using (public.can_manage_organization(managing_organization_id))
with check (public.can_manage_organization(managing_organization_id));
create policy sponsors_organizer_delete on public.sponsors for delete to authenticated
using (public.can_manage_organization(managing_organization_id));

create policy sponsor_packages_organizer_manage on public.sponsor_packages for all to authenticated
using (public.can_manage_organization(organization_id) and (event_id is null or public.can_manage_event(event_id)))
with check (public.can_manage_organization(organization_id) and (event_id is null or public.can_manage_event(event_id)));

create policy sponsor_contracts_event_parties on public.sponsor_contracts for select to authenticated
using (exists (select 1 from public.event_sponsors es where es.id = event_sponsor_id and (public.can_manage_event(es.event_id) or public.is_sponsor_user(es.sponsor_id))));
create policy sponsor_contracts_organizer_manage on public.sponsor_contracts for all to authenticated
using (exists (select 1 from public.event_sponsors es where es.id = event_sponsor_id and public.can_manage_event(es.event_id)))
with check (exists (select 1 from public.event_sponsors es where es.id = event_sponsor_id and public.can_manage_event(es.event_id)));

create policy sponsor_visibility_event_parties on public.sponsor_visibility_items for select to authenticated
using (exists (select 1 from public.event_sponsors es where es.id = event_sponsor_id and (public.can_manage_event(es.event_id) or public.is_sponsor_user(es.sponsor_id))));
create policy sponsor_visibility_organizer_manage on public.sponsor_visibility_items for all to authenticated
using (exists (select 1 from public.event_sponsors es where es.id = event_sponsor_id and public.can_manage_event(es.event_id)))
with check (exists (select 1 from public.event_sponsors es where es.id = event_sponsor_id and public.can_manage_event(es.event_id)));

create policy sponsor_activations_event_parties on public.sponsor_activations for select to authenticated
using (exists (select 1 from public.event_sponsors es where es.id = event_sponsor_id and (public.can_manage_event(es.event_id) or public.is_sponsor_user(es.sponsor_id))));
create policy sponsor_activations_organizer_manage on public.sponsor_activations for all to authenticated
using (exists (select 1 from public.event_sponsors es where es.id = event_sponsor_id and public.can_manage_event(es.event_id)))
with check (exists (select 1 from public.event_sponsors es where es.id = event_sponsor_id and public.can_manage_event(es.event_id)));

create policy sponsor_pipeline_history_organizer_manage on public.sponsor_pipeline_history for all to authenticated
using (exists (select 1 from public.sponsor_pipeline pipeline where pipeline.id = pipeline_id and public.can_manage_organization(pipeline.organization_id)))
with check (changed_by = auth.uid() and exists (select 1 from public.sponsor_pipeline pipeline where pipeline.id = pipeline_id and public.can_manage_organization(pipeline.organization_id)));
create policy sponsor_contract_history_event_parties on public.sponsor_contract_history for select to authenticated
using (exists (select 1 from public.sponsor_contracts contract join public.event_sponsors es on es.id = contract.event_sponsor_id where contract.id = contract_id and (public.can_manage_event(es.event_id) or public.is_sponsor_user(es.sponsor_id))));
create policy sponsor_contract_history_organizer_create on public.sponsor_contract_history for insert to authenticated
with check (changed_by = auth.uid() and exists (select 1 from public.sponsor_contracts contract join public.event_sponsors es on es.id = contract.event_sponsor_id where contract.id = contract_id and public.can_manage_event(es.event_id)));

create or replace function public.transition_sponsor_pipeline(p_pipeline_id uuid, p_stage text, p_note text default null)
returns uuid language plpgsql security invoker set search_path = public as $$
declare v_row public.sponsor_pipeline%rowtype;
begin
  select * into v_row from public.sponsor_pipeline where id = p_pipeline_id for update;
  if v_row.id is null then raise exception 'Prospect introuvable.'; end if;
  if not public.can_manage_organization(v_row.organization_id) then raise exception 'Accès refusé.'; end if;
  if p_stage = v_row.stage then return v_row.id; end if;
  if not (
    (v_row.stage = 'lead' and p_stage in ('contacted','archived')) or
    (v_row.stage = 'contacted' and p_stage in ('qualified','lost','archived')) or
    (v_row.stage = 'qualified' and p_stage in ('proposal','lost')) or
    (v_row.stage = 'proposal' and p_stage in ('negotiation','won','lost')) or
    (v_row.stage = 'negotiation' and p_stage in ('won','lost','proposal')) or
    (v_row.stage = 'lost' and p_stage in ('contacted','archived'))
  ) then raise exception 'Transition commerciale invalide : % vers %.', v_row.stage, p_stage; end if;
  if p_stage = 'lost' and length(btrim(coalesce(p_note, v_row.lost_reason, ''))) < 2 then raise exception 'Le motif de perte est obligatoire.'; end if;
  update public.sponsor_pipeline set stage = p_stage, lost_reason = case when p_stage='lost' then coalesce(nullif(btrim(p_note),''),lost_reason) else null end, updated_at=now() where id=p_pipeline_id;
  insert into public.sponsor_pipeline_history(pipeline_id,from_stage,to_stage,note,changed_by) values(p_pipeline_id,v_row.stage,p_stage,nullif(btrim(p_note),''),auth.uid());
  return p_pipeline_id;
end $$;

create or replace function public.transition_sponsor_contract(p_contract_id uuid, p_status text, p_note text default null)
returns uuid language plpgsql security invoker set search_path = public as $$
declare v_row public.sponsor_contracts%rowtype; v_event_sponsor public.event_sponsors%rowtype;
begin
  select * into v_row from public.sponsor_contracts where id=p_contract_id for update;
  if v_row.id is null then raise exception 'Contrat introuvable.'; end if;
  select * into v_event_sponsor from public.event_sponsors where id=v_row.event_sponsor_id;
  if not public.can_manage_event(v_event_sponsor.event_id) then raise exception 'Accès refusé.'; end if;
  if p_status = v_row.status then return v_row.id; end if;
  if not (
    (v_row.status='draft' and p_status in ('sent','terminated')) or
    (v_row.status='sent' and p_status in ('negotiation','signed','terminated')) or
    (v_row.status='negotiation' and p_status in ('sent','signed','terminated')) or
    (v_row.status='signed' and p_status in ('active','terminated')) or
    (v_row.status='active' and p_status in ('completed','terminated'))
  ) then raise exception 'Transition contractuelle invalide : % vers %.',v_row.status,p_status; end if;
  if p_status in ('signed','active','completed') and v_row.document_path is null then raise exception 'Le contrat signé est obligatoire.'; end if;
  if p_status='terminated' and length(btrim(coalesce(p_note,'')))<2 then raise exception 'Le motif de résiliation est obligatoire.'; end if;
  update public.sponsor_contracts set status=p_status, signed_at=case when p_status='signed' then coalesce(signed_at,now()) else signed_at end, terminated_reason=case when p_status='terminated' then p_note else terminated_reason end, updated_at=now() where id=p_contract_id;
  update public.event_sponsors set status=case when p_status in ('signed','active') then 'active' when p_status='completed' then 'completed' when p_status='terminated' then 'cancelled' else 'contracted' end, signed_at=case when p_status in ('signed','active') then coalesce(signed_at,now()) else signed_at end, updated_at=now() where id=v_row.event_sponsor_id;
  if v_row.package_id is not null and v_row.status not in ('signed','active') and p_status in ('signed','active') then
    update public.sponsor_packages set allocated_count=allocated_count+1,updated_at=now() where id=v_row.package_id and (capacity is null or allocated_count<capacity);
    if not found then raise exception 'Le package sponsor est complet.'; end if;
  end if;
  insert into public.sponsor_contract_history(contract_id,from_status,to_status,note,changed_by) values(p_contract_id,v_row.status,p_status,nullif(btrim(p_note),''),auth.uid());
  return p_contract_id;
end $$;

create or replace function public.transition_sponsor_deliverable(p_deliverable_id uuid, p_status text, p_note text default null)
returns uuid language plpgsql security invoker set search_path = public as $$
declare v_row public.event_sponsor_deliverables%rowtype; v_event_id uuid;
begin
  select * into v_row from public.event_sponsor_deliverables where id=p_deliverable_id for update;
  if v_row.id is null then raise exception 'Livrable introuvable.'; end if;
  select event_id into v_event_id from public.event_sponsors where id=v_row.event_sponsor_id;
  if not public.can_manage_event(v_event_id) then raise exception 'Accès refusé.'; end if;
  if p_status = v_row.status then return v_row.id; end if;
  if not ((v_row.status='todo' and p_status in ('in_progress','cancelled')) or (v_row.status='in_progress' and p_status in ('delivered','cancelled')) or (v_row.status='delivered' and p_status in ('validated','in_progress'))) then raise exception 'Transition de livrable invalide.'; end if;
  if p_status='delivered' and v_row.evidence_path is null then raise exception 'Une preuve de livraison est obligatoire.'; end if;
  update public.event_sponsor_deliverables set status=p_status,delivered_by=case when p_status='delivered' then auth.uid() else delivered_by end,delivered_at=case when p_status='delivered' then now() else delivered_at end,validated_by=case when p_status='validated' then auth.uid() else validated_by end,validated_at=case when p_status='validated' then now() else validated_at end,description=coalesce(description,nullif(btrim(p_note),'')) where id=p_deliverable_id;
  return p_deliverable_id;
end $$;

grant execute on function public.transition_sponsor_pipeline(uuid,text,text) to authenticated;
grant execute on function public.transition_sponsor_contract(uuid,text,text) to authenticated;
grant execute on function public.transition_sponsor_deliverable(uuid,text,text) to authenticated;

commit;
