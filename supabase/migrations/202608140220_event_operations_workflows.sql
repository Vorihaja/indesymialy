begin;

create table public.event_operation_records (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  domain text not null check (domain in ('logistics','security','medical','communication','document','incident')),
  title text not null,
  description text,
  category text,
  severity text not null default 'normal' check (severity in ('low','normal','high','critical')),
  status text not null default 'draft' check (status in ('draft','planned','in_progress','blocked','resolved','closed','cancelled')),
  owner_profile_id uuid references public.profiles(id) on delete set null,
  due_at timestamptz,
  started_at timestamptz,
  resolved_at timestamptz,
  resolution text,
  attachment_path text,
  visibility text not null default 'internal' check (visibility in ('internal','team','public')),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_operation_title_check check (length(btrim(title)) between 2 and 200),
  constraint event_operation_resolution_check check (
    status not in ('resolved','closed') or length(btrim(coalesce(resolution, ''))) >= 2
  )
);

create index event_operation_records_event_domain_status_idx
  on public.event_operation_records(event_id, domain, status);
create index event_operation_records_owner_due_idx
  on public.event_operation_records(owner_profile_id, due_at);

create table public.event_operation_history (
  id uuid primary key default gen_random_uuid(),
  operation_id uuid not null references public.event_operation_records(id) on delete cascade,
  from_status text,
  to_status text not null,
  note text,
  changed_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);
create index event_operation_history_operation_created_idx
  on public.event_operation_history(operation_id, created_at desc);

alter table public.event_operation_records enable row level security;
alter table public.event_operation_history enable row level security;

create policy event_operation_records_manager_manage
on public.event_operation_records for all to authenticated
using (public.can_manage_event(event_id))
with check (public.can_manage_event(event_id) and created_by = auth.uid());

create policy event_operation_records_owner_read
on public.event_operation_records for select to authenticated
using (owner_profile_id = auth.uid());

create policy event_operation_history_manager_read
on public.event_operation_history for select to authenticated
using (
  exists (
    select 1 from public.event_operation_records operation
    where operation.id = operation_id
      and public.can_manage_event(operation.event_id)
  )
);

create policy event_operation_history_owner_read
on public.event_operation_history for select to authenticated
using (
  exists (
    select 1 from public.event_operation_records operation
    where operation.id = operation_id
      and operation.owner_profile_id = auth.uid()
  )
);

create or replace function public.transition_event_operation(
  p_operation_id uuid,
  p_status text,
  p_note text default null
) returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_operation public.event_operation_records%rowtype;
begin
  select * into v_operation
  from public.event_operation_records
  where id = p_operation_id
  for update;

  if v_operation.id is null then raise exception 'Opération introuvable.'; end if;
  if not public.can_manage_event(v_operation.event_id) then raise exception 'Accès refusé.'; end if;
  if p_status = v_operation.status then return v_operation.id; end if;

  if not (
    (v_operation.status = 'draft' and p_status in ('planned','cancelled')) or
    (v_operation.status = 'planned' and p_status in ('in_progress','blocked','cancelled')) or
    (v_operation.status = 'in_progress' and p_status in ('blocked','resolved','cancelled')) or
    (v_operation.status = 'blocked' and p_status in ('in_progress','cancelled')) or
    (v_operation.status = 'resolved' and p_status in ('closed','in_progress'))
  ) then
    raise exception 'Transition invalide : % vers %.', v_operation.status, p_status;
  end if;

  if p_status in ('resolved','closed') and length(btrim(coalesce(p_note, v_operation.resolution, ''))) < 2 then
    raise exception 'Une résolution est requise pour terminer cette opération.';
  end if;

  update public.event_operation_records
  set status = p_status,
      started_at = case when p_status = 'in_progress' then coalesce(started_at, now()) else started_at end,
      resolved_at = case when p_status in ('resolved','closed') then coalesce(resolved_at, now()) else null end,
      resolution = case when p_status in ('resolved','closed') then coalesce(nullif(btrim(p_note), ''), resolution) else resolution end,
      updated_at = now()
  where id = p_operation_id;

  insert into public.event_operation_history(operation_id, from_status, to_status, note, changed_by)
  values (p_operation_id, v_operation.status, p_status, nullif(btrim(p_note), ''), auth.uid());

  return p_operation_id;
end;
$$;

grant execute on function public.transition_event_operation(uuid,text,text) to authenticated;

commit;
