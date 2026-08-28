-- ERP-ORG-003 weigh-in lifecycle. PREPARED ONLY.
begin;

create table public.weigh_ins (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  fight_id uuid references public.fights(id) on delete set null,
  registration_id uuid references public.event_registrations(id) on delete set null,
  fighter_id uuid not null references public.fighters(id) on delete restrict,
  competition_category_id uuid references public.competition_categories(id) on delete set null,
  attempt_number smallint not null default 1 check (attempt_number in (1,2)),
  scheduled_at timestamptz,
  measured_at timestamptz,
  measured_weight_kg numeric(6,2) check (measured_weight_kg is null or measured_weight_kg > 0),
  minimum_weight_kg numeric(6,2),
  maximum_weight_kg numeric(6,2),
  compliance_status text not null default 'pending' check (compliance_status in ('pending','compliant','underweight','overweight','waiver','disqualified')),
  validated_by uuid references public.profiles(id) on delete set null,
  validated_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint weigh_ins_range_check check (maximum_weight_kg is null or minimum_weight_kg is null or maximum_weight_kg >= minimum_weight_kg),
  constraint weigh_ins_measurement_check check (measured_at is null or measured_weight_kg is not null),
  constraint weigh_ins_validation_check check (validated_at is null or validated_by is not null),
  constraint weigh_ins_event_fighter_attempt_key unique(event_id, fighter_id, attempt_number)
);

create index weigh_ins_event_status_idx on public.weigh_ins(event_id, compliance_status, scheduled_at);
create index weigh_ins_fight_idx on public.weigh_ins(fight_id) where fight_id is not null;

create table public.weigh_in_history (
  id uuid primary key default gen_random_uuid(),
  weigh_in_id uuid not null references public.weigh_ins(id) on delete cascade,
  from_status text,
  to_status text not null,
  measured_weight_kg numeric(6,2),
  changed_by uuid references public.profiles(id) on delete set null,
  reason text,
  created_at timestamptz not null default now()
);

create index weigh_in_history_weigh_in_date_idx on public.weigh_in_history(weigh_in_id, created_at desc);
alter table public.weigh_ins enable row level security;
alter table public.weigh_in_history enable row level security;

comment on table public.weigh_ins is 'Event-specific weigh-in attempts. Fighter current weight is not reused as an event measurement.';

commit;

-- Rollback (manual, after export): drop weigh_in_history, then weigh_ins.
