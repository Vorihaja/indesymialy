begin;

alter table public.fights
  drop constraint if exists fights_status_check;

alter table public.fights
  add constraint fights_status_check
  check (
    status is null
    or status in (
      'scheduled',
      'ready',
      'live',
      'paused',
      'recovery',
      'completed',
      'published',
      'cancelled',
      'archived'
    )
  );

commit;
