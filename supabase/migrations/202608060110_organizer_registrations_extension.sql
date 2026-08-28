-- ERP-ORG-003 registration extensions over STAB-003 event_registrations. PREPARED ONLY.
begin;

alter table public.event_registrations
  add column if not exists eligibility_status text not null default 'pending',
  add column if not exists reviewed_by uuid references public.profiles(id) on delete set null,
  add column if not exists reviewed_at timestamptz,
  add column if not exists decision_reason text,
  add column if not exists waitlist_position integer;

alter table public.event_registrations
  add constraint event_registrations_eligibility_check check (eligibility_status in ('pending','eligible','ineligible','waiver_required')),
  add constraint event_registrations_review_check check (
    (status = 'pending' and reviewed_at is null)
    or status <> 'pending'
  ),
  add constraint event_registrations_waitlist_check check (
    (status = 'waiting_list' and waitlist_position is not null and waitlist_position > 0)
    or (status <> 'waiting_list' and waitlist_position is null)
  );

create unique index event_registrations_waitlist_position_idx
  on public.event_registrations(event_id, competition_category_id, waitlist_position)
  where status = 'waiting_list';
create index event_registrations_review_idx on public.event_registrations(event_id, eligibility_status, reviewed_at);

comment on table public.event_registrations is 'Single STAB-003 registration model for fighters and clubs; no parallel club registration table.';

commit;

-- Rollback (manual): drop the two indexes, three constraints and five columns added above.
