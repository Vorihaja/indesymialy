begin;

-- C4-FC2A: recover the live messaging authority after all identity and Korana
-- dependencies exist, then extend it with organization actors and private
-- attachment storage.

create unique index if not exists message_attachments_file_url_key
  on public.message_attachments(file_url);

create or replace function public.messaging_can_represent_organization(
  p_organization_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null
    and p_organization_id is not null
    and (
      exists (
        select 1 from public.organizations o
        where o.id = p_organization_id
          and o.owner_id = auth.uid()
      )
      or exists (
        select 1 from public.organization_members om
        where om.organization_id = p_organization_id
          and om.profile_id = auth.uid()
          and om.status = 'active'
          and om.role = 'owner'
      )
    );
$$;

create or replace function public.messaging_can_access_conversation(
  p_conversation_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null
    and p_conversation_id is not null
    and (
      exists (
        select 1 from public.conversation_participants cp
        where cp.conversation_id = p_conversation_id
          and cp.profile_id = auth.uid()
          and cp.left_at is null
      )
      or exists (
        select 1 from public.conversation_participants cp
        where cp.conversation_id = p_conversation_id
          and cp.organization_id is not null
          and cp.left_at is null
          and public.messaging_can_represent_organization(cp.organization_id)
      )
      or exists (
        select 1 from public.conversations c
        where c.id = p_conversation_id
          and c.created_by = auth.uid()
          and not exists (
            select 1 from public.conversation_participants cp
            where cp.conversation_id = c.id
          )
      )
    );
$$;

create or replace function public.messaging_can_manage_conversation(
  p_conversation_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null
    and p_conversation_id is not null
    and (
      exists (
        select 1 from public.conversation_participants cp
        where cp.conversation_id = p_conversation_id
          and cp.profile_id = auth.uid()
          and cp.left_at is null
          and cp.role in ('owner', 'moderator')
      )
      or exists (
        select 1 from public.conversation_participants cp
        where cp.conversation_id = p_conversation_id
          and cp.organization_id is not null
          and cp.left_at is null
          and cp.role in ('owner', 'moderator')
          and public.messaging_can_represent_organization(cp.organization_id)
      )
      or exists (
        select 1 from public.conversations c
        where c.id = p_conversation_id
          and c.created_by = auth.uid()
          and not exists (
            select 1 from public.conversation_participants cp
            where cp.conversation_id = c.id
          )
      )
    );
$$;

create or replace function public.messaging_can_access_message(
  p_message_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.messages m
    where m.id = p_message_id
      and public.messaging_can_access_conversation(m.conversation_id)
  );
$$;

create or replace function public.messaging_is_message_operator(
  p_message_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null
    and exists (
      select 1 from public.messages m
      where m.id = p_message_id
        and m.sent_by_profile_id = auth.uid()
        and public.messaging_can_access_conversation(m.conversation_id)
    );
$$;

drop function if exists public.send_message(uuid, text, text, uuid);

create function public.send_message(
  p_conversation_id uuid,
  p_content text,
  p_message_type text default 'text',
  p_reply_to_id uuid default null,
  p_attachments jsonb default '[]'::jsonb,
  p_sender_organization_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile_id uuid := auth.uid();
  v_message_id uuid;
  v_content text := btrim(coalesce(p_content, ''));
  v_attachments jsonb := coalesce(p_attachments, '[]'::jsonb);
  v_attachment jsonb;
  v_path text;
  v_name text;
  v_mime text;
  v_kind text;
  v_size integer;
  v_sender_organization_id uuid;
begin
  if v_profile_id is null then
    raise exception 'UNAUTHENTICATED' using errcode = '42501';
  end if;

  if jsonb_typeof(v_attachments) <> 'array'
     or jsonb_array_length(v_attachments) > 5 then
    raise exception 'INVALID_ATTACHMENTS' using errcode = '22023';
  end if;

  if v_content = '' and jsonb_array_length(v_attachments) = 0 then
    raise exception 'MESSAGE_CONTENT_REQUIRED' using errcode = '22023';
  end if;

  if coalesce(p_message_type, 'text') <> 'text' then
    raise exception 'INVALID_MESSAGE_TYPE' using errcode = '22023';
  end if;

  if p_sender_organization_id is not null then
    if not public.messaging_can_represent_organization(p_sender_organization_id)
       or not exists (
         select 1 from public.conversation_participants cp
         where cp.conversation_id = p_conversation_id
           and cp.organization_id = p_sender_organization_id
           and cp.left_at is null
       ) then
      raise exception 'FORBIDDEN' using errcode = '42501';
    end if;
    v_sender_organization_id := p_sender_organization_id;
  elsif not exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = p_conversation_id
      and cp.profile_id = v_profile_id
      and cp.left_at is null
  ) then
    select cp.organization_id
    into v_sender_organization_id
    from public.conversation_participants cp
    where cp.conversation_id = p_conversation_id
      and cp.organization_id is not null
      and cp.left_at is null
      and public.messaging_can_represent_organization(cp.organization_id)
    order by cp.joined_at
    limit 1;

    if v_sender_organization_id is null then
      raise exception 'FORBIDDEN' using errcode = '42501';
    end if;
  end if;

  if p_reply_to_id is not null and not exists (
    select 1 from public.messages m
    where m.id = p_reply_to_id
      and m.conversation_id = p_conversation_id
  ) then
    raise exception 'INVALID_REPLY_TARGET' using errcode = '22023';
  end if;

  for v_attachment in select value from jsonb_array_elements(v_attachments)
  loop
    v_path := btrim(coalesce(v_attachment->>'path', ''));
    v_name := btrim(coalesce(v_attachment->>'name', ''));
    v_mime := lower(btrim(coalesce(v_attachment->>'mimeType', '')));
    v_size := coalesce((v_attachment->>'size')::integer, 0);

    if v_path = '' or v_path like '%..%'
       or left(v_path, char_length(p_conversation_id::text || '/' || v_profile_id::text || '/'))
          <> p_conversation_id::text || '/' || v_profile_id::text || '/'
       or char_length(v_name) not between 1 and 255
       or v_size not between 1 and 6291456
       or v_mime not in (
         'image/jpeg', 'image/png', 'image/webp', 'image/gif',
         'application/pdf', 'text/plain', 'text/csv',
         'application/msword',
         'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
         'application/vnd.ms-excel',
         'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
         'audio/mpeg', 'audio/wav', 'audio/ogg',
         'video/mp4', 'video/webm'
       ) then
      raise exception 'INVALID_ATTACHMENT' using errcode = '22023';
    end if;
  end loop;

  insert into public.messages (
    conversation_id,
    sender_profile_id,
    sender_organization_id,
    sent_by_profile_id,
    content,
    message_type,
    reply_to_id
  ) values (
    p_conversation_id,
    case when v_sender_organization_id is null then v_profile_id else null end,
    v_sender_organization_id,
    v_profile_id,
    nullif(v_content, ''),
    'text',
    p_reply_to_id
  ) returning id into v_message_id;

  for v_attachment in select value from jsonb_array_elements(v_attachments)
  loop
    v_path := btrim(v_attachment->>'path');
    v_name := btrim(v_attachment->>'name');
    v_mime := lower(btrim(v_attachment->>'mimeType'));
    v_size := (v_attachment->>'size')::integer;
    v_kind := case
      when v_mime like 'image/%' then 'image'
      when v_mime like 'video/%' then 'video'
      when v_mime like 'audio/%' then 'audio'
      when v_mime in ('application/pdf', 'text/plain', 'text/csv',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') then 'document'
      else 'file'
    end;

    insert into public.message_attachments (
      message_id, file_name, file_url, file_type, file_size, mime_type
    ) values (
      v_message_id, v_name, v_path, v_kind, v_size, v_mime
    );
  end loop;

  update public.conversations
  set last_message_at = now()
  where id = p_conversation_id;

  insert into public.conversation_user_preferences(conversation_id, profile_id)
  select cp.conversation_id, cp.profile_id
  from public.conversation_participants cp
  where cp.conversation_id = p_conversation_id
    and cp.profile_id is not null
    and cp.left_at is null
  on conflict (conversation_id, profile_id) do nothing;

  insert into public.conversation_user_preferences(conversation_id, profile_id)
  values (p_conversation_id, v_profile_id)
  on conflict (conversation_id, profile_id) do nothing;

  update public.conversation_user_preferences
  set unread_count = 0,
      last_read_at = now(),
      locally_deleted_at = null,
      updated_at = now()
  where conversation_id = p_conversation_id
    and profile_id = v_profile_id;

  update public.conversation_user_preferences
  set unread_count = unread_count + 1,
      locally_deleted_at = null,
      updated_at = now()
  where conversation_id = p_conversation_id
    and profile_id <> v_profile_id;

  return v_message_id;
end;
$$;

create or replace function public.edit_message(
  p_message_id uuid,
  p_content text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile_id uuid := auth.uid();
  v_content text := btrim(coalesce(p_content, ''));
  v_message_id uuid;
begin
  if v_profile_id is null then
    raise exception 'UNAUTHENTICATED' using errcode = '42501';
  end if;
  if v_content = '' then
    raise exception 'MESSAGE_CONTENT_REQUIRED' using errcode = '22023';
  end if;

  update public.messages m
  set content = v_content, is_edited = true, edited_at = now()
  where m.id = p_message_id
    and m.sent_by_profile_id = v_profile_id
    and coalesce(m.is_deleted, false) = false
    and public.messaging_can_access_conversation(m.conversation_id)
  returning m.id into v_message_id;

  if v_message_id is null then
    raise exception 'MESSAGE_NOT_FOUND_OR_FORBIDDEN' using errcode = '42501';
  end if;
  return v_message_id;
end;
$$;

create or replace function public.delete_message(p_message_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile_id uuid := auth.uid();
  v_message_id uuid;
begin
  if v_profile_id is null then
    raise exception 'UNAUTHENTICATED' using errcode = '42501';
  end if;

  update public.messages m
  set content = null,
      media_url = null,
      media_type = null,
      media_duration = null,
      media_thumbnail = null,
      metadata = null,
      is_deleted = true,
      deleted_at = now()
  where m.id = p_message_id
    and m.sent_by_profile_id = v_profile_id
    and coalesce(m.is_deleted, false) = false
    and public.messaging_can_access_conversation(m.conversation_id)
  returning m.id into v_message_id;

  if v_message_id is null then
    raise exception 'MESSAGE_NOT_FOUND_OR_FORBIDDEN' using errcode = '42501';
  end if;
  delete from public.message_attachments where message_id = v_message_id;
  return v_message_id;
end;
$$;

create or replace function public.mark_conversation_read(p_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile_id uuid := auth.uid();
begin
  if v_profile_id is null then
    raise exception 'UNAUTHENTICATED' using errcode = '42501';
  end if;
  if not public.messaging_can_access_conversation(p_conversation_id) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  insert into public.conversation_user_preferences(
    conversation_id, profile_id, unread_count, last_read_at
  ) values (p_conversation_id, v_profile_id, 0, now())
  on conflict (conversation_id, profile_id) do update
  set unread_count = 0,
      last_read_at = excluded.last_read_at,
      updated_at = now();

  insert into public.message_reads(message_id, profile_id, read_at)
  select m.id, v_profile_id, now()
  from public.messages m
  where m.conversation_id = p_conversation_id
    and coalesce(m.is_deleted, false) = false
  on conflict (message_id, profile_id) do update
  set read_at = excluded.read_at;
end;
$$;

drop function if exists public.messaging_search_profile_recipients(text, integer);

create function public.messaging_search_profile_recipients(
  p_query text default '',
  p_limit integer default 20
)
returns table(
  actor_id uuid,
  actor_type text,
  profile_id uuid,
  organization_id uuid,
  handle text,
  display_name text,
  avatar_url text,
  is_verified boolean
)
language sql
stable
set search_path = ''
as $$
  select ka.id,
         ka.actor_type,
         ka.profile_id,
         ka.organization_id,
         ka.handle,
         ka.display_name,
         ka.avatar_url,
         ka.is_verified
  from public.korana_actors ka
  where auth.uid() is not null
    and (ka.profile_id is null or ka.profile_id <> auth.uid())
    and ka.status = 'active'
    and public.korana_can_view_actor(ka.id)
    and (
      nullif(btrim(coalesce(p_query, '')), '') is null
      or lower(ka.display_name) like '%' || lower(btrim(p_query)) || '%'
      or lower(ka.handle) like '%' || lower(btrim(p_query)) || '%'
    )
  order by
    case
      when nullif(btrim(coalesce(p_query, '')), '') is not null
       and lower(ka.handle) = lower(btrim(p_query)) then 0
      when nullif(btrim(coalesce(p_query, '')), '') is not null
       and lower(ka.display_name) like lower(btrim(p_query)) || '%' then 1
      else 2
    end,
    ka.is_verified desc,
    lower(ka.display_name),
    lower(ka.handle)
  limit least(greatest(coalesce(p_limit, 20), 1), 50);
$$;

drop function if exists public.open_or_create_private_conversation(uuid);

create function public.open_or_create_private_conversation(
  p_recipient_actor_id uuid,
  p_sender_organization_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller_profile_id uuid := auth.uid();
  v_sender_profile_id uuid;
  v_sender_organization_id uuid;
  v_recipient_profile_id uuid;
  v_recipient_organization_id uuid;
  v_actor_status text;
  v_conversation_id uuid;
  v_pair_key text;
begin
  if v_caller_profile_id is null then
    raise exception 'UNAUTHENTICATED' using errcode = '42501';
  end if;
  if p_recipient_actor_id is null then
    raise exception 'RECIPIENT_REQUIRED' using errcode = '22023';
  end if;

  select ka.profile_id, ka.organization_id, ka.status
  into v_recipient_profile_id, v_recipient_organization_id, v_actor_status
  from public.korana_actors ka
  where ka.id = p_recipient_actor_id
    and public.korana_can_view_actor(ka.id)
  limit 1;

  if v_recipient_profile_id is null and v_recipient_organization_id is null then
    raise exception 'RECIPIENT_NOT_FOUND' using errcode = '22023';
  end if;
  if v_actor_status <> 'active' then
    raise exception 'RECIPIENT_UNAVAILABLE' using errcode = '22023';
  end if;

  if p_sender_organization_id is null then
    v_sender_profile_id := v_caller_profile_id;
  else
    if not public.messaging_can_represent_organization(p_sender_organization_id)
       or not exists (
         select 1 from public.korana_actors ka
         where ka.organization_id = p_sender_organization_id
           and ka.actor_type = 'organization'
           and ka.status = 'active'
       ) then
      raise exception 'ORGANIZATION_MESSAGING_FORBIDDEN' using errcode = '42501';
    end if;
    v_sender_organization_id := p_sender_organization_id;
  end if;

  if v_sender_profile_id is not null
     and v_sender_profile_id = v_recipient_profile_id then
    raise exception 'CANNOT_MESSAGE_YOURSELF' using errcode = '22023';
  end if;
  if v_sender_organization_id is not null
     and v_sender_organization_id = v_recipient_organization_id then
    raise exception 'CANNOT_MESSAGE_YOURSELF' using errcode = '22023';
  end if;

  v_pair_key := least(
      coalesce('p:' || v_sender_profile_id::text, 'o:' || v_sender_organization_id::text),
      coalesce('p:' || v_recipient_profile_id::text, 'o:' || v_recipient_organization_id::text)
    ) || ':' || greatest(
      coalesce('p:' || v_sender_profile_id::text, 'o:' || v_sender_organization_id::text),
      coalesce('p:' || v_recipient_profile_id::text, 'o:' || v_recipient_organization_id::text)
    );
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_pair_key, 0));

  select c.id into v_conversation_id
  from public.conversations c
  where c.conversation_type = 'private'
    and exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = c.id and cp.left_at is null
        and ((v_sender_profile_id is not null and cp.profile_id = v_sender_profile_id)
          or (v_sender_organization_id is not null and cp.organization_id = v_sender_organization_id))
    )
    and exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = c.id and cp.left_at is null
        and ((v_recipient_profile_id is not null and cp.profile_id = v_recipient_profile_id)
          or (v_recipient_organization_id is not null and cp.organization_id = v_recipient_organization_id))
    )
    and (select count(*) from public.conversation_participants cp
         where cp.conversation_id = c.id and cp.left_at is null) = 2
  order by c.created_at asc nulls last
  limit 1;

  if v_conversation_id is null then
    insert into public.conversations(title, conversation_type, created_by, last_message_at)
    values (null, 'private', v_caller_profile_id, now())
    returning id into v_conversation_id;

    insert into public.conversation_participants(
      conversation_id, profile_id, organization_id, role
    ) values (
      v_conversation_id, v_sender_profile_id, v_sender_organization_id, 'owner'
    ), (
      v_conversation_id, v_recipient_profile_id, v_recipient_organization_id, 'member'
    );

    if v_recipient_profile_id is not null then
      insert into public.conversation_user_preferences(
        conversation_id, profile_id, unread_count, last_read_at
      ) values (v_conversation_id, v_recipient_profile_id, 0, null)
      on conflict (conversation_id, profile_id) do nothing;
    end if;
  end if;

  insert into public.conversation_user_preferences(
    conversation_id, profile_id, locally_deleted_at, updated_at
  ) values (v_conversation_id, v_caller_profile_id, null, now())
  on conflict (conversation_id, profile_id) do update
  set locally_deleted_at = null, updated_at = now();

  return v_conversation_id;
end;
$$;

-- Canonical current RLS.  Historical preference policies are removed so they
-- cannot combine with the actor-aware policies below.
drop policy if exists conversation_preferences_owner_read on public.conversation_user_preferences;
drop policy if exists conversation_preferences_owner_write on public.conversation_user_preferences;

drop policy if exists messaging_conversations_select on public.conversations;
drop policy if exists messaging_conversations_insert on public.conversations;
drop policy if exists messaging_participants_select on public.conversation_participants;
drop policy if exists messaging_participants_insert on public.conversation_participants;
drop policy if exists messaging_preferences_select on public.conversation_user_preferences;
drop policy if exists messaging_preferences_insert on public.conversation_user_preferences;
drop policy if exists messaging_preferences_update on public.conversation_user_preferences;
drop policy if exists messaging_messages_select on public.messages;
drop policy if exists messaging_attachments_select on public.message_attachments;
drop policy if exists messaging_attachments_insert on public.message_attachments;
drop policy if exists messaging_attachments_delete on public.message_attachments;
drop policy if exists messaging_reads_select on public.message_reads;
drop policy if exists messaging_reads_insert on public.message_reads;
drop policy if exists messaging_reads_update on public.message_reads;

create policy messaging_conversations_select on public.conversations
for select to authenticated using (public.messaging_can_access_conversation(id));
create policy messaging_conversations_insert on public.conversations
for insert to authenticated with check (auth.uid() is not null and created_by = auth.uid());
create policy messaging_participants_select on public.conversation_participants
for select to authenticated using (public.messaging_can_access_conversation(conversation_id));
create policy messaging_participants_insert on public.conversation_participants
for insert to authenticated with check (public.messaging_can_manage_conversation(conversation_id));
create policy messaging_preferences_select on public.conversation_user_preferences
for select to authenticated using (profile_id = auth.uid() and public.messaging_can_access_conversation(conversation_id));
create policy messaging_preferences_insert on public.conversation_user_preferences
for insert to authenticated with check (profile_id = auth.uid() and public.messaging_can_access_conversation(conversation_id));
create policy messaging_preferences_update on public.conversation_user_preferences
for update to authenticated
using (profile_id = auth.uid() and public.messaging_can_access_conversation(conversation_id))
with check (profile_id = auth.uid() and public.messaging_can_access_conversation(conversation_id));
create policy messaging_messages_select on public.messages
for select to authenticated using (public.messaging_can_access_conversation(conversation_id));
create policy messaging_attachments_select on public.message_attachments
for select to authenticated using (message_id is not null and public.messaging_can_access_message(message_id));
create policy messaging_attachments_insert on public.message_attachments
for insert to authenticated with check (message_id is not null and public.messaging_is_message_operator(message_id));
create policy messaging_attachments_delete on public.message_attachments
for delete to authenticated using (message_id is not null and public.messaging_is_message_operator(message_id));
create policy messaging_reads_select on public.message_reads
for select to authenticated using (public.messaging_can_access_message(message_id));
create policy messaging_reads_insert on public.message_reads
for insert to authenticated with check (profile_id = auth.uid() and public.messaging_can_access_message(message_id));
create policy messaging_reads_update on public.message_reads
for update to authenticated
using (profile_id = auth.uid() and public.messaging_can_access_message(message_id))
with check (profile_id = auth.uid() and public.messaging_can_access_message(message_id));

create or replace function public.messaging_storage_conversation_id(p_name text)
returns uuid
language plpgsql
immutable
strict
set search_path = ''
as $$
begin
  return (storage.foldername(p_name))[1]::uuid;
exception when invalid_text_representation or array_subscript_error then
  return null;
end;
$$;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values (
  'message-attachments',
  'message-attachments',
  false,
  6291456,
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'application/pdf', 'text/plain', 'text/csv',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'audio/mpeg', 'audio/wav', 'audio/ogg',
    'video/mp4', 'video/webm'
  ]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists message_attachments_storage_select on storage.objects;
drop policy if exists message_attachments_storage_insert on storage.objects;
drop policy if exists message_attachments_storage_delete on storage.objects;

create policy message_attachments_storage_select on storage.objects
for select to authenticated using (
  bucket_id = 'message-attachments'
  and public.messaging_storage_conversation_id(name) is not null
  and public.messaging_can_access_conversation(public.messaging_storage_conversation_id(name))
);
create policy message_attachments_storage_insert on storage.objects
for insert to authenticated with check (
  bucket_id = 'message-attachments'
  and coalesce(array_length(storage.foldername(name), 1), 0) = 2
  and (storage.foldername(name))[2] = auth.uid()::text
  and public.messaging_storage_conversation_id(name) is not null
  and public.messaging_can_access_conversation(public.messaging_storage_conversation_id(name))
);
create policy message_attachments_storage_delete on storage.objects
for delete to authenticated using (
  bucket_id = 'message-attachments'
  and (storage.foldername(name))[2] = auth.uid()::text
  and public.messaging_storage_conversation_id(name) is not null
  and public.messaging_can_access_conversation(public.messaging_storage_conversation_id(name))
);

revoke all on function public.messaging_can_represent_organization(uuid) from public, anon;
revoke all on function public.messaging_can_access_conversation(uuid) from public, anon;
revoke all on function public.messaging_can_manage_conversation(uuid) from public, anon;
revoke all on function public.messaging_can_access_message(uuid) from public, anon;
revoke all on function public.messaging_is_message_operator(uuid) from public, anon;
revoke all on function public.send_message(uuid, text, text, uuid, jsonb, uuid) from public, anon;
revoke all on function public.edit_message(uuid, text) from public, anon;
revoke all on function public.delete_message(uuid) from public, anon;
revoke all on function public.mark_conversation_read(uuid) from public, anon;
revoke all on function public.messaging_search_profile_recipients(text, integer) from public, anon;
revoke all on function public.open_or_create_private_conversation(uuid, uuid) from public, anon;
revoke all on function public.messaging_storage_conversation_id(text) from public, anon;

grant execute on function public.messaging_can_represent_organization(uuid) to authenticated, service_role;
grant execute on function public.messaging_can_access_conversation(uuid) to authenticated, service_role;
grant execute on function public.messaging_can_manage_conversation(uuid) to authenticated, service_role;
grant execute on function public.messaging_can_access_message(uuid) to authenticated, service_role;
grant execute on function public.messaging_is_message_operator(uuid) to authenticated, service_role;
grant execute on function public.send_message(uuid, text, text, uuid, jsonb, uuid) to authenticated, service_role;
grant execute on function public.edit_message(uuid, text) to authenticated, service_role;
grant execute on function public.delete_message(uuid) to authenticated, service_role;
grant execute on function public.mark_conversation_read(uuid) to authenticated, service_role;
grant execute on function public.messaging_search_profile_recipients(text, integer) to authenticated, service_role;
grant execute on function public.open_or_create_private_conversation(uuid, uuid) to authenticated, service_role;
grant execute on function public.messaging_storage_conversation_id(text) to authenticated, service_role;

grant select, insert on table public.conversations to authenticated;
grant select, insert on table public.conversation_participants to authenticated;
grant select, insert, update on table public.conversation_user_preferences to authenticated;
grant select on table public.messages to authenticated;
grant select, insert, delete on table public.message_attachments to authenticated;
grant select, insert, update on table public.message_reads to authenticated;
grant all on table public.conversations to service_role;
grant all on table public.conversation_participants to service_role;
grant all on table public.conversation_user_preferences to service_role;
grant all on table public.messages to service_role;
grant all on table public.message_attachments to service_role;
grant all on table public.message_reads to service_role;

commit;
