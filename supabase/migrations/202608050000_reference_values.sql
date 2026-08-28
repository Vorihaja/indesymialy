-- STAB-003 blueprint. PREPARED ONLY: do not apply directly to production.
begin;

create table public.platform_reference_values (
  id uuid primary key default gen_random_uuid(),
  domain text not null,
  code text not null,
  label text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint platform_reference_values_domain_code_key unique (domain, code),
  constraint platform_reference_values_domain_check check (domain in (
    'notification_type', 'support_category', 'event_category',
    'payment_type', 'document_type'
  ))
);

create index platform_reference_values_domain_active_idx
  on public.platform_reference_values (domain, is_active, sort_order);

alter table public.platform_reference_values enable row level security;
comment on table public.platform_reference_values is
  'Non-sensitive reference values. RLS policies are installed separately.';

commit;

-- Rollback: drop table public.platform_reference_values;
