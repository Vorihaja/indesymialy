-- ERP-ORG-003 extension of STAB-003 event_schedule_items. PREPARED ONLY.
begin;

alter table public.event_schedule_items drop constraint if exists event_schedule_items_kind_check;
alter table public.event_schedule_items
  add constraint event_schedule_items_kind_check check (kind in (
    'setup','weigh_in','briefing','medical','security','ticketing','doors_open',
    'fight','break','ceremony','media','sponsor','broadcast','awards','closing','teardown'
  ));

alter table public.event_schedule_items
  add column if not exists position integer not null default 0,
  add column if not exists responsible_profile_id uuid references public.profiles(id) on delete set null,
  add column if not exists status text not null default 'planned',
  add column if not exists notes text,
  add column if not exists updated_at timestamptz not null default now();

alter table public.event_schedule_items
  add constraint event_schedule_items_position_check check (position >= 0),
  add constraint event_schedule_items_status_check check (status in ('planned','confirmed','in_progress','delayed','completed','cancelled'));

create unique index event_schedule_items_event_position_idx on public.event_schedule_items(event_id, position);
create index event_schedule_items_responsible_idx on public.event_schedule_items(responsible_profile_id, starts_at) where responsible_profile_id is not null;

comment on table public.event_schedule_items is 'Single organizer run-of-show and public schedule model; no parallel planning table.';

commit;

-- Rollback (manual): drop new indexes/constraints/columns and restore the STAB-003 kind constraint.
