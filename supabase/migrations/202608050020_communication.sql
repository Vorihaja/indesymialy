-- STAB-003 Communication blueprint. PREPARED ONLY.
begin;

create table public.conversation_user_preferences (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  is_favorite boolean not null default false,
  is_archived boolean not null default false,
  locally_deleted_at timestamptz,
  muted_until timestamptz,
  updated_at timestamptz not null default now(),
  constraint conversation_user_preferences_key unique(conversation_id, profile_id)
);
create index conversation_user_preferences_profile_updated_idx
  on public.conversation_user_preferences(profile_id, updated_at desc);

create table public.communication_blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_profile_id uuid not null references public.profiles(id) on delete cascade,
  blocked_profile_id uuid not null references public.profiles(id) on delete cascade,
  reason text,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  constraint communication_blocks_not_self check (blocker_profile_id <> blocked_profile_id)
);
create unique index communication_blocks_active_key
  on public.communication_blocks(blocker_profile_id, blocked_profile_id) where revoked_at is null;
create index communication_blocks_blocked_idx on public.communication_blocks(blocked_profile_id, created_at desc);

create table public.message_delivery_receipts (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('sent','delivered','read')),
  occurred_at timestamptz not null default now(),
  constraint message_delivery_receipts_key unique(message_id, profile_id, status)
);
create index message_delivery_receipts_profile_date_idx
  on public.message_delivery_receipts(profile_id, occurred_at desc);

create table public.notification_preferences (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  in_app_enabled boolean not null default true,
  email_enabled boolean not null default true,
  push_enabled boolean not null default false,
  enabled_categories text[] not null default array[
    'message','fight_proposal','sponsoring','event','fight_live','role',
    'moderation','marketplace','club','system','security'
  ],
  frequency text not null default 'instant' check (frequency in ('instant','daily','weekly')),
  muted_until timestamptz,
  quiet_hours_start time,
  quiet_hours_end time,
  role_overrides jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint notification_preferences_quiet_hours_check check (
    (quiet_hours_start is null) = (quiet_hours_end is null)
  )
);

create table public.fight_proposal_history (
  id uuid primary key default gen_random_uuid(),
  fight_proposal_id uuid not null references public.fight_proposals(id) on delete cascade,
  from_status text,
  to_status text not null check (to_status in ('draft','pending','accepted','refused','countered','cancelled')),
  changed_by uuid references public.profiles(id) on delete set null,
  snapshot jsonb not null default '{}'::jsonb,
  note text,
  created_at timestamptz not null default now()
);
create index fight_proposal_history_proposal_date_idx
  on public.fight_proposal_history(fight_proposal_id, created_at);

create table public.sponsor_offer_history (
  id uuid primary key default gen_random_uuid(),
  sponsor_offer_id uuid not null references public.sponsor_offers(id) on delete cascade,
  from_status text,
  to_status text not null check (to_status in ('draft','pending','accepted','refused','countered','cancelled')),
  changed_by uuid references public.profiles(id) on delete set null,
  snapshot jsonb not null default '{}'::jsonb,
  note text,
  created_at timestamptz not null default now()
);
create index sponsor_offer_history_offer_date_idx
  on public.sponsor_offer_history(sponsor_offer_id, created_at);

alter table public.conversation_user_preferences enable row level security;
alter table public.communication_blocks enable row level security;
alter table public.message_delivery_receipts enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.fight_proposal_history enable row level security;
alter table public.sponsor_offer_history enable row level security;

commit;
