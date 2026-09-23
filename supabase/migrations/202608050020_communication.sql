-- STAB-003 Communication blueprint. PREPARED ONLY.
begin;

-- The production project already contained these core messaging tables when
-- the STAB-003 extension was written.  They belong here because every table
-- below depends on them and a fresh migration replay must not rely on an
-- untracked remote bootstrap.
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  conversation_type text default 'direct',
  title text,
  avatar_url text,
  categories text[] default array['tous'::text],
  is_archived boolean default false,
  is_pinned boolean default false,
  last_message_at timestamptz default now(),
  created_at timestamptz default now(),
  created_by uuid references public.profiles(id) on delete set null
);
create index idx_conversations_last_msg
  on public.conversations(last_message_at desc);

create table public.conversation_participants (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  role text not null default 'member',
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  organization_id uuid references public.organizations(id) on delete cascade,
  constraint conversation_participants_actor_check
    check (num_nonnulls(profile_id, organization_id) = 1),
  constraint conversation_participants_role_check
    check (role = any(array['owner'::text, 'moderator'::text, 'member'::text]))
);
create index conversation_participants_conversation_idx
  on public.conversation_participants(conversation_id);
create index conversation_participants_profile_idx
  on public.conversation_participants(profile_id) where profile_id is not null;
create unique index conversation_participants_profile_key
  on public.conversation_participants(conversation_id, profile_id) where profile_id is not null;
create index conversation_participants_organization_idx
  on public.conversation_participants(organization_id) where organization_id is not null;
create unique index conversation_participants_organization_key
  on public.conversation_participants(conversation_id, organization_id) where organization_id is not null;

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_profile_id uuid references public.profiles(id) on delete restrict,
  message_type text default 'text',
  content text,
  media_url text,
  media_type text,
  media_duration integer,
  media_thumbnail text,
  metadata jsonb,
  is_edited boolean default false,
  is_deleted boolean default false,
  deleted_at timestamptz,
  reply_to_id uuid references public.messages(id),
  sent_at timestamptz default now(),
  edited_at timestamptz,
  sender_organization_id uuid references public.organizations(id) on delete restrict,
  sent_by_profile_id uuid not null references public.profiles(id) on delete restrict,
  constraint messages_sender_actor_check
    check (num_nonnulls(sender_profile_id, sender_organization_id) = 1),
  constraint messages_personal_sender_matches_operator_check
    check (sender_profile_id is null or sender_profile_id = sent_by_profile_id)
);
create index idx_messages_conversation
  on public.messages(conversation_id, sent_at desc);
create index idx_messages_sender_profile
  on public.messages(sender_profile_id, sent_at desc) where sender_profile_id is not null;
create index idx_messages_sender_organization
  on public.messages(sender_organization_id, sent_at desc) where sender_organization_id is not null;
create index idx_messages_sent_by_profile
  on public.messages(sent_by_profile_id, sent_at desc);

create table public.message_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid references public.messages(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  file_type text,
  file_size integer,
  mime_type text,
  created_at timestamptz default now()
);

create table public.message_reads (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  read_at timestamptz default now(),
  constraint message_reads_message_profile_key unique(message_id, profile_id)
);
create index idx_reads_message on public.message_reads(message_id);
create index message_reads_profile_date_idx
  on public.message_reads(profile_id, read_at desc);

create table public.conversation_user_preferences (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  is_favorite boolean not null default false,
  is_archived boolean not null default false,
  locally_deleted_at timestamptz,
  muted_until timestamptz,
  unread_count integer not null default 0
    constraint conversation_user_preferences_unread_check check (unread_count >= 0),
  last_read_at timestamptz,
  is_pinned boolean not null default false,
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
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;
alter table public.message_attachments enable row level security;
alter table public.message_reads enable row level security;
alter table public.communication_blocks enable row level security;
alter table public.message_delivery_receipts enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.fight_proposal_history enable row level security;
alter table public.sponsor_offer_history enable row level security;

commit;
