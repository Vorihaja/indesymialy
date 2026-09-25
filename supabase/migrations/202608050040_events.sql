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
    (applicant_type = 'fighter' and applicant_profile_id is not null and applicant_organization_id is null)
    or (applicant_type = 'club' and applicant_organization_id is not null and applicant_profile_id is null)
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
  constraint event_participants_subject_check check (num_nonnulls(profile_id, organization_id) = 1)
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

-- Fight Live authority recovered from the deployed project. These objects must
-- exist before the three Fight Live RPC migrations that immediately follow.
create table public.fight_action_categories (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  sort_order integer default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table public.fight_methods (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  category text not null,
  description text,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table public.fight_action_types (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.fight_action_categories(id),
  code text not null unique,
  name text not null,
  description text,
  icon text,
  color text,
  sort_order integer default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table public.fight_action_values (
  id uuid primary key default gen_random_uuid(),
  discipline_id uuid not null references public.disciplines(id),
  action_type_id uuid not null references public.fight_action_types(id),
  score numeric,
  score_label text,
  ends_match boolean default false,
  victory_method_id uuid references public.fight_methods(id),
  created_at timestamptz default now(),
  unique(discipline_id, action_type_id)
);

create table public.fight_event_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  category text not null,
  description text,
  is_active boolean default true
);

create table public.fight_event_actions (
  id uuid primary key default gen_random_uuid(),
  event_code text not null,
  reaction_type text not null,
  parameters jsonb default '{}',
  created_at timestamptz default now()
);

create table public.fights (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete restrict,
  fight_order integer not null,
  fighter_red_id uuid references public.fighters(id) on delete restrict,
  fighter_blue_id uuid references public.fighters(id) on delete restrict,
  weight_category text,
  scheduled_rounds integer default 3,
  fight_type text default 'PRO',
  status text default 'scheduled',
  winner_id uuid references public.fighters(id) on delete restrict,
  method text,
  ending_round integer,
  ending_time text,
  referee_id uuid,
  created_at timestamptz default now(),
  archived_at timestamptz,
  cancellation_reason text,
  updated_at timestamptz default now(),
  discipline_id uuid not null references public.disciplines(id),
  unique(event_id, fight_order)
);

create table public.fight_rounds (
  id uuid primary key default gen_random_uuid(),
  fight_id uuid not null references public.fights(id) on delete cascade,
  round_number integer not null,
  duration_seconds integer not null default 300,
  started_at timestamptz,
  ended_at timestamptz,
  status text not null default 'pending' check (status in ('pending','active','completed','cancelled')),
  winner_id uuid references public.fighters(id),
  created_at timestamptz default now(),
  unique(fight_id, round_number)
);

create table public.fight_timer_events (
  id uuid primary key default gen_random_uuid(),
  fight_id uuid not null references public.fights(id) on delete cascade,
  round_id uuid references public.fight_rounds(id) on delete cascade,
  event_type text not null check (event_type in ('start','pause','resume','timeout','medical_timeout','technical_pause','end')),
  reason text,
  started_at timestamptz default now(),
  ended_at timestamptz,
  duration_seconds integer default 0,
  recorded_by uuid,
  created_at timestamptz default now()
);

create table public.fight_events_timeline (
  id uuid primary key default gen_random_uuid(),
  fight_id uuid not null references public.fights(id) on delete cascade,
  round_id uuid references public.fight_rounds(id) on delete cascade,
  fighter_id uuid references public.fighters(id) on delete cascade,
  action_type_id uuid references public.fight_action_types(id),
  event_type text not null default 'action' check (event_type in ('action','score','penalty','medical','decision','system')),
  event_time text,
  description text,
  recorded_by uuid,
  created_at timestamptz default now()
);

create table public.fight_live_actions (
  id uuid primary key default gen_random_uuid(),
  fight_id uuid references public.fights(id) on delete cascade,
  fighter_id uuid references public.fighters(id) on delete restrict,
  action_type text not null,
  round_number integer not null,
  action_time text,
  points_delta integer default 0,
  recorded_by uuid,
  recorded_at timestamptz default now()
);

create table public.fight_statistics (
  id uuid primary key default gen_random_uuid(),
  fight_id uuid not null references public.fights(id) on delete cascade,
  fighter_id uuid not null references public.fighters(id) on delete cascade,
  total_strikes integer default 0,
  successful_strikes integer default 0,
  takedowns_attempted integer default 0,
  takedowns_successful integer default 0,
  submissions_attempted integer default 0,
  submission_successful integer default 0,
  control_time_seconds integer default 0,
  points_scored numeric default 0,
  penalties integer default 0,
  updated_at timestamptz default now(),
  unique(fight_id, fighter_id)
);

create table public.fighter_career_stats (
  id uuid primary key default gen_random_uuid(),
  fighter_id uuid not null unique references public.fighters(id) on delete cascade,
  total_fights integer default 0,
  wins integer default 0,
  losses integer default 0,
  draws integer default 0,
  wins_by_ko integer default 0,
  wins_by_submission integer default 0,
  wins_by_decision integer default 0,
  updated_at timestamptz default now()
);

create table public.fight_scores (
  id uuid primary key default gen_random_uuid(),
  fight_id uuid not null references public.fights(id) on delete cascade,
  round_id uuid references public.fight_rounds(id) on delete cascade,
  fighter_id uuid not null references public.fighters(id) on delete cascade,
  action_type_id uuid not null references public.fight_action_types(id),
  points numeric not null default 0,
  score_label text,
  recorded_by uuid,
  recorded_at timestamptz default now(),
  is_penalty boolean default false,
  notes text
);

create table public.fight_penalties (
  id uuid primary key default gen_random_uuid(),
  fight_id uuid not null references public.fights(id) on delete cascade,
  round_id uuid references public.fight_rounds(id) on delete cascade,
  fighter_id uuid not null references public.fighters(id) on delete cascade,
  penalty_type text not null check (penalty_type in ('WARNING','POINT_DEDUCTION','FOUL','TECHNICAL_FOUL','DISQUALIFICATION')),
  points_deducted numeric default 0,
  reason text,
  issued_by uuid,
  issued_at timestamptz default now(),
  status text default 'active' check (status in ('active','cancelled'))
);

create table public.fight_decisions (
  id uuid primary key default gen_random_uuid(),
  fight_id uuid not null references public.fights(id) on delete cascade,
  winner_id uuid references public.fighters(id),
  loser_id uuid references public.fighters(id),
  decision_type text not null check (decision_type in ('UNANIMOUS_DECISION','MAJORITY_DECISION','SPLIT_DECISION','DRAW','KO','TKO','SUBMISSION','DISQUALIFICATION','MEDICAL_STOPPAGE','NO_CONTEST')),
  victory_method_id uuid references public.fight_methods(id),
  round_number integer,
  time_of_end text,
  description text,
  decided_by uuid,
  approved_by uuid,
  created_at timestamptz default now()
);

create table public.fight_judge_cards (
  id uuid primary key default gen_random_uuid(),
  fight_id uuid not null references public.fights(id) on delete cascade,
  judge_id uuid not null,
  fighter_red_score integer default 0,
  fighter_blue_score integer default 0,
  total_rounds integer default 0,
  card_status text default 'draft' check (card_status in ('draft','submitted','validated')),
  submitted_at timestamptz,
  created_at timestamptz default now()
);

create table public.fight_judge_round_scores (
  id uuid primary key default gen_random_uuid(),
  judge_card_id uuid not null references public.fight_judge_cards(id) on delete cascade,
  round_number integer not null,
  red_score integer not null,
  blue_score integer not null,
  created_at timestamptz default now(),
  unique(judge_card_id, round_number)
);

create table public.fight_event_log (
  id uuid primary key default gen_random_uuid(),
  fight_id uuid not null references public.fights(id) on delete cascade,
  sequence_number integer not null,
  event_type text not null,
  event_code text,
  round_number integer,
  fighter_id uuid references public.fighters(id),
  recorded_by uuid,
  payload jsonb default '{}',
  source text default 'OFFICIAL_TABLE',
  operation_mode text default 'ONLINE',
  is_validated boolean default false,
  validated_by uuid,
  created_at timestamptz default now(),
  processed boolean default false,
  processed_at timestamptz,
  processing_error text,
  unique(fight_id, sequence_number)
);

create table public.fight_announcements (
  id uuid primary key default gen_random_uuid(),
  fight_id uuid not null references public.fights(id) on delete cascade,
  announcement_type text not null check (announcement_type in ('INTRODUCTION','ROUND_START','ROUND_END','TIMEOUT','PENALTY','RESULT','VICTORY','GENERAL')),
  title text,
  message text,
  announced_by uuid,
  announced_at timestamptz default now(),
  is_public boolean default true,
  created_at timestamptz default now()
);

create table public.fight_incidents (
  id uuid primary key default gen_random_uuid(),
  fight_id uuid not null references public.fights(id) on delete cascade,
  incident_type text not null check (incident_type in ('POWER_FAILURE','NETWORK_FAILURE','DEVICE_FAILURE','APPLICATION_FAILURE','DATABASE_FAILURE','HUMAN_ERROR','OTHER')),
  severity text not null check (severity in ('LOW','MEDIUM','HIGH','CRITICAL')),
  description text,
  detected_at timestamptz default now(),
  resolved_at timestamptz,
  resolved_by uuid
);

create table public.fight_official_assignments (
  id uuid primary key default gen_random_uuid(),
  fight_id uuid not null references public.fights(id) on delete cascade,
  user_id uuid not null,
  role text not null check (role in ('referee','judge','timekeeper','doctor','supervisor')),
  position integer,
  assigned_by uuid,
  assigned_at timestamptz default now(),
  status text default 'assigned' check (status is null or status in ('assigned','confirmed','declined','cancelled','completed')),
  unique(fight_id, user_id, role),
  constraint fight_official_assignments_judge_position_check check (role <> 'judge' or position between 1 and 3)
);

create table public.fight_officials (
  id uuid primary key default gen_random_uuid(),
  fight_id uuid not null references public.fights(id) on delete restrict,
  official_id uuid not null references public.profiles(id) on delete restrict,
  role text not null check (role in ('arbitre','juge','superviseur','commissaire')),
  assigned_at timestamptz default now(),
  notes text,
  created_at timestamptz default now()
);

create table public.fight_results (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  description text,
  is_active boolean default true,
  created_at timestamptz default now()
);

create index idx_fight_timer_events_fight on public.fight_timer_events(fight_id);
create index idx_fight_timer_events_round on public.fight_timer_events(round_id);
create index idx_fight_events_timeline_fight on public.fight_events_timeline(fight_id, created_at);
create index idx_fight_statistics_fighter on public.fight_statistics(fighter_id);
create index idx_fight_decisions_fight on public.fight_decisions(fight_id);

alter table public.fight_action_categories enable row level security;
alter table public.fight_methods enable row level security;
alter table public.fight_action_types enable row level security;
alter table public.fight_action_values enable row level security;
alter table public.fight_event_types enable row level security;
alter table public.fight_event_actions enable row level security;
alter table public.fights enable row level security;
alter table public.fight_rounds enable row level security;
alter table public.fight_timer_events enable row level security;
alter table public.fight_events_timeline enable row level security;
alter table public.fight_live_actions enable row level security;
alter table public.fight_statistics enable row level security;
alter table public.fighter_career_stats enable row level security;
alter table public.fight_scores enable row level security;
alter table public.fight_penalties enable row level security;
alter table public.fight_decisions enable row level security;
alter table public.fight_judge_cards enable row level security;
alter table public.fight_judge_round_scores enable row level security;
alter table public.fight_event_log enable row level security;
alter table public.fight_announcements enable row level security;
alter table public.fight_incidents enable row level security;
alter table public.fight_official_assignments enable row level security;
alter table public.fight_officials enable row level security;
alter table public.fight_results enable row level security;

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
