-- ERP-ORG-003 event finance ledger. PREPARED ONLY.
begin;

create table public.event_budgets (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete restrict,
  version integer not null default 1 check (version > 0),
  name text not null,
  currency_code text not null default 'MGA' check (currency_code ~ '^[A-Z]{3}$'),
  status text not null default 'draft' check (status in ('draft','submitted','approved','closed','archived')),
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  closed_by uuid references public.profiles(id) on delete set null,
  closed_at timestamptz,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_budgets_event_version_key unique(event_id, version),
  constraint event_budgets_approval_check check (status not in ('approved','closed') or approved_at is not null),
  constraint event_budgets_closure_check check (status <> 'closed' or closed_at is not null)
);
create index event_budgets_event_status_idx on public.event_budgets(event_id, status, version desc);

create table public.event_budget_lines (
  id uuid primary key default gen_random_uuid(),
  event_budget_id uuid not null references public.event_budgets(id) on delete cascade,
  line_type text not null check (line_type in ('revenue','expense')),
  category_code text not null,
  label text not null,
  forecast_amount numeric(14,2) not null default 0 check (forecast_amount >= 0),
  committed_amount numeric(14,2) not null default 0 check (committed_amount >= 0),
  actual_amount numeric(14,2) not null default 0 check (actual_amount >= 0),
  position integer not null default 0 check (position >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_budget_lines_budget_position_key unique(event_budget_id, position)
);
create index event_budget_lines_budget_type_idx on public.event_budget_lines(event_budget_id, line_type, category_code);

create table public.event_transactions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete restrict,
  budget_line_id uuid references public.event_budget_lines(id) on delete set null,
  transaction_type text not null check (transaction_type in ('revenue','expense')),
  category_code text not null,
  description text not null,
  amount numeric(14,2) not null check (amount > 0),
  currency_code text not null default 'MGA' check (currency_code ~ '^[A-Z]{3}$'),
  status text not null default 'planned' check (status in ('planned','committed','pending','paid','cancelled','failed')),
  due_at timestamptz,
  occurred_at timestamptz,
  paid_at timestamptz,
  counterparty_organization_id uuid references public.organizations(id) on delete set null,
  ticket_sale_id uuid references public.ticket_sales(id) on delete set null,
  event_sponsor_id uuid references public.event_sponsors(id) on delete set null,
  staff_payment_id uuid references public.staff_payments(id) on delete set null,
  official_payment_id uuid references public.official_payments(id) on delete set null,
  reference text,
  recorded_by uuid not null references public.profiles(id) on delete restrict,
  approved_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_transactions_paid_check check (status <> 'paid' or paid_at is not null)
);
create index event_transactions_event_status_idx on public.event_transactions(event_id, status, due_at);
create index event_transactions_event_type_idx on public.event_transactions(event_id, transaction_type, category_code);
create unique index event_transactions_ticket_sale_idx on public.event_transactions(ticket_sale_id) where ticket_sale_id is not null;
create unique index event_transactions_staff_payment_idx on public.event_transactions(staff_payment_id) where staff_payment_id is not null;
create unique index event_transactions_official_payment_idx on public.event_transactions(official_payment_id) where official_payment_id is not null;

alter table public.event_budgets enable row level security;
alter table public.event_budget_lines enable row level security;
alter table public.event_transactions enable row level security;

comment on table public.event_transactions is 'Event ledger. Organization transactions and club_transactions are intentionally not repurposed.';

commit;

-- Rollback (manual, after signed financial export): drop event_transactions,
-- event_budget_lines, then event_budgets.
