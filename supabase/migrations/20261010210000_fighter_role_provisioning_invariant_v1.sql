begin;

do $$
begin
  if not exists (
    select 1
    from public.roles
    where slug = 'fighter'
  ) then
    raise exception 'Canonical fighter business role is not configured';
  end if;
end;
$$;

create or replace function public.ensure_fighter_for_profile(
  target_profile_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  fighter_role_id uuid;
  fighter_full_name text;
begin
  if target_profile_id is null then
    raise exception using
      errcode = '22023',
      message = 'A profile id is required to provision a fighter';
  end if;

  select r.id
  into fighter_role_id
  from public.roles r
  where r.slug = 'fighter';

  if not found then
    raise exception 'Canonical fighter business role is not configured';
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.id = target_profile_id
  ) then
    raise exception using
      errcode = '23503',
      message = 'The profile to provision does not exist';
  end if;

  select p.full_name
  into fighter_full_name
  from public.profiles p
  where p.id = target_profile_id
    and p.status = 'active'
    and exists (
      select 1
      from public.profile_roles pr
      where pr.profile_id = p.id
        and pr.role_id = fighter_role_id
    )
  for update;

  if not found then
    return;
  end if;

  insert into public.fighters(profile_id, full_name, status)
  values (target_profile_id, fighter_full_name, 'active')
  on conflict (profile_id) do nothing;
end;
$function$;

create or replace function public.provision_fighter_for_role_assignment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  fighter_role_id uuid;
begin
  select r.id
  into fighter_role_id
  from public.roles r
  where r.slug = 'fighter';

  if new.role_id = fighter_role_id then
    perform public.ensure_fighter_for_profile(new.profile_id);
  end if;

  return new;
end;
$function$;

create or replace function public.provision_fighter_for_profile_activation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if new.status <> 'active' then
    return new;
  end if;

  if exists (
    select 1
    from public.profile_roles pr
    join public.roles r on r.id = pr.role_id
    where pr.profile_id = new.id
      and r.slug = 'fighter'
  ) then
    perform public.ensure_fighter_for_profile(new.id);
  end if;

  return new;
end;
$function$;

drop trigger if exists profile_roles_provision_fighter_insert
on public.profile_roles;

create trigger profile_roles_provision_fighter_insert
after insert on public.profile_roles
for each row
execute function public.provision_fighter_for_role_assignment();

drop trigger if exists profile_roles_provision_fighter_update
on public.profile_roles;

create trigger profile_roles_provision_fighter_update
after update of profile_id, role_id on public.profile_roles
for each row
execute function public.provision_fighter_for_role_assignment();

drop trigger if exists profiles_provision_fighter_insert
on public.profiles;

create trigger profiles_provision_fighter_insert
after insert on public.profiles
for each row
execute function public.provision_fighter_for_profile_activation();

drop trigger if exists profiles_provision_fighter_activation
on public.profiles;

create trigger profiles_provision_fighter_activation
after update of primary_role_id, status on public.profiles
for each row
execute function public.provision_fighter_for_profile_activation();

revoke all on function public.ensure_fighter_for_profile(uuid)
from public, anon, authenticated, service_role;

revoke all on function public.provision_fighter_for_role_assignment()
from public, anon, authenticated, service_role;

revoke all on function public.provision_fighter_for_profile_activation()
from public, anon, authenticated, service_role;

alter table public.fighters
  alter column status set default 'active';

do $$
declare
  profile_row record;
  missing_fighter_count bigint;
begin
  for profile_row in
    select p.id
    from public.profiles p
    where p.status = 'active'
      and exists (
        select 1
        from public.profile_roles pr
        join public.roles r on r.id = pr.role_id
        where pr.profile_id = p.id
          and r.slug = 'fighter'
      )
      and not exists (
        select 1
        from public.fighters f
        where f.profile_id = p.id
      )
    order by p.id
  loop
    perform public.ensure_fighter_for_profile(profile_row.id);
  end loop;

  select count(*)
  into missing_fighter_count
  from public.profiles p
  where p.status = 'active'
    and exists (
      select 1
      from public.profile_roles pr
      join public.roles r on r.id = pr.role_id
      where pr.profile_id = p.id
        and r.slug = 'fighter'
    )
    and not exists (
      select 1
      from public.fighters f
      where f.profile_id = p.id
    );

  if missing_fighter_count <> 0 then
    raise exception
      'Fighter provisioning invariant failed: % active fighter profiles have no fighter row',
      missing_fighter_count;
  end if;
end;
$$;

commit;
