-- ERP-ORG-003 organizer event extensions. PREPARED ONLY.
begin;

alter table public.events
  add column if not exists starts_at timestamptz,
  add column if not exists ends_at timestamptz,
  add column if not exists timezone_name text not null default 'Africa/Nairobi',
  add column if not exists capacity integer,
  add column if not exists visibility text not null default 'private',
  add column if not exists published_at timestamptz,
  add column if not exists postponed_from timestamptz,
  add column if not exists postponement_reason text;

alter table public.events
  add constraint events_dates_check check (ends_at is null or starts_at is null or ends_at > starts_at),
  add constraint events_capacity_check check (capacity is null or capacity > 0),
  add constraint events_visibility_check check (visibility in ('private','unlisted','public')),
  add constraint events_publication_check check (published_at is null or visibility <> 'private'),
  add constraint events_timezone_check check (length(btrim(timezone_name)) between 1 and 100);

create index events_organizer_start_idx on public.events(organizer_id, starts_at);
create index events_public_start_idx on public.events(starts_at) where visibility = 'public' and published_at is not null;

alter table public.event_checklists
  add column if not exists category text,
  add column if not exists priority text not null default 'normal',
  add column if not exists due_at timestamptz,
  add column if not exists assigned_to uuid references public.profiles(id) on delete set null,
  add column if not exists completed_at timestamptz,
  add column if not exists completed_by uuid references public.profiles(id) on delete set null;

alter table public.event_checklists
  add constraint event_checklists_event_id_fkey foreign key (event_id) references public.events(id) on delete cascade not valid;

alter table public.event_checklists
  add constraint event_checklists_priority_check check (priority in ('low','normal','high','critical')),
  add constraint event_checklists_completion_check check (
    (coalesce(is_completed, false) = false and completed_at is null)
    or coalesce(is_completed, false) = true
  );

create index event_checklists_event_due_idx on public.event_checklists(event_id, is_completed, due_at);
create index event_checklists_assignee_idx on public.event_checklists(assigned_to, due_at) where assigned_to is not null;

create table public.event_lifecycle_history (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  action text not null check (action in ('created','updated','published','unpublished','postponed','cancelled','archived','restored')),
  from_status text,
  to_status text,
  changed_by uuid references public.profiles(id) on delete set null,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index event_lifecycle_history_event_date_idx on public.event_lifecycle_history(event_id, created_at desc);
alter table public.event_lifecycle_history enable row level security;

comment on table public.event_lifecycle_history is 'Auditable organizer event lifecycle; replaces ambiguous status_history usage for events.';
comment on column public.events.starts_at is 'Business start date, never inferred from created_at.';

commit;

-- Rollback (manual, after export): drop event_lifecycle_history; drop the new checklist
-- indexes/columns and event indexes/constraints/columns in reverse dependency order.
