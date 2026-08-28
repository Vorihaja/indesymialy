begin;

create or replace function public.create_my_organization(
  p_name text, p_type text, p_description text default null,
  p_email text default null, p_phone text default null, p_website text default null,
  p_region_id uuid default null, p_city_id uuid default null, p_discipline text default null
) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_user uuid := auth.uid(); v_id uuid;
begin
  if v_user is null then raise exception using errcode='28000', message='Authentication required'; end if;
  if nullif(trim(p_name),'') is null then raise exception using errcode='22023', message='Organization name is required'; end if;
  if p_type not in ('personal','club','organizer','sponsor','seller','federation','league') then raise exception using errcode='22023', message='Invalid organization type'; end if;

  select id into v_id
  from public.organizations
  where owner_id=v_user and type=p_type and lower(name)=lower(trim(p_name))
  limit 1;

  if v_id is null then
    insert into public.organizations(name,type,description,email,phone,website,owner_id,region_id,city_id,discipline,status)
    values(
      trim(p_name),p_type,nullif(trim(p_description),''),nullif(trim(p_email),''),
      nullif(trim(p_phone),''),nullif(trim(p_website),''),v_user,p_region_id,p_city_id,
      nullif(trim(p_discipline),''),
      case when p_type in ('federation','league') then 'pending' else 'active' end
    )
    returning id into v_id;
  elsif p_type='organizer' then
    update public.organizations
    set status='active', updated_at=now()
    where id=v_id and status='draft' and deactivated_at is null;
  end if;

  insert into public.organization_members(organization_id,profile_id,role,status,joined_at)
  values(v_id,v_user,'owner','active',now()) on conflict do nothing;

  insert into public.active_organizations(profile_id,organization_id,selected_at)
  values(v_user,v_id,now())
  on conflict(profile_id) do update
  set organization_id=excluded.organization_id,selected_at=excluded.selected_at;

  return v_id;
end $$;

update public.organizations
set status='active', updated_at=now()
where type='organizer' and status='draft' and deactivated_at is null;

revoke all on function public.create_my_organization(text,text,text,text,text,text,uuid,uuid,text) from public,anon;
grant execute on function public.create_my_organization(text,text,text,text,text,text,uuid,uuid,text) to authenticated;

commit;
