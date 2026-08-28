-- STAB-003 Identity blueprint. PREPARED ONLY.
begin;

create table public.role_requests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete restrict,
  reason text not null check (length(btrim(reason)) between 10 and 4000),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'suspended', 'withdrawn')),
  submitted_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references public.profiles(id) on delete set null,
  decision_reason text,
  updated_at timestamptz not null default now(),
  constraint role_requests_decision_consistency check (
    (status = 'pending' and decided_at is null and decided_by is null)
    or status in ('approved', 'rejected', 'suspended', 'withdrawn')
  )
);

create unique index role_requests_one_pending_role_idx
  on public.role_requests(profile_id, role_id) where status = 'pending';
create index role_requests_profile_created_idx on public.role_requests(profile_id, submitted_at desc);
create index role_requests_status_created_idx on public.role_requests(status, submitted_at);

create table public.role_request_documents (
  id uuid primary key default gen_random_uuid(),
  role_request_id uuid not null references public.role_requests(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id) on delete restrict,
  storage_path text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes between 1 and 20971520),
  created_at timestamptz not null default now(),
  constraint role_request_documents_path_key unique (storage_path)
);
create index role_request_documents_request_idx on public.role_request_documents(role_request_id, created_at);

create table public.role_request_history (
  id uuid primary key default gen_random_uuid(),
  role_request_id uuid not null references public.role_requests(id) on delete cascade,
  from_status text,
  to_status text not null check (to_status in ('pending', 'approved', 'rejected', 'suspended', 'withdrawn')),
  changed_by uuid references public.profiles(id) on delete set null,
  reason text,
  created_at timestamptz not null default now()
);
create index role_request_history_request_date_idx on public.role_request_history(role_request_id, created_at);

create table public.onboarding_progress (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  current_step text not null default 'profile'
    check (current_step in ('profile','disciplines','role','organization','documents','review','success')),
  completed_steps text[] not null default '{}',
  draft_data jsonb not null default '{}'::jsonb,
  accepted_terms_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

create table public.account_preferences (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  theme text not null default 'system' check (theme in ('system','light','dark')),
  language text not null default 'fr',
  profile_visibility text not null default 'public' check (profile_visibility in ('public','members','private')),
  discoverable boolean not null default true,
  email_enabled boolean not null default true,
  push_enabled boolean not null default false,
  data_export_requested_at timestamptz,
  deletion_requested_at timestamptz,
  updated_at timestamptz not null default now()
);

create table public.active_organizations (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  selected_at timestamptz not null default now()
);
create index active_organizations_organization_idx on public.active_organizations(organization_id);

create table public.organization_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  invited_profile_id uuid references public.profiles(id) on delete cascade,
  invited_email text,
  invited_by uuid not null references public.profiles(id) on delete restrict,
  member_role text not null default 'member',
  token_hash text not null,
  status text not null default 'pending' check (status in ('pending','accepted','declined','expired','revoked')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint organization_invitations_target_check check (
    (invited_profile_id is not null) <> (invited_email is not null)
  ),
  constraint organization_invitations_token_hash_key unique(token_hash)
);
create index organization_invitations_org_status_idx on public.organization_invitations(organization_id, status);
create index organization_invitations_profile_idx on public.organization_invitations(invited_profile_id) where invited_profile_id is not null;

create table public.organization_internal_roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  code text not null,
  label text not null,
  permissions text[] not null default '{}',
  is_active boolean not null default true,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_internal_roles_code_key unique(organization_id, code)
);

create table public.organization_internal_role_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  internal_role_id uuid not null references public.organization_internal_roles(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  assigned_by uuid not null references public.profiles(id) on delete restrict,
  assigned_at timestamptz not null default now(),
  constraint organization_internal_role_assignments_key unique(internal_role_id, profile_id)
);
create index organization_internal_role_assignments_org_profile_idx
  on public.organization_internal_role_assignments(organization_id, profile_id);

-- Defense in depth: controlled system roles cannot be requested through this business table.
create function public.reject_controlled_role_request()
returns trigger language plpgsql security invoker set search_path = public as $$
declare requested_slug text;
begin
  select slug into requested_slug from public.roles where id = new.role_id;
  if requested_slug in ('admin', 'super_admin') then
    raise exception using errcode = '42501', message = 'Controlled system roles cannot be self-requested';
  end if;
  return new;
end;
$$;

create trigger role_requests_reject_controlled_role
before insert or update of role_id on public.role_requests
for each row execute function public.reject_controlled_role_request();

-- Active organization must correspond to an active membership or ownership.
create function public.validate_active_organization_membership()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  if not exists (
    select 1 from public.organizations o
    where o.id = new.organization_id and o.owner_id = new.profile_id
  ) and not exists (
    select 1 from public.organization_members om
    where om.organization_id = new.organization_id
      and om.profile_id = new.profile_id
      and coalesce(om.status, 'active') = 'active'
  ) then
    raise exception using errcode = '42501', message = 'Profile is not an active member of this organization';
  end if;
  return new;
end;
$$;

create trigger active_organizations_validate_membership
before insert or update on public.active_organizations
for each row execute function public.validate_active_organization_membership();

alter table public.role_requests enable row level security;
alter table public.role_request_documents enable row level security;
alter table public.role_request_history enable row level security;
alter table public.onboarding_progress enable row level security;
alter table public.account_preferences enable row level security;
alter table public.active_organizations enable row level security;
alter table public.organization_invitations enable row level security;
alter table public.organization_internal_roles enable row level security;
alter table public.organization_internal_role_assignments enable row level security;

commit;

-- Rollback order is documented in ../APPLY_ORDER.md.
