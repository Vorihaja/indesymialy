begin;

update public.roles
set
  label = 'Officiel',
  description = 'Fonctions officielles de compétition',
  is_organization = false
where slug = 'official';

insert into public.roles (slug, label, description, is_organization)
select
  'official',
  'Officiel',
  'Fonctions officielles de compétition',
  false
where not exists (
  select 1
  from public.roles
  where slug = 'official'
);

with official_role as (
  select id
  from public.roles
  where slug = 'official'
),
legacy_profiles as (
  select pr.profile_id
  from public.profile_roles pr
  join public.roles legacy_role on legacy_role.id = pr.role_id
  where legacy_role.slug in ('referee', 'judge')
    and pr.profile_id is not null

  union

  select p.id
  from public.profiles p
  join public.roles legacy_role on legacy_role.id = p.primary_role_id
  where legacy_role.slug in ('referee', 'judge')
)
insert into public.profile_roles (profile_id, role_id)
select legacy_profile.profile_id, official_role.id
from legacy_profiles legacy_profile
cross join official_role
where not exists (
  select 1
  from public.profile_roles existing
  where existing.profile_id = legacy_profile.profile_id
    and existing.role_id = official_role.id
);

with official_role as (
  select id
  from public.roles
  where slug = 'official'
),
legacy_permissions as (
  select distinct rp.permission_id
  from public.role_permissions rp
  join public.roles legacy_role on legacy_role.id = rp.role_id
  where legacy_role.slug in ('referee', 'judge')
)
insert into public.role_permissions (role_id, permission_id)
select official_role.id, legacy_permission.permission_id
from official_role
cross join legacy_permissions legacy_permission
where not exists (
  select 1
  from public.role_permissions existing
  where existing.role_id = official_role.id
    and existing.permission_id = legacy_permission.permission_id
);

commit;
