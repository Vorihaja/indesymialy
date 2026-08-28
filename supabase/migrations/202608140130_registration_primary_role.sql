begin;

alter table public.profiles
  add column if not exists primary_role_id uuid references public.roles(id) on delete set null;

create index if not exists profiles_primary_role_idx
  on public.profiles(primary_role_id)
  where primary_role_id is not null;

create or replace function public.assign_registration_primary_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role_slug text := nullif(trim(new.raw_user_meta_data ->> 'primary_role'), '');
  v_role_id uuid;
begin
  if v_role_slug is null then
    return new;
  end if;

  if v_role_slug not in (
    'federation', 'league', 'club', 'coach', 'fighter', 'organizer',
    'referee', 'judge', 'sponsor', 'seller', 'fan'
  ) then
    raise exception using errcode = '22023', message = 'Invalid registration role';
  end if;

  select id into v_role_id
  from public.roles
  where slug = v_role_slug
  limit 1;

  if v_role_id is null then
    raise exception using errcode = '23503', message = 'Registration role is not configured';
  end if;

  update public.profiles
  set primary_role_id = v_role_id
  where id = new.id;

  if not found then
    insert into public.profiles(
      id, full_name, username, email, region_id, city_id,
      status, primary_role_id
    )
    values(
      new.id,
      coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)),
      coalesce(nullif(trim(new.raw_user_meta_data ->> 'username'), ''), split_part(new.email, '@', 1)),
      new.email,
      nullif(new.raw_user_meta_data ->> 'region_id', '')::uuid,
      nullif(new.raw_user_meta_data ->> 'city_id', '')::uuid,
      'active',
      v_role_id
    );
  end if;

  insert into public.profile_roles(profile_id, role_id)
  values(new.id, v_role_id)
  on conflict(profile_id, role_id) do nothing;

  return new;
end;
$$;

revoke all on function public.assign_registration_primary_role() from public, anon, authenticated;

drop trigger if exists zz_assign_registration_primary_role on auth.users;
create trigger zz_assign_registration_primary_role
after insert on auth.users
for each row execute function public.assign_registration_primary_role();

with registration_roles as (
  select
    users.id as profile_id,
    roles.id as role_id
  from auth.users users
  join public.roles roles
    on roles.slug = nullif(trim(users.raw_user_meta_data ->> 'primary_role'), '')
  where roles.slug in (
    'federation', 'league', 'club', 'coach', 'fighter', 'organizer',
    'referee', 'judge', 'sponsor', 'seller', 'fan'
  )
)
update public.profiles profiles
set primary_role_id = registration_roles.role_id
from registration_roles
where profiles.id = registration_roles.profile_id
  and profiles.primary_role_id is distinct from registration_roles.role_id;

insert into public.profile_roles(profile_id, role_id)
select users.id, roles.id
from auth.users users
join public.roles roles
  on roles.slug = nullif(trim(users.raw_user_meta_data ->> 'primary_role'), '')
join public.profiles profiles
  on profiles.id = users.id
where roles.slug in (
  'federation', 'league', 'club', 'coach', 'fighter', 'organizer',
  'referee', 'judge', 'sponsor', 'seller', 'fan'
)
on conflict(profile_id, role_id) do nothing;

commit;
