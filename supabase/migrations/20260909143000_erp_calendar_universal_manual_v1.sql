-- ============================================================
-- INDESY MIALY
-- U-CAL-1A
-- Agenda universel : événements personnels manuels
--
-- seller_agenda_items reste l'autorité vendeur.
-- Les événements métier automatiques ne sont pas dupliqués.
-- U-CAL-1B projettera les sources métier.
-- ============================================================

create table if not exists public.erp_calendar_items (
    id uuid primary key default gen_random_uuid(),

    owner_profile_id uuid not null
        references public.profiles(id)
        on delete cascade,

    title text not null,
    description text null,

    starts_at timestamptz not null,
    ends_at timestamptz not null,

    all_day boolean not null default false,

    event_type text not null default 'meeting',
    status text not null default 'confirmed',

    location text null,

    source text not null default 'manual',
    context_role text null,

    created_by uuid null
        references public.profiles(id)
        on delete set null,

    archived_at timestamptz null,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint erp_calendar_items_title_check
        check (length(trim(title)) > 0),

    constraint erp_calendar_items_dates_check
        check (ends_at > starts_at),

    constraint erp_calendar_items_type_check
        check (
            event_type in (
                'sport',
                'meeting',
                'deadline',
                'travel',
                'medical',
                'commercial',
                'personal'
            )
        ),

    constraint erp_calendar_items_status_check
        check (
            status in (
                'confirmed',
                'tentative',
                'cancelled'
            )
        ),

    constraint erp_calendar_items_source_check
        check (source = 'manual')
);

create index if not exists erp_calendar_items_owner_start_idx
on public.erp_calendar_items (
    owner_profile_id,
    starts_at
)
where archived_at is null;

create index if not exists erp_calendar_items_owner_status_idx
on public.erp_calendar_items (
    owner_profile_id,
    status,
    starts_at
)
where archived_at is null;

comment on table public.erp_calendar_items is
'Manual personal ERP calendar authority. Business-domain dates stay in their authoritative modules.';

create or replace function public.erp_calendar_touch_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
    new.updated_at := now();
    return new;
end;
$$;

drop trigger if exists erp_calendar_items_touch_updated_at
on public.erp_calendar_items;

create trigger erp_calendar_items_touch_updated_at
before update on public.erp_calendar_items
for each row
execute function public.erp_calendar_touch_updated_at();

alter table public.erp_calendar_items enable row level security;

drop policy if exists erp_calendar_items_owner_read
on public.erp_calendar_items;

create policy erp_calendar_items_owner_read
on public.erp_calendar_items
for select
to authenticated
using (
    owner_profile_id = auth.uid()
);

drop policy if exists erp_calendar_items_owner_insert
on public.erp_calendar_items;

create policy erp_calendar_items_owner_insert
on public.erp_calendar_items
for insert
to authenticated
with check (
    owner_profile_id = auth.uid()
    and source = 'manual'
);

drop policy if exists erp_calendar_items_owner_update
on public.erp_calendar_items;

create policy erp_calendar_items_owner_update
on public.erp_calendar_items
for update
to authenticated
using (
    owner_profile_id = auth.uid()
    and source = 'manual'
)
with check (
    owner_profile_id = auth.uid()
    and source = 'manual'
);

revoke delete
on public.erp_calendar_items
from authenticated;

grant select, insert, update
on public.erp_calendar_items
to authenticated;

