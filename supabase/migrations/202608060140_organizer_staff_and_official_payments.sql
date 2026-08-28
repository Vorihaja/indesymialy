-- ERP-ORG-003 staff and official operations. PREPARED ONLY.
begin;

alter table public.staff_assignments
  add column if not exists profile_id uuid references public.profiles(id) on delete set null,
  add column if not exists zone text,
  add column if not exists availability_status text not null default 'unknown',
  add column if not exists confirmed_at timestamptz,
  add column if not exists starts_at timestamptz,
  add column if not exists ends_at timestamptz,
  add column if not exists compensation_amount numeric(14,2),
  add column if not exists currency_code text not null default 'MGA';

alter table public.staff_assignments
  add constraint staff_assignments_event_id_fkey foreign key (event_id) references public.events(id) on delete cascade not valid;

alter table public.staff_assignments
  add constraint staff_assignments_availability_check check (availability_status in ('unknown','available','unavailable','tentative')),
  add constraint staff_assignments_shift_check check (ends_at is null or starts_at is null or ends_at > starts_at),
  add constraint staff_assignments_compensation_check check (compensation_amount is null or compensation_amount >= 0),
  add constraint staff_assignments_currency_check check (currency_code ~ '^[A-Z]{3}$');

create index staff_assignments_profile_event_idx on public.staff_assignments(profile_id, event_id) where profile_id is not null;
create index staff_assignments_event_shift_idx on public.staff_assignments(event_id, starts_at, ends_at);

create table public.staff_checkins (
  id uuid primary key default gen_random_uuid(),
  staff_assignment_id uuid not null references public.staff_assignments(id) on delete cascade,
  action text not null check (action in ('check_in','check_out','manual_correction')),
  occurred_at timestamptz not null default now(),
  recorded_by uuid not null references public.profiles(id) on delete restrict,
  zone text,
  notes text,
  created_at timestamptz not null default now()
);
create index staff_checkins_assignment_date_idx on public.staff_checkins(staff_assignment_id, occurred_at desc);

create table public.staff_payments (
  id uuid primary key default gen_random_uuid(),
  staff_assignment_id uuid not null references public.staff_assignments(id) on delete restrict,
  amount numeric(14,2) not null check (amount >= 0),
  currency_code text not null default 'MGA' check (currency_code ~ '^[A-Z]{3}$'),
  status text not null default 'prepared' check (status in ('prepared','pending','approved','paid','cancelled','failed')),
  due_at timestamptz,
  paid_at timestamptz,
  approved_by uuid references public.profiles(id) on delete set null,
  recorded_by uuid not null references public.profiles(id) on delete restrict,
  reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint staff_payments_paid_check check (status <> 'paid' or paid_at is not null)
);
create index staff_payments_assignment_status_idx on public.staff_payments(staff_assignment_id, status, due_at);

create table public.official_availability (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  official_profile_id uuid not null references public.profiles(id) on delete cascade,
  availability_status text not null default 'pending' check (availability_status in ('pending','available','unavailable','tentative')),
  available_from timestamptz,
  available_until timestamptz,
  responded_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint official_availability_dates_check check (available_until is null or available_from is null or available_until > available_from),
  constraint official_availability_event_profile_key unique(event_id, official_profile_id)
);
create index official_availability_event_status_idx on public.official_availability(event_id, availability_status);

create table public.official_payments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete restrict,
  fight_official_assignment_id uuid references public.fight_official_assignments(id) on delete set null,
  official_profile_id uuid not null references public.profiles(id) on delete restrict,
  amount numeric(14,2) not null check (amount >= 0),
  currency_code text not null default 'MGA' check (currency_code ~ '^[A-Z]{3}$'),
  status text not null default 'prepared' check (status in ('prepared','pending','approved','paid','cancelled','failed')),
  due_at timestamptz,
  paid_at timestamptz,
  approved_by uuid references public.profiles(id) on delete set null,
  recorded_by uuid not null references public.profiles(id) on delete restrict,
  reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint official_payments_paid_check check (status <> 'paid' or paid_at is not null)
);
create index official_payments_event_status_idx on public.official_payments(event_id, status, due_at);
create index official_payments_profile_idx on public.official_payments(official_profile_id, created_at desc);

alter table public.staff_checkins enable row level security;
alter table public.staff_payments enable row level security;
alter table public.official_availability enable row level security;
alter table public.official_payments enable row level security;

comment on table public.official_payments is 'Private organizer financial data; officials may not update it through RLS.';

commit;

-- Rollback (manual, after financial export): drop official_payments, official_availability,
-- staff_payments and staff_checkins, then remove staff assignment extensions.
