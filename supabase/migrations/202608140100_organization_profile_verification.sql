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
  select id into v_id from public.organizations where owner_id=v_user and type=p_type and lower(name)=lower(trim(p_name)) limit 1;
  if v_id is null then
    insert into public.organizations(name,type,description,email,phone,website,owner_id,region_id,city_id,discipline,status)
    values(trim(p_name),p_type,nullif(trim(p_description),''),nullif(trim(p_email),''),nullif(trim(p_phone),''),nullif(trim(p_website),''),v_user,p_region_id,p_city_id,nullif(trim(p_discipline),''),case when p_type in ('federation','league') then 'pending' else 'draft' end)
    returning id into v_id;
  end if;
  insert into public.organization_members(organization_id,profile_id,role,status,joined_at)
  values(v_id,v_user,'owner','active',now()) on conflict do nothing;
  insert into public.active_organizations(profile_id,organization_id,selected_at)
  values(v_user,v_id,now()) on conflict(profile_id) do update set organization_id=excluded.organization_id,selected_at=excluded.selected_at;
  return v_id;
end $$;

create or replace function public.update_my_organization(
  p_organization_id uuid, p_name text, p_description text default null,
  p_email text default null, p_phone text default null, p_website text default null,
  p_region_id uuid default null, p_city_id uuid default null, p_discipline text default null
) returns uuid language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is null then raise exception using errcode='28000', message='Authentication required'; end if;
  if nullif(trim(p_name),'') is null then raise exception using errcode='22023', message='Organization name is required'; end if;
  update public.organizations set name=trim(p_name),description=nullif(trim(p_description),''),email=nullif(trim(p_email),''),phone=nullif(trim(p_phone),''),website=nullif(trim(p_website),''),region_id=p_region_id,city_id=p_city_id,discipline=nullif(trim(p_discipline),''),updated_at=now()
  where id=p_organization_id and owner_id=auth.uid();
  if not found then raise exception using errcode='42501', message='Organization access denied'; end if;
  return p_organization_id;
end $$;

create table if not exists public.profile_verification_requests(
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  subject_type text not null default 'profile' check(subject_type in ('profile','organization')),
  organization_id uuid references public.organizations(id) on delete cascade,
  legal_name text not null,
  identity_number text,
  nif text not null,
  stat_number text,
  registered_address text not null,
  status text not null default 'draft' check(status in ('draft','submitted','in_review','verified','rejected','needs_changes')),
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id),
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists profile_verification_subject_unique on public.profile_verification_requests(profile_id,subject_type,coalesce(organization_id,'00000000-0000-0000-0000-000000000000'::uuid));

