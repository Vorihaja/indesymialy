begin;

alter table public.fight_official_assignments
  drop constraint if exists fight_official_assignments_role_check;
alter table public.fight_official_assignments
  add constraint fight_official_assignments_role_check
  check (role in ('referee','judge','timekeeper','doctor','supervisor'));

alter table public.fight_official_assignments
  drop constraint if exists fight_official_assignments_status_check;
alter table public.fight_official_assignments
  add constraint fight_official_assignments_status_check
  check (status is null or status in ('assigned','confirmed','declined','cancelled','completed'));

commit;
