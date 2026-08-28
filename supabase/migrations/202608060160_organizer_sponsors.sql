-- ERP-ORG-003 sponsor pipeline and STAB-003 deliverable extension. PREPARED ONLY.
begin;

alter table public.sponsors
  add column if not exists organization_id uuid references public.organizations(id) on delete set null;
create unique index sponsors_organization_idx on public.sponsors(organization_id) where organization_id is not null;

alter table public.event_sponsors
  add constraint event_sponsors_event_id_fkey foreign key (event_id) references public.events(id) on delete cascade not valid;

create table public.sponsor_pipeline (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  event_id uuid references public.events(id) on delete cascade,
  sponsor_id uuid not null references public.sponsors(id) on delete restrict,
  stage text not null default 'lead' check (stage in ('lead','contacted','qualified','proposal','negotiation','won','lost','archived')),
  estimated_value numeric(14,2) check (estimated_value is null or estimated_value >= 0),
  currency_code text not null default 'MGA' check (currency_code ~ '^[A-Z]{3}$'),
  probability_percent numeric(5,2) not null default 0 check (probability_percent between 0 and 100),
  next_action_at timestamptz,
  owner_profile_id uuid references public.profiles(id) on delete set null,
  notes text,
  lost_reason text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sponsor_pipeline_org_event_sponsor_key unique(organization_id, event_id, sponsor_id),
  constraint sponsor_pipeline_lost_reason_check check (stage <> 'lost' or lost_reason is not null)
);
create index sponsor_pipeline_org_stage_idx on public.sponsor_pipeline(organization_id, stage, next_action_at);
create index sponsor_pipeline_event_idx on public.sponsor_pipeline(event_id, stage) where event_id is not null;

alter table public.event_sponsor_deliverables
  add column if not exists description text,
  add column if not exists estimated_value numeric(14,2),
  add column if not exists delivered_by uuid references public.profiles(id) on delete set null,
  add column if not exists delivered_at timestamptz,
  add column if not exists evidence_path text;

alter table public.event_sponsor_deliverables
  add constraint event_sponsor_deliverables_value_check check (estimated_value is null or estimated_value >= 0),
  add constraint event_sponsor_deliverables_delivery_check check (delivered_at is null or delivered_by is not null);

create index event_sponsor_deliverables_due_idx on public.event_sponsor_deliverables(status, due_at);
alter table public.sponsor_pipeline enable row level security;

comment on table public.sponsor_pipeline is 'Organizer-owned commercial pipeline; event_sponsor_deliverables remains the single delivery model.';

commit;

-- Rollback (manual, after export): drop deliverable extension index/constraints/columns,
-- then drop sponsor_pipeline and the sponsor organization extension.
