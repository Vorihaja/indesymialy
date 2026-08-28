begin;

create table if not exists public.erp_workspace_records (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid not null references public.profiles(id) on delete cascade,
  role_slug text not null,
  module_id text not null,
  tab_id text not null default '',
  title text not null,
  description text,
  status text not null default 'todo' check (status in ('draft', 'todo', 'in_progress', 'blocked', 'completed', 'archived')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'critical')),
  due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists erp_workspace_records_scope_idx
  on public.erp_workspace_records (owner_profile_id, role_slug, module_id, tab_id);
create index if not exists erp_workspace_records_status_due_idx
  on public.erp_workspace_records (owner_profile_id, status, due_at);

alter table public.erp_workspace_records enable row level security;

drop policy if exists "erp_workspace_records_select_own" on public.erp_workspace_records;
create policy "erp_workspace_records_select_own"
  on public.erp_workspace_records for select to authenticated
  using (owner_profile_id = auth.uid());

drop policy if exists "erp_workspace_records_insert_own" on public.erp_workspace_records;
create policy "erp_workspace_records_insert_own"
  on public.erp_workspace_records for insert to authenticated
  with check (owner_profile_id = auth.uid());

drop policy if exists "erp_workspace_records_update_own" on public.erp_workspace_records;
create policy "erp_workspace_records_update_own"
  on public.erp_workspace_records for update to authenticated
  using (owner_profile_id = auth.uid())
  with check (owner_profile_id = auth.uid());

drop policy if exists "erp_workspace_records_delete_own" on public.erp_workspace_records;
create policy "erp_workspace_records_delete_own"
  on public.erp_workspace_records for delete to authenticated
  using (owner_profile_id = auth.uid());

commit;