create or replace function public.erp_calendar_list_items(
    p_from timestamptz default null,
    p_to timestamptz default null
)
returns table (
    id uuid,
    title text,
    description text,
    starts_at timestamptz,
    ends_at timestamptz,
    all_day boolean,
    event_type text,
    status text,
    location text,
    source text,
    context_role text,
    created_at timestamptz,
    updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
    if auth.uid() is null then
        raise exception 'AUTH_REQUIRED';
    end if;

    return query
    select
        item.id,
        item.title,
        item.description,
        item.starts_at,
        item.ends_at,
        item.all_day,
        item.event_type,
        item.status,
        item.location,
        item.source,
        item.context_role,
        item.created_at,
        item.updated_at
    from public.erp_calendar_items item
    where item.owner_profile_id = auth.uid()
      and item.archived_at is null
      and (
          p_from is null
          or item.ends_at >= p_from
      )
      and (
          p_to is null
          or item.starts_at < p_to
      )
    order by item.starts_at asc;
end;
$$;

create or replace function public.erp_calendar_create_item(
    p_title text,
    p_starts_at timestamptz,
    p_ends_at timestamptz,
    p_all_day boolean default false,
    p_event_type text default 'meeting',
    p_location text default null,
    p_description text default null,
    p_status text default 'confirmed',
    p_context_role text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_id uuid;
begin
    if auth.uid() is null then
        raise exception 'AUTH_REQUIRED';
    end if;

    if length(trim(coalesce(p_title, ''))) = 0 then
        raise exception 'TITLE_REQUIRED';
    end if;

    if p_ends_at <= p_starts_at then
        raise exception 'INVALID_DATE_RANGE';
    end if;

    insert into public.erp_calendar_items (
        owner_profile_id,
        title,
        description,
        starts_at,
        ends_at,
        all_day,
        event_type,
        status,
        location,
        source,
        context_role,
        created_by
    )
    values (
        auth.uid(),
        trim(p_title),
        nullif(trim(coalesce(p_description, '')), ''),
        p_starts_at,
        p_ends_at,
        coalesce(p_all_day, false),
        p_event_type,
        p_status,
        nullif(trim(coalesce(p_location, '')), ''),
        'manual',
        nullif(trim(coalesce(p_context_role, '')), ''),
        auth.uid()
    )
    returning id into v_id;

    return v_id;
end;
$$;

create or replace function public.erp_calendar_update_item(
    p_item_id uuid,
    p_title text,
    p_starts_at timestamptz,
    p_ends_at timestamptz,
    p_all_day boolean default false,
    p_event_type text default 'meeting',
    p_location text default null,
    p_description text default null,
    p_status text default 'confirmed',
    p_context_role text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_id uuid;
begin
    if auth.uid() is null then
        raise exception 'AUTH_REQUIRED';
    end if;

    if length(trim(coalesce(p_title, ''))) = 0 then
        raise exception 'TITLE_REQUIRED';
    end if;

    if p_ends_at <= p_starts_at then
        raise exception 'INVALID_DATE_RANGE';
    end if;

    update public.erp_calendar_items
    set
        title = trim(p_title),
        description = nullif(trim(coalesce(p_description, '')), ''),
        starts_at = p_starts_at,
        ends_at = p_ends_at,
        all_day = coalesce(p_all_day, false),
        event_type = p_event_type,
        status = p_status,
        location = nullif(trim(coalesce(p_location, '')), ''),
        context_role = nullif(trim(coalesce(p_context_role, '')), '')
    where id = p_item_id
      and owner_profile_id = auth.uid()
      and source = 'manual'
      and archived_at is null
    returning id into v_id;

    if v_id is null then
        raise exception 'CALENDAR_ITEM_NOT_FOUND';
    end if;

    return v_id;
end;
$$;

create or replace function public.erp_calendar_archive_item(
    p_item_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_id uuid;
begin
    if auth.uid() is null then
        raise exception 'AUTH_REQUIRED';
    end if;

    update public.erp_calendar_items
    set archived_at = now()
    where id = p_item_id
      and owner_profile_id = auth.uid()
      and source = 'manual'
      and archived_at is null
    returning id into v_id;

    if v_id is null then
        raise exception 'CALENDAR_ITEM_NOT_FOUND';
    end if;

    return v_id;
end;
$$;

revoke all
on function public.erp_calendar_list_items(timestamptz, timestamptz)
from public;

revoke all
on function public.erp_calendar_create_item(
    text,
    timestamptz,
    timestamptz,
    boolean,
    text,
    text,
    text,
    text,
    text
)
from public;

revoke all
on function public.erp_calendar_update_item(
    uuid,
    text,
    timestamptz,
    timestamptz,
    boolean,
    text,
    text,
    text,
    text,
    text
)
from public;

revoke all
on function public.erp_calendar_archive_item(uuid)
from public;

grant execute
on function public.erp_calendar_list_items(timestamptz, timestamptz)
to authenticated;

grant execute
on function public.erp_calendar_create_item(
    text,
    timestamptz,
    timestamptz,
    boolean,
    text,
    text,
    text,
    text,
    text
)
to authenticated;

grant execute
on function public.erp_calendar_update_item(
    uuid,
    text,
    timestamptz,
    timestamptz,
    boolean,
    text,
    text,
    text,
    text,
    text
)
to authenticated;

grant execute
on function public.erp_calendar_archive_item(uuid)
to authenticated;
