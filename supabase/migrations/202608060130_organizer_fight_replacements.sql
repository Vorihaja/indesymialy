-- ERP-ORG-003 fight replacement audit. PREPARED ONLY.
begin;

create table public.fight_replacements (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  fight_id uuid not null references public.fights(id) on delete cascade,
  corner text not null check (corner in ('red','blue')),
  previous_fighter_id uuid not null references public.fighters(id) on delete restrict,
  replacement_fighter_id uuid not null references public.fighters(id) on delete restrict,
  reason text not null check (length(btrim(reason)) between 3 and 2000),
  effective_at timestamptz not null default now(),
  replaced_by uuid not null references public.profiles(id) on delete restrict,
  status text not null default 'confirmed' check (status in ('proposed','confirmed','cancelled')),
  created_at timestamptz not null default now(),
  constraint fight_replacements_distinct_fighters_check check (previous_fighter_id <> replacement_fighter_id)
);

create index fight_replacements_fight_date_idx on public.fight_replacements(fight_id, effective_at desc);
create index fight_replacements_event_status_idx on public.fight_replacements(event_id, status);
alter table public.fight_replacements enable row level security;

comment on table public.fight_replacements is 'Immutable audit of red or blue corner replacements; fight mutation remains an application use case.';

commit;

-- Rollback (manual, after export): drop table public.fight_replacements.
