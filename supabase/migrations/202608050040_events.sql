-- STAB-003 Events and ticketing blueprint. PREPARED ONLY.
begin;

create table public.competitions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('tournament','gala','championship','camp','demonstration','weigh_in','press_conference')),
  rules text,
  status text not null default 'draft' check (status in ('draft','published','completed','cancelled','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index competitions_event_status_idx on public.competitions(event_id, status);

create table public.competition_categories (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions(id) on delete cascade,
  discipline_id uuid references public.disciplines(id) on delete restrict,
  name text not null,
  gender text,
  min_weight_kg numeric(6,2),
  max_weight_kg numeric(6,2),
  min_age integer,
  max_age integer,
  capacity integer check (capacity is null or capacity > 0),
  created_at timestamptz not null default now(),
  constraint competition_categories_name_key unique(competition_id, name),
  constraint competition_categories_weight_check check (max_weight_kg is null or min_weight_kg is null or max_weight_kg >= min_weight_kg),
  constraint competition_categories_age_check check (max_age is null or min_age is null or max_age >= min_age)
);

create table public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  competition_category_id uuid references public.competition_categories(id) on delete set null,
  applicant_profile_id uuid references public.profiles(id) on delete cascade,
  applicant_organization_id uuid references public.organizations(id) on delete cascade,
  applicant_type text not null check (applicant_type in ('fighter','club')),
  weight_kg numeric(6,2),
  license_number text,
  medical_certificate_path text,
  document_paths text[] not null default '{}',
  payment_status text not null default 'not_required' check (payment_status in ('not_required','prepared','pending','paid','refunded')),
  status text not null default 'pending' check (status in ('pending','validated','refused','waiting_list','withdrawn')),
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_registrations_applicant_check check (
    (applicant_profile_id is not null) <> (applicant_organization_id is not null)
  )
);
create index event_registrations_event_status_idx on public.event_registrations(event_id, status, submitted_at);
create unique index event_registrations_profile_active_idx
  on public.event_registrations(event_id, applicant_profile_id)
  where applicant_profile_id is not null and status not in ('refused','withdrawn');
create unique index event_registrations_org_active_idx
  on public.event_registrations(event_id, applicant_organization_id)
  where applicant_organization_id is not null and status not in ('refused','withdrawn');

create table public.event_registration_history (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.event_registrations(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by uuid references public.profiles(id) on delete set null,
  reason text,
  created_at timestamptz not null default now()
);
create index event_registration_history_registration_date_idx on public.event_registration_history(registration_id, created_at);

create table public.event_participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  participant_type text not null check (participant_type in ('fighter','club','coach','organizer','referee','judge','volunteer','staff','sponsor','seller','media')),
  status text not null default 'invited' check (status in ('invited','confirmed','declined','checked_in','completed')),
  public_visible boolean not null default false,
  created_at timestamptz not null default now(),
  constraint event_participants_subject_check check (profile_id is not null or organization_id is not null)
);
create index event_participants_event_type_idx on public.event_participants(event_id, participant_type, status);

create table public.event_schedule_items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  kind text not null check (kind in ('weigh_in','briefing','fight','break','ceremony','media','sponsor','closing')),
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  location text,
  public_visible boolean not null default false,
  notification_prepared boolean not null default false,
  created_at timestamptz not null default now(),
  constraint event_schedule_items_dates_check check (ends_at > starts_at)
);
create index event_schedule_items_event_start_idx on public.event_schedule_items(event_id, starts_at);

create table public.event_access_logs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  ticket_id uuid not null references public.tickets(id) on delete restrict,
  result text not null check (result in ('accepted','used','refused','duplicate','exit')),
  operator_profile_id uuid references public.profiles(id) on delete set null,
  zone text,
  manual boolean not null default false,
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);
create index event_access_logs_event_date_idx on public.event_access_logs(event_id, occurred_at desc);
create index event_access_logs_ticket_date_idx on public.event_access_logs(ticket_id, occurred_at desc);

create table public.event_reports (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  kind text not null check (kind in ('financial','ticketing','participants','incidents','medical','official','sponsors','audience','fight_live')),
  title text not null,
  status text not null default 'draft' check (status in ('draft','ready','published','archived')),
  content jsonb not null default '{}'::jsonb,
  created_by uuid not null references public.profiles(id) on delete restrict,
  generated_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now()
);
create index event_reports_event_kind_idx on public.event_reports(event_id, kind, created_at desc);

create table public.event_report_exports (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.event_reports(id) on delete cascade,
  format text not null check (format in ('pdf','csv','json')),
  storage_path text not null unique,
  generated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.event_sponsor_deliverables (
  id uuid primary key default gen_random_uuid(),
  event_sponsor_id uuid not null references public.event_sponsors(id) on delete cascade,
  title text not null,
  due_at timestamptz,
  status text not null default 'todo' check (status in ('todo','in_progress','delivered','validated','cancelled')),
  validated_by uuid references public.profiles(id) on delete set null,
  validated_at timestamptz,
  created_at timestamptz not null default now()
);
create index event_sponsor_deliverables_sponsor_status_idx on public.event_sponsor_deliverables(event_sponsor_id, status);

create table public.event_checklist_comments (
  id uuid primary key default gen_random_uuid(),
  checklist_id uuid not null references public.event_checklists(id) on delete cascade,
  author_profile_id uuid not null references public.profiles(id) on delete restrict,
  content text not null check (length(btrim(content)) between 1 and 4000),
  attachment_path text,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index event_checklist_comments_checklist_date_idx on public.event_checklist_comments(checklist_id, created_at);

create table public.ticket_reservations (
  id uuid primary key default gen_random_uuid(),
  ticket_type_id uuid not null references public.ticket_types(id) on delete restrict,
  customer_profile_id uuid references public.profiles(id) on delete cascade,
  customer_email text not null,
  quantity integer not null check (quantity > 0),
  status text not null default 'held' check (status in ('held','confirmed','expired','cancelled','converted')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index ticket_reservations_type_status_expiry_idx on public.ticket_reservations(ticket_type_id, status, expires_at);
create index ticket_reservations_customer_idx on public.ticket_reservations(customer_profile_id, created_at desc);

create table public.ticket_refunds (
  id uuid primary key default gen_random_uuid(),
  ticket_sale_id uuid not null references public.ticket_sales(id) on delete restrict,
  requested_by uuid references public.profiles(id) on delete set null,
  amount numeric(14,2) not null check (amount > 0),
  reason text not null,
  status text not null default 'requested' check (status in ('requested','approved','rejected','processed','failed')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index ticket_refunds_sale_status_idx on public.ticket_refunds(ticket_sale_id, status);

alter table public.competitions enable row level security;
alter table public.competition_categories enable row level security;
alter table public.event_registrations enable row level security;
alter table public.event_registration_history enable row level security;
alter table public.event_participants enable row level security;
alter table public.event_schedule_items enable row level security;
alter table public.event_access_logs enable row level security;
alter table public.event_reports enable row level security;
alter table public.event_report_exports enable row level security;
alter table public.event_sponsor_deliverables enable row level security;
alter table public.event_checklist_comments enable row level security;
alter table public.ticket_reservations enable row level security;
alter table public.ticket_refunds enable row level security;

commit;
