begin;

drop trigger if exists zz_assign_registration_primary_role on auth.users;
drop function if exists public.assign_registration_primary_role();

create or replace function public.sync_my_registration_role()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_user auth.users%rowtype;
  v_role_slug text;
  v_role_id uuid;
  v_username text;
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;

  select * into v_user
  from auth.users
  where id = v_user_id;

  v_role_slug := nullif(trim(v_user.raw_user_meta_data ->> 'primary_role'), '');

  if v_role_slug not in (
    'federation', 'league', 'club', 'coach', 'fighter', 'organizer',
    'referee', 'judge', 'sponsor', 'seller', 'fan'
  ) then
    raise exception using errcode = '22023', message = 'A valid registration role is required';
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
  where id = v_user_id;

  if not found then
    v_username := concat(
      left(
        regexp_replace(
          coalesce(nullif(trim(v_user.raw_user_meta_data ->> 'username'), ''), split_part(v_user.email, '@', 1)),
          '[^a-zA-Z0-9_.-]',
          '-',
          'g'
        ),
        20
      ),
      '-',
      left(v_user_id::text, 8)
    );

    insert into public.profiles(
      id, full_name, username, email, region_id, city_id,
      status, primary_role_id
    )
    values(
      v_user_id,
      coalesce(nullif(trim(v_user.raw_user_meta_data ->> 'full_name'), ''), split_part(v_user.email, '@', 1)),
      v_username,
      v_user.email,
      nullif(v_user.raw_user_meta_data ->> 'region_id', '')::uuid,
      nullif(v_user.raw_user_meta_data ->> 'city_id', '')::uuid,
      'active',
      v_role_id
    );
  end if;

  insert into public.profile_roles(profile_id, role_id)
  values(v_user_id, v_role_id)
  on conflict(profile_id, role_id) do nothing;

  return v_role_slug;
end;
$$;

revoke all on function public.sync_my_registration_role() from public, anon;
grant execute on function public.sync_my_registration_role() to authenticated;

commit;