create table if not exists public.profile_verification_documents(
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.profile_verification_requests(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  document_type text not null,
  file_name text not null,
  storage_path text not null unique,
  mime_type text not null,
  size_bytes bigint not null check(size_bytes > 0 and size_bytes <= 10485760),
  status text not null default 'uploaded' check(status in ('uploaded','accepted','rejected')),
  expires_at date,
  review_note text,
  created_at timestamptz not null default now(),
  unique(request_id,document_type)
);

alter table public.profile_verification_requests enable row level security;
alter table public.profile_verification_documents enable row level security;
drop policy if exists verification_requests_owner_read on public.profile_verification_requests;
create policy verification_requests_owner_read on public.profile_verification_requests for select to authenticated using(profile_id=auth.uid() or public.is_platform_admin());
drop policy if exists verification_documents_owner_read on public.profile_verification_documents;
create policy verification_documents_owner_read on public.profile_verification_documents for select to authenticated using(profile_id=auth.uid() or public.is_platform_admin());

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('profile-verification','profile-verification',false,10485760,array['application/pdf','image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=false,file_size_limit=10485760,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists verification_storage_owner_insert on storage.objects;
create policy verification_storage_owner_insert on storage.objects for insert to authenticated with check(bucket_id='profile-verification' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists verification_storage_owner_read on storage.objects;
create policy verification_storage_owner_read on storage.objects for select to authenticated using(bucket_id='profile-verification' and ((storage.foldername(name))[1]=auth.uid()::text or public.is_platform_admin()));
drop policy if exists verification_storage_owner_update on storage.objects;
create policy verification_storage_owner_update on storage.objects for update to authenticated using(bucket_id='profile-verification' and (storage.foldername(name))[1]=auth.uid()::text) with check(bucket_id='profile-verification' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists verification_storage_owner_delete on storage.objects;
create policy verification_storage_owner_delete on storage.objects for delete to authenticated using(bucket_id='profile-verification' and (storage.foldername(name))[1]=auth.uid()::text);

create or replace function public.get_my_profile_verification() returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce((select jsonb_build_object(
   'id',r.id,'subjectType',r.subject_type,'organizationId',r.organization_id,'legalName',r.legal_name,
   'identityNumber',r.identity_number,'nif',r.nif,'statNumber',r.stat_number,'registeredAddress',r.registered_address,
   'status',r.status,'submittedAt',r.submitted_at,'reviewNote',r.review_note,
   'documents',coalesce((select jsonb_agg(jsonb_build_object('id',d.id,'type',d.document_type,'fileName',d.file_name,'mimeType',d.mime_type,'sizeBytes',d.size_bytes,'status',d.status,'expiresAt',d.expires_at,'reviewNote',d.review_note) order by d.document_type) from public.profile_verification_documents d where d.request_id=r.id),'[]'::jsonb)
 ) from public.profile_verification_requests r where r.profile_id=auth.uid() order by r.updated_at desc limit 1),'null'::jsonb);
$$;

create or replace function public.save_my_profile_verification(
 p_subject_type text,p_organization_id uuid,p_legal_name text,p_identity_number text,p_nif text,p_stat_number text,p_registered_address text
) returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
 if auth.uid() is null then raise exception using errcode='28000',message='Authentication required'; end if;
 if nullif(trim(p_legal_name),'') is null or nullif(trim(p_nif),'') is null or nullif(trim(p_registered_address),'') is null then raise exception using errcode='22023',message='Verification information incomplete'; end if;
 if p_subject_type='organization' and not exists(select 1 from public.organizations where id=p_organization_id and owner_id=auth.uid()) then raise exception using errcode='42501',message='Organization access denied'; end if;
 select id into v_id from public.profile_verification_requests where profile_id=auth.uid() and subject_type=p_subject_type and organization_id is not distinct from p_organization_id limit 1;
 if v_id is null then
  insert into public.profile_verification_requests(profile_id,subject_type,organization_id,legal_name,identity_number,nif,stat_number,registered_address)
  values(auth.uid(),p_subject_type,p_organization_id,trim(p_legal_name),nullif(trim(p_identity_number),''),trim(p_nif),nullif(trim(p_stat_number),''),trim(p_registered_address)) returning id into v_id;
 else
  update public.profile_verification_requests set legal_name=trim(p_legal_name),identity_number=nullif(trim(p_identity_number),''),nif=trim(p_nif),stat_number=nullif(trim(p_stat_number),''),registered_address=trim(p_registered_address),status=case when status in('verified','in_review') then status else 'draft' end,updated_at=now() where id=v_id;
 end if;
 return v_id;
end $$;

create or replace function public.register_my_verification_document(p_request_id uuid,p_document_type text,p_file_name text,p_storage_path text,p_mime_type text,p_size_bytes bigint,p_expires_at date default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
 if not exists(select 1 from public.profile_verification_requests where id=p_request_id and profile_id=auth.uid() and status not in('verified','in_review')) then raise exception using errcode='42501',message='Verification request access denied'; end if;
 insert into public.profile_verification_documents(request_id,profile_id,document_type,file_name,storage_path,mime_type,size_bytes,expires_at)
 values(p_request_id,auth.uid(),p_document_type,p_file_name,p_storage_path,p_mime_type,p_size_bytes,p_expires_at)
 on conflict(request_id,document_type) do update set file_name=excluded.file_name,storage_path=excluded.storage_path,mime_type=excluded.mime_type,size_bytes=excluded.size_bytes,expires_at=excluded.expires_at,status='uploaded',review_note=null,created_at=now()
 returning id into v_id;
 return v_id;
end $$;

create or replace function public.submit_my_profile_verification(p_request_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare v_subject text; v_missing boolean;
begin
 select subject_type into v_subject from public.profile_verification_requests where id=p_request_id and profile_id=auth.uid();
 if v_subject is null then raise exception using errcode='42501',message='Verification request access denied'; end if;
 select exists(select 1 from unnest(case when v_subject='organization' then array['legal','rcs','nif','stat','tax_clearance','representative_identity'] else array['identity','fiscal_card','nif'] end) required(type) where not exists(select 1 from public.profile_verification_documents d where d.request_id=p_request_id and d.document_type=required.type and d.status in('uploaded','accepted'))) into v_missing;
 if v_missing then raise exception using errcode='22023',message='Required verification documents are missing'; end if;
 update public.profile_verification_requests set status='submitted',submitted_at=now(),updated_at=now() where id=p_request_id;
end $$;

revoke all on function public.create_my_organization(text,text,text,text,text,text,uuid,uuid,text) from public,anon;
revoke all on function public.update_my_organization(uuid,text,text,text,text,text,uuid,uuid,text) from public,anon;
revoke all on function public.get_my_profile_verification() from public,anon;
revoke all on function public.save_my_profile_verification(text,uuid,text,text,text,text,text) from public,anon;
revoke all on function public.register_my_verification_document(uuid,text,text,text,text,bigint,date) from public,anon;
revoke all on function public.submit_my_profile_verification(uuid) from public,anon;
grant execute on function public.create_my_organization(text,text,text,text,text,text,uuid,uuid,text) to authenticated;
grant execute on function public.update_my_organization(uuid,text,text,text,text,text,uuid,uuid,text) to authenticated;
grant execute on function public.get_my_profile_verification() to authenticated;
grant execute on function public.save_my_profile_verification(text,uuid,text,text,text,text,text) to authenticated;
grant execute on function public.register_my_verification_document(uuid,text,text,text,text,bigint,date) to authenticated;
grant execute on function public.submit_my_profile_verification(uuid) to authenticated;

commit;
