-- ERP-ORG-003 organizer and event access preferences. PREPARED ONLY.
begin;

create table public.organizer_preferences (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  default_event_id uuid references public.events(id) on delete set null,
  dashboard_density text not null default 'comfortable' check (dashboard_density in ('compact','comfortable')),
  notification_channels text[] not null default array['in_app']::text[],
  timezone_name text not null default 'Africa/Nairobi',
  locale text not null default 'fr',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(profile_id, organization_id),
  constraint organizer_preferences_channels_check check (notification_channels <@ array['in_app','email','sms']::text[]),
  constraint organizer_preferences_timezone_check check (length(btrim(timezone_name)) between 1 and 100)
);
create index organizer_preferences_org_idx on public.organizer_preferences(organization_id);

create table public.event_access_settings (
  event_id uuid primary key references public.events(id) on delete cascade,
  public_registration_enabled boolean not null default false,
  club_registration_enabled boolean not null default false,
  ticket_sales_enabled boolean not null default false,
  access_scan_enabled boolean not null default false,
  registration_opens_at timestamptz,
  registration_closes_at timestamptz,
  sales_opens_at timestamptz,
  sales_closes_at timestamptz,
  updated_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_access_settings_registration_dates_check check (registration_closes_at is null or registration_opens_at is null or registration_closes_at > registration_opens_at),
  constraint event_access_settings_sales_dates_check check (sales_closes_at is null or sales_opens_at is null or sales_closes_at > sales_opens_at)
);

create table public.event_internal_role_grants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  internal_role_id uuid not null references public.organization_internal_roles(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  granted_by uuid not null references public.profiles(id) on delete restrict,
  starts_at timestamptz,
  ends_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint event_internal_role_grants_dates_check check (ends_at is null or starts_at is null or ends_at > starts_at)
);
create unique index event_internal_role_grants_active_idx
  on public.event_internal_role_grants(event_id, internal_role_id, profile_id)
  where revoked_at is null;
create index event_internal_role_grants_profile_idx on public.event_internal_role_grants(profile_id, event_id) where revoked_at is null;

alter table public.organizer_preferences enable row level security;
alter table public.event_access_settings enable row level security;
alter table public.event_internal_role_grants enable row level security;

comment on table public.event_internal_role_grants is 'Event-scoped grants over STAB-003 organization internal roles; no competing permission model.';

commit;

-- Rollback (manual): drop event_internal_role_grants, event_access_settings,
-- then organizer_preferences.
