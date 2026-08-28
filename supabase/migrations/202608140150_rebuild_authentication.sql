begin;

-- Development reset requested before rebuilding authentication. Reference data
-- (roles, permissions, geography, disciplines) is intentionally preserved.
truncate table public.events cascade;
truncate table auth.users cascade;

drop trigger if exists zz_assign_registration_primary_role on auth.users;
drop function if exists public.assign_registration_primary_role();
drop function if exists public.sync_my_registration_role();
drop function if exists public.get_my_auth_context();

alter table public.profiles
  add column if not exists primary_role_id uuid references public.roles(id) on delete set null;

create index if not exists profiles_primary_role_idx
  on public.profiles(primary_role_id)
  where primary_role_id is not null;

create or replace function public.get_my_auth_context()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_user auth.users%rowtype;
  v_profile public.profiles%rowtype;
  v_role public.roles%rowtype;
  v_requested_role text;
  v_username text;
  v_business_roles jsonb := '[]'::jsonb;
  v_system_roles jsonb := '[]'::jsonb;
  v_permissions jsonb := '[]'::jsonb;
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;

  select * into v_user from auth.users where id = v_user_id;
  if not found then
    raise exception using errcode = '28000', message = 'Invalid authentication session';
  end if;

  select * into v_profile from public.profiles where id = v_user_id;

  -- A primary role is immutable through user-editable metadata once assigned.
  if v_profile.primary_role_id is not null then
    select * into v_role from public.roles where id = v_profile.primary_role_id;
  else
    v_requested_role := nullif(trim(v_user.raw_user_meta_data ->> 'primary_role'), '');
    if v_requested_role not in (
      'federation', 'league', 'club', 'coach', 'fighter', 'organizer',
      'referee', 'judge', 'sponsor', 'seller', 'fan'
    ) then
      raise exception using errcode = '22023', message = 'A valid registration role is required';
    end if;

    select * into v_role from public.roles where slug = v_requested_role limit 1;
    if v_role.id is null then
      raise exception using errcode = '23503', message = 'Registration role is not configured';
    end if;
  end if;

  if v_profile.id is null then
    v_username := concat(
      left(
        regexp_replace(
          coalesce(nullif(trim(v_user.raw_user_meta_data ->> 'username'), ''), split_part(v_user.email, '@', 1)),
          '[^a-zA-Z0-9_.-]', '-', 'g'
        ),
        20
      ),
      '-',
      left(v_user_id::text, 8)
    );

    insert into public.profiles(
      id, full_name, username, email, region_id, city_id, status, primary_role_id
    ) values (
      v_user_id,
      coalesce(nullif(trim(v_user.raw_user_meta_data ->> 'full_name'), ''), split_part(v_user.email, '@', 1)),
      v_username,
      v_user.email,
      nullif(v_user.raw_user_meta_data ->> 'region_id', '')::uuid,
      nullif(v_user.raw_user_meta_data ->> 'city_id', '')::uuid,
      'active',
      v_role.id
    ) returning * into v_profile;
  elsif v_profile.primary_role_id is null then
    update public.profiles
      set primary_role_id = v_role.id,
          status = coalesce(status, 'active')
      where id = v_user_id
      returning * into v_profile;
  end if;

  insert into public.profile_roles(profile_id, role_id)
  values(v_user_id, v_role.id)
  on conflict(profile_id, role_id) do nothing;

  select coalesce(jsonb_agg(to_jsonb(role_row) order by (role_row.id = v_profile.primary_role_id) desc, role_row.label), '[]'::jsonb)
  into v_business_roles
  from (
    select r.id, r.slug, r.label, r.description, r.is_organization, r.created_at
    from public.profile_roles pr
    join public.roles r on r.id = pr.role_id
    where pr.profile_id = v_user_id
  ) role_row;

  select coalesce(jsonb_agg(to_jsonb(system_role_row) order by system_role_row.label), '[]'::jsonb)
  into v_system_roles
  from (
    select sr.id, sr.code, sr.label, sr.description, sr.created_at
    from public.profile_system_roles psr
    join public.system_roles sr on sr.id = psr.system_role_id
    where psr.profile_id = v_user_id
  ) system_role_row;

  select coalesce(jsonb_agg(to_jsonb(permission_row) order by permission_row.code), '[]'::jsonb)
  into v_permissions
  from (
    select distinct p.id, p.code, p.description
    from public.profile_system_roles psr
    join public.role_permissions rp on rp.role_id = psr.system_role_id
    join public.permissions p on p.id = rp.permission_id
    where psr.profile_id = v_user_id
  ) permission_row;

  return jsonb_build_object(
    'primaryRole', v_role.slug,
    'profile', jsonb_build_object(
      'id', v_profile.id,
      'fullName', v_profile.full_name,
      'email', v_profile.email,
      'status', v_profile.status
    ),
    'roles', v_business_roles,
    'systemRoles', v_system_roles,
    'permissions', v_permissions
  );
end;
$$;

revoke all on function public.get_my_auth_context() from public, anon;
grant execute on function public.get_my_auth_context() to authenticated;

commit;
