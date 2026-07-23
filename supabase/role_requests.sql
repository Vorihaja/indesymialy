create table if not exists public.role_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  unique (user_id, role_id)
);

alter table public.role_requests enable row level security;

drop policy if exists "Users can read their own role requests" on public.role_requests;
create policy "Users can read their own role requests"
  on public.role_requests for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "Super admin can read all role requests" on public.role_requests;
create policy "Super admin can read all role requests"
  on public.role_requests for select to authenticated
  using ((auth.jwt() ->> 'email') = 'jayaherve@proton.me');

create table if not exists public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null default 'info', -- 'success', 'error', 'info'
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.user_notifications enable row level security;

drop policy if exists "Users can read their own notifications" on public.user_notifications;
create policy "Users can read their own notifications"
  on public.user_notifications for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users can update their own notifications" on public.user_notifications;
create policy "Users can update their own notifications"
  on public.user_notifications for update to authenticated
  using (user_id = auth.uid());

create or replace function public.submit_role_requests(p_role_ids uuid[])
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Non authentifié';
  end if;

  insert into public.role_requests (user_id, role_id)
  select auth.uid(), requested_role.id
  from unnest(p_role_ids) as requested_role(id)
  where exists (select 1 from public.roles where id = requested_role.id)
    and not exists (
      select 1 from public.user_roles
      where user_id = auth.uid() and role_id = requested_role.id
    )
  on conflict (user_id, role_id) do nothing;
end;
$$;

create or replace function public.review_role_request(p_request_id uuid, p_approved boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  request_row public.role_requests;
  role_label_text text;
begin
  if (auth.jwt() ->> 'email') <> 'jayaherve@proton.me' then
    raise exception 'Non autorisé';
  end if;

  select * into request_row from public.role_requests where id = p_request_id and status = 'pending' for update;
  if not found then
    raise exception 'Demande introuvable ou déjà traitée';
  end if;

  select coalesce(label, slug) into role_label_text from public.roles where id = request_row.role_id;

  update public.role_requests
  set status = case when p_approved then 'approved' else 'rejected' end,
      reviewed_at = now(),
      reviewed_by = auth.uid()
  where id = p_request_id;

  if p_approved then
    insert into public.user_roles (user_id, role_id)
    select request_row.user_id, request_row.role_id
    where not exists (
      select 1 from public.user_roles
      where user_id = request_row.user_id and role_id = request_row.role_id
    );

    insert into public.user_notifications (user_id, title, message, type)
    values (
      request_row.user_id,
      'Demande de rôle validée',
      'Votre demande a été validée',
      'success'
    );
  else
    insert into public.user_notifications (user_id, title, message, type)
    values (
      request_row.user_id,
      'Demande de rôle rejetée',
      'Votre demande a été rejetée',
      'error'
    );
  end if;
end;
$$;

grant execute on function public.submit_role_requests(uuid[]) to authenticated;
grant execute on function public.review_role_request(uuid, boolean) to authenticated;
