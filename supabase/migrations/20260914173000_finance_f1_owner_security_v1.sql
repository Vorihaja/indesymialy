-- FINANCE-F1: canonical owner scopes, authorization, RLS and RPC hardening.
-- Additive and data preserving. Existing ledger rows remain authoritative.
begin;

-- 1. Extend the existing authority; do not create a parallel owner registry.
alter table public.financial_accounts add column if not exists event_id uuid references public.events(id) on delete restrict;
alter table public.financial_accounts add column if not exists platform_key text;
alter table public.financial_accounts drop constraint if exists financial_accounts_owner_type_check;
alter table public.financial_accounts drop constraint if exists financial_accounts_owner_check;
alter table public.financial_accounts add constraint financial_accounts_owner_type_check
  check (owner_type in ('profile','organization','event','platform','system')) not valid;
alter table public.financial_accounts add constraint financial_accounts_owner_check check (
  (owner_type='profile' and profile_id is not null and organization_id is null and event_id is null and platform_key is null and system_key is null)
  or (owner_type='organization' and organization_id is not null and profile_id is null and event_id is null and platform_key is null and system_key is null)
  or (owner_type='event' and event_id is not null and profile_id is null and organization_id is null and platform_key is null and system_key is null)
  or (owner_type='platform' and platform_key is not null and platform_key='indesy' and profile_id is null and organization_id is null and event_id is null and system_key is null)
  or (owner_type='system' and system_key is not null and profile_id is null and organization_id is null and event_id is null and platform_key is null)
) not valid;
create unique index if not exists financial_accounts_event_currency_idx
  on public.financial_accounts(event_id,currency_code) where event_id is not null;
create unique index if not exists financial_accounts_platform_currency_idx
  on public.financial_accounts(platform_key,currency_code) where platform_key is not null;

alter table public.finance_categories add column if not exists event_id uuid references public.events(id) on delete cascade;
alter table public.finance_categories add column if not exists platform_key text;
alter table public.finance_categories drop constraint if exists finance_categories_owner_type_check;
alter table public.finance_categories drop constraint if exists finance_categories_owner_check;
alter table public.finance_categories add constraint finance_categories_owner_type_check
  check (owner_type in ('profile','organization','event','platform')) not valid;
alter table public.finance_categories add constraint finance_categories_owner_check check (
  (owner_type='profile' and profile_id is not null and organization_id is null and event_id is null and platform_key is null)
  or (owner_type='organization' and organization_id is not null and profile_id is null and event_id is null and platform_key is null)
  or (owner_type='event' and event_id is not null and profile_id is null and organization_id is null and platform_key is null)
  or (owner_type='platform' and platform_key is not null and platform_key='indesy' and profile_id is null and organization_id is null and event_id is null)
) not valid;
create unique index if not exists finance_categories_event_active_name_idx
  on public.finance_categories(event_id,operation_type,lower(name)) where event_id is not null and archived_at is null;
create unique index if not exists finance_categories_platform_active_name_idx
  on public.finance_categories(platform_key,operation_type,lower(name)) where platform_key is not null and archived_at is null;

alter table public.finance_manual_operations add column if not exists event_id uuid references public.events(id) on delete restrict;
alter table public.finance_manual_operations add column if not exists platform_key text;
alter table public.finance_manual_operations drop constraint if exists finance_manual_operations_owner_type_check;
alter table public.finance_manual_operations drop constraint if exists finance_manual_operations_owner_check;
alter table public.finance_manual_operations add constraint finance_manual_operations_owner_type_check
  check (owner_type in ('profile','organization','event','platform')) not valid;
alter table public.finance_manual_operations add constraint finance_manual_operations_owner_check check (
  (owner_type='profile' and profile_id is not null and organization_id is null and event_id is null and platform_key is null)
  or (owner_type='organization' and organization_id is not null and profile_id is null and event_id is null and platform_key is null)
  or (owner_type='event' and event_id is not null and profile_id is null and organization_id is null and platform_key is null)
  or (owner_type='platform' and platform_key is not null and platform_key='indesy' and profile_id is null and organization_id is null and event_id is null)
) not valid;
create index if not exists finance_manual_operations_event_date_idx
  on public.finance_manual_operations(event_id,occurred_at desc) where event_id is not null;
create index if not exists finance_manual_operations_platform_date_idx
  on public.finance_manual_operations(platform_key,occurred_at desc) where platform_key is not null;

-- Existing rows must already satisfy one of the historical profile/organization/system branches.
do $$
declare v_accounts bigint; v_categories bigint; v_operations bigint;
begin
  select count(*) into v_accounts from public.financial_accounts where not coalesce(
    (owner_type='profile' and profile_id is not null and organization_id is null and event_id is null and platform_key is null and system_key is null)
    or (owner_type='organization' and organization_id is not null and profile_id is null and event_id is null and platform_key is null and system_key is null)
    or (owner_type='event' and event_id is not null and profile_id is null and organization_id is null and platform_key is null and system_key is null)
    or (owner_type='platform' and platform_key is not null and platform_key='indesy' and profile_id is null and organization_id is null and event_id is null and system_key is null)
    or (owner_type='system' and system_key is not null and profile_id is null and organization_id is null and event_id is null and platform_key is null),false);
  select count(*) into v_categories from public.finance_categories where not coalesce(
    (owner_type='profile' and profile_id is not null and organization_id is null and event_id is null and platform_key is null)
    or (owner_type='organization' and organization_id is not null and profile_id is null and event_id is null and platform_key is null)
    or (owner_type='event' and event_id is not null and profile_id is null and organization_id is null and platform_key is null)
    or (owner_type='platform' and platform_key is not null and platform_key='indesy' and profile_id is null and organization_id is null and event_id is null),false);
  select count(*) into v_operations from public.finance_manual_operations where not coalesce(
    (owner_type='profile' and profile_id is not null and organization_id is null and event_id is null and platform_key is null)
    or (owner_type='organization' and organization_id is not null and profile_id is null and event_id is null and platform_key is null)
    or (owner_type='event' and event_id is not null and profile_id is null and organization_id is null and platform_key is null)
    or (owner_type='platform' and platform_key is not null and platform_key='indesy' and profile_id is null and organization_id is null and event_id is null),false);
  if v_accounts+v_categories+v_operations>0 then
    raise exception 'FINANCE-F1 unresolved owners: accounts=%, categories=%, operations=%',v_accounts,v_categories,v_operations;
  end if;
end;
$$;

alter table public.financial_accounts validate constraint financial_accounts_owner_type_check;
alter table public.financial_accounts validate constraint financial_accounts_owner_check;
alter table public.finance_categories validate constraint finance_categories_owner_type_check;
alter table public.finance_categories validate constraint finance_categories_owner_check;
alter table public.finance_manual_operations validate constraint finance_manual_operations_owner_type_check;
alter table public.finance_manual_operations validate constraint finance_manual_operations_owner_check;

-- 2. Read and manage are deliberately different authorities.
create or replace function public.can_read_finance_owner(p_owner_type text,p_owner_id uuid)
returns boolean language plpgsql stable security definer
set search_path='' as $$
declare v_organization_id uuid;
begin
  if auth.uid() is null then return false; end if;
  if p_owner_type='profile' then return p_owner_id=auth.uid(); end if;
  if p_owner_type='platform' then
    return public.is_super_admin()
      or public.has_admin_permission('admin.finance.view')
      or public.has_admin_permission('admin.finance.manage');
  end if;
  if p_owner_type='event' then
    select e.organizer_id into v_organization_id from public.events e where e.id=p_owner_id;
    return v_organization_id is not null and public.can_read_finance_owner('organization',v_organization_id);
  end if;
  if p_owner_type='organization' then
    return exists (
      select 1 from public.organizations o
      where o.id=p_owner_id and (
        o.owner_id=auth.uid()
        or public.is_super_admin()
        or public.has_admin_permission('admin.finance.view')
        or public.has_admin_permission('admin.finance.manage')
        or exists (
          select 1 from public.organization_members om
          where om.organization_id=o.id and om.profile_id=auth.uid()
            and om.role in ('owner','admin','manager','organizer')
            and coalesce(om.status,'active')='active'
        )
      )
    );
  end if;
  return false;
end;
$$;

create or replace function public.can_manage_finance_owner(p_owner_type text,p_owner_id uuid)
returns boolean language plpgsql stable security definer
set search_path='' as $$
declare v_organization_id uuid;
begin
  if auth.uid() is null then return false; end if;
  if p_owner_type='profile' then return p_owner_id=auth.uid(); end if;
  if p_owner_type='platform' then
    return public.is_super_admin() or public.has_admin_permission('admin.finance.manage');
  end if;
  if p_owner_type='event' then
    select e.organizer_id into v_organization_id from public.events e where e.id=p_owner_id;
    return v_organization_id is not null and public.can_manage_finance_owner('organization',v_organization_id);
  end if;
  if p_owner_type='organization' then
    return exists (
      select 1 from public.organizations o
      where o.id=p_owner_id and (
        o.owner_id=auth.uid()
        or public.is_super_admin()
        or public.has_admin_permission('admin.finance.manage')
        or exists (
          select 1 from public.organization_members om
          where om.organization_id=o.id and om.profile_id=auth.uid()
            and om.role in ('owner','admin','manager','organizer')
            and coalesce(om.status,'active')='active'
        )
      )
    );
  end if;
  return false;
end;
$$;

-- Compatibility wrapper: all nine legacy mini-app RPCs become manage-scoped.
create or replace function public.can_access_finance_owner(p_owner_type text,p_owner_id uuid)
returns boolean language sql stable security definer
set search_path='' as $$
  select public.can_manage_finance_owner(p_owner_type,p_owner_id);
$$;

create or replace function public.can_read_financial_account(p_account_id uuid)
returns boolean language sql stable security definer
set search_path='' as $$
  select exists (
    select 1 from public.financial_accounts fa
    where fa.id=p_account_id and fa.owner_type<>'system'
      and public.can_read_finance_owner(
        fa.owner_type,
        coalesce(fa.profile_id,fa.organization_id,fa.event_id)
      )
  );
$$;

create or replace function public.can_manage_financial_account(p_account_id uuid)
returns boolean language sql stable security definer
set search_path='' as $$
  select exists (
    select 1 from public.financial_accounts fa
    where fa.id=p_account_id and fa.owner_type<>'system'
      and public.can_manage_finance_owner(
        fa.owner_type,
        coalesce(fa.profile_id,fa.organization_id,fa.event_id)
      )
  );
$$;

create or replace function public.can_access_financial_account(p_account_id uuid)
returns boolean language sql stable security definer
set search_path='' as $$
  select public.can_read_financial_account(p_account_id);
$$;

revoke all on function public.can_read_finance_owner(text,uuid) from public,anon;
revoke all on function public.can_manage_finance_owner(text,uuid) from public,anon;
revoke all on function public.can_access_finance_owner(text,uuid) from public,anon;
revoke all on function public.can_read_financial_account(uuid) from public,anon;
revoke all on function public.can_manage_financial_account(uuid) from public,anon;
revoke all on function public.can_access_financial_account(uuid) from public,anon;
grant execute on function public.can_read_finance_owner(text,uuid) to authenticated;
grant execute on function public.can_manage_finance_owner(text,uuid) to authenticated;
grant execute on function public.can_access_finance_owner(text,uuid) to authenticated;
grant execute on function public.can_read_financial_account(uuid) to authenticated;
grant execute on function public.can_manage_financial_account(uuid) to authenticated;
grant execute on function public.can_access_financial_account(uuid) to authenticated;

-- 3. Existing account resolver now understands all canonical business scopes.
create or replace function public.ensure_financial_account(p_owner_type text,p_owner_id uuid,p_currency_code text)
returns uuid language plpgsql security definer
set search_path='' as $$
declare v_account_id uuid; v_currency text:=upper(btrim(coalesce(p_currency_code,'')));
begin
  if v_currency !~ '^[A-Z]{3}$' then raise exception using errcode='22023',message='Invalid financial currency code'; end if;
  if p_owner_type='profile' then
    if not exists(select 1 from public.profiles where id=p_owner_id) then raise exception 'Unknown finance profile owner'; end if;
    insert into public.financial_accounts(owner_type,profile_id,currency_code) values('profile',p_owner_id,v_currency)
      on conflict(profile_id,currency_code) where profile_id is not null do nothing;
    select id into v_account_id from public.financial_accounts where profile_id=p_owner_id and currency_code=v_currency;
  elsif p_owner_type='organization' then
    if not exists(select 1 from public.organizations where id=p_owner_id) then raise exception 'Unknown finance organization owner'; end if;
    insert into public.financial_accounts(owner_type,organization_id,currency_code) values('organization',p_owner_id,v_currency)
      on conflict(organization_id,currency_code) where organization_id is not null do nothing;
    select id into v_account_id from public.financial_accounts where organization_id=p_owner_id and currency_code=v_currency;
  elsif p_owner_type='event' then
    if not exists(select 1 from public.events where id=p_owner_id) then raise exception 'Unknown finance event owner'; end if;
    insert into public.financial_accounts(owner_type,event_id,currency_code) values('event',p_owner_id,v_currency)
      on conflict(event_id,currency_code) where event_id is not null do nothing;
    select id into v_account_id from public.financial_accounts where event_id=p_owner_id and currency_code=v_currency;
  elsif p_owner_type='platform' then
    if p_owner_id is not null then raise exception 'Platform finance owner id must be null'; end if;
    insert into public.financial_accounts(owner_type,platform_key,currency_code) values('platform','indesy',v_currency)
      on conflict(platform_key,currency_code) where platform_key is not null do nothing;
    select id into v_account_id from public.financial_accounts where platform_key='indesy' and currency_code=v_currency;
  else raise exception using errcode='22023',message='Unsupported financial owner type';
  end if;
  return v_account_id;
end;
$$;
revoke all on function public.ensure_financial_account(text,uuid,text) from public,anon,authenticated;

-- 4. RLS is read-only for clients; all physical writes remain RPC-only.
alter table public.financial_accounts enable row level security;
alter table public.financial_payments enable row level security;
alter table public.financial_entries enable row level security;
alter table public.finance_categories enable row level security;
alter table public.finance_manual_operations enable row level security;

drop policy if exists financial_accounts_parties_read on public.financial_accounts;
create policy financial_accounts_owner_select on public.financial_accounts for select to authenticated
  using (public.can_read_financial_account(id));
drop policy if exists financial_payments_parties_read on public.financial_payments;
create policy financial_payments_owner_select on public.financial_payments for select to authenticated
  using (public.can_read_financial_account(payer_account_id) or public.can_read_financial_account(payee_account_id));
drop policy if exists financial_entries_account_read on public.financial_entries;
create policy financial_entries_owner_select on public.financial_entries for select to authenticated
  using (public.can_read_financial_account(account_id));
drop policy if exists finance_categories_owner_read on public.finance_categories;
create policy finance_categories_owner_select on public.finance_categories for select to authenticated
  using (public.can_read_finance_owner(owner_type,coalesce(profile_id,organization_id,event_id)));
drop policy if exists finance_manual_operations_owner_read on public.finance_manual_operations;
create policy finance_manual_operations_owner_select on public.finance_manual_operations for select to authenticated
  using (public.can_read_finance_owner(owner_type,coalesce(profile_id,organization_id,event_id)));

revoke all on public.financial_accounts,public.financial_payments,public.financial_entries,public.finance_categories,public.finance_manual_operations from public,anon;
revoke insert,update,delete on public.financial_accounts,public.financial_payments,public.financial_entries,public.finance_categories,public.finance_manual_operations from authenticated;
grant select on public.financial_accounts,public.financial_payments,public.financial_entries,public.finance_categories,public.finance_manual_operations to authenticated;

create or replace view public.financial_account_balances
with (security_invoker=true) as
select fa.id account_id,fa.owner_type,fa.profile_id,fa.organization_id,fa.currency_code,
  coalesce(sum(case when fe.entry_type='revenue' then fe.amount else -fe.amount end),0)::numeric(14,2) balance,
  coalesce(sum(fe.amount) filter(where fe.entry_type='revenue'),0)::numeric(14,2) total_revenue,
  coalesce(sum(fe.amount) filter(where fe.entry_type='expense'),0)::numeric(14,2) total_expense,
  fa.event_id,fa.platform_key
from public.financial_accounts fa left join public.financial_entries fe on fe.account_id=fa.id
group by fa.id;
revoke all on public.financial_account_balances from public,anon;
grant select on public.financial_account_balances to authenticated;

-- 5. Only manageable contexts are offered to the current CRUD-capable Finance routes.
create or replace function public.list_finance_owners()
returns table(owner_type text,owner_id uuid,label text)
language plpgsql stable security definer
set search_path='' as $$
begin
  if auth.uid() is null then return; end if;
  return query select 'profile'::text,auth.uid(),'Personnel'::text;
  return query
    select 'organization'::text,o.id,coalesce(nullif(btrim(o.name),''),'Organisation')::text
    from public.organizations o
    where public.can_manage_finance_owner('organization',o.id)
    order by lower(coalesce(nullif(btrim(o.name),''),'Organisation'));
end;
$$;

-- 6. Secure detail RPC removes the direct-table runtime bypass and verifies expected owner.
create or replace function public.get_finance_manual_operation(
  p_operation_id uuid,p_owner_type text,p_owner_id uuid
) returns jsonb language plpgsql stable security definer
set search_path='' as $$
declare v_row public.finance_manual_operations%rowtype; v_actual_id uuid;
begin
  if auth.uid() is null then raise exception using errcode='42501',message='Authentication required'; end if;
  select * into v_row from public.finance_manual_operations where id=p_operation_id;
  if not found then return null; end if;
  v_actual_id:=coalesce(v_row.profile_id,v_row.organization_id,v_row.event_id);
  if v_row.owner_type<>p_owner_type or v_actual_id is distinct from p_owner_id then
    raise exception using errcode='42501',message='Finance operation owner mismatch';
  end if;
  if not public.can_read_finance_owner(v_row.owner_type,v_actual_id) then
    raise exception using errcode='42501',message='Finance operation access denied';
  end if;
  return jsonb_build_object(
    'id',v_row.id,'operation_type',v_row.operation_type,'amount',v_row.amount,
    'currency_code',v_row.currency_code,'category_id',v_row.category_id,'category_name',v_row.category_name,
    'description',v_row.description,'occurred_at',v_row.occurred_at,'reference',v_row.reference,
    'payment_method',v_row.payment_method,'counterparty_name',v_row.counterparty_name,
    'notes',v_row.notes,'receipt_path',v_row.receipt_path,'reversed_at',v_row.reversed_at
  );
end;
$$;

-- 7. Legacy ledger mutation APIs must require manage, not merely read.
create or replace function public.post_financial_payment(
  p_payer_type text,p_payer_id uuid,p_payee_type text,p_payee_id uuid,p_amount numeric,
  p_currency_code text,p_idempotency_key text,p_source_type text,p_source_id uuid,
  p_reference text,p_description text,p_occurred_at timestamptz default now()
) returns uuid language plpgsql security definer
set search_path='' as $$
declare v_payer_account_id uuid;
begin
  if auth.uid() is null or not public.can_manage_finance_owner(p_payer_type,p_payer_id) then
    raise exception using errcode='42501',message='Only an authorized payer manager can post this payment';
  end if;
  v_payer_account_id:=public.ensure_financial_account(p_payer_type,p_payer_id,p_currency_code);
  if not public.can_manage_financial_account(v_payer_account_id) then
    raise exception using errcode='42501',message='Financial payer account access denied';
  end if;
  return public.post_financial_payment_internal(
    p_payer_type,p_payer_id,p_payee_type,p_payee_id,p_amount,p_currency_code,p_idempotency_key,
    p_source_type,p_source_id,p_reference,p_description,auth.uid(),'payment',null,p_occurred_at
  );
end;
$$;

create or replace function public.refund_financial_payment(
  p_payment_id uuid,p_idempotency_key text,p_reference text default null,
  p_description text default null,p_occurred_at timestamptz default now()
) returns uuid language plpgsql security definer
set search_path='' as $$
declare v_original public.financial_payments%rowtype; v_payer public.financial_accounts%rowtype; v_payee public.financial_accounts%rowtype;
begin
  if auth.uid() is null then raise exception using errcode='42501',message='Authentication required'; end if;
  select * into v_original from public.financial_payments where id=p_payment_id for update;
  if not found or v_original.payment_kind<>'payment' then raise exception using errcode='22023',message='Refundable payment not found'; end if;
  if not public.can_manage_financial_account(v_original.payee_account_id) then
    raise exception using errcode='42501',message='Only an authorized payee manager can refund this payment';
  end if;
  select * into v_payer from public.financial_accounts where id=v_original.payer_account_id;
  select * into v_payee from public.financial_accounts where id=v_original.payee_account_id;
  return public.post_financial_payment_internal(
    v_payee.owner_type,coalesce(v_payee.profile_id,v_payee.organization_id,v_payee.event_id),
    v_payer.owner_type,coalesce(v_payer.profile_id,v_payer.organization_id,v_payer.event_id),
    v_original.amount,v_original.currency_code,p_idempotency_key,'financial_refund',p_payment_id,
    p_reference,coalesce(p_description,'Remboursement: '||v_original.description),auth.uid(),'refund',v_original.id,p_occurred_at
  );
end;
$$;

-- The nine existing mini-app RPC signatures are preserved. Their existing validation remains,
-- and all calls to can_access_finance_owner now resolve to the strict manage authority above.
-- Read-only direct access continues to use can_read_finance_owner through RLS.

-- Harden the complete public Finance RPC surface without changing its signatures.
alter function public.list_finance_owners() set search_path='';
alter function public.get_finance_account_snapshot(text,uuid,text) set search_path='';
alter function public.get_finance_ledger_entries(text,uuid,text,timestamptz,timestamptz,integer) set search_path='';
alter function public.get_finance_categories(text,uuid,text) set search_path='';
alter function public.create_finance_category(text,uuid,text,text,text,integer) set search_path='';
alter function public.update_finance_category(uuid,text,text,integer) set search_path='';
alter function public.archive_finance_category(uuid) set search_path='';
alter function public.post_manual_financial_operation(text,uuid,text,numeric,text,text,text,text,uuid,timestamptz,text,text,text,text,text) set search_path='';
alter function public.reverse_manual_financial_operation(uuid,text,text,timestamptz) set search_path='';

-- Transitive SECURITY DEFINER dependencies used by the public Finance RPCs.
-- Their bodies already qualify every application object with public/auth.
alter function public.ensure_financial_system_account(text,text) set search_path='';
alter function public.post_financial_payment_accounts_internal(uuid,uuid,numeric,text,text,text,uuid,text,text,uuid,text,uuid,timestamptz) set search_path='';
alter function public.post_financial_payment_internal(text,uuid,text,uuid,numeric,text,text,text,uuid,text,text,uuid,text,uuid,timestamptz) set search_path='';
alter function public.is_super_admin() set search_path='';
alter function public.has_admin_permission(text) set search_path='';

revoke all on function public.ensure_financial_system_account(text,text) from public,anon,authenticated;
revoke all on function public.post_financial_payment_accounts_internal(uuid,uuid,numeric,text,text,text,uuid,text,text,uuid,text,uuid,timestamptz) from public,anon,authenticated;
revoke all on function public.post_financial_payment_internal(text,uuid,text,uuid,numeric,text,text,text,uuid,text,text,uuid,text,uuid,timestamptz) from public,anon,authenticated;
revoke all on function public.is_super_admin() from public,anon;
revoke all on function public.has_admin_permission(text) from public,anon;

revoke all on function public.get_finance_account_snapshot(text,uuid,text) from public,anon;
revoke all on function public.get_finance_ledger_entries(text,uuid,text,timestamptz,timestamptz,integer) from public,anon;
revoke all on function public.get_finance_categories(text,uuid,text) from public,anon;
revoke all on function public.create_finance_category(text,uuid,text,text,text,integer) from public,anon;
revoke all on function public.update_finance_category(uuid,text,text,integer) from public,anon;
revoke all on function public.archive_finance_category(uuid) from public,anon;
revoke all on function public.post_manual_financial_operation(text,uuid,text,numeric,text,text,text,text,uuid,timestamptz,text,text,text,text,text) from public,anon;
revoke all on function public.reverse_manual_financial_operation(uuid,text,text,timestamptz) from public,anon;

revoke all on function public.list_finance_owners() from public,anon;
revoke all on function public.get_finance_manual_operation(uuid,text,uuid) from public,anon;
revoke all on function public.post_financial_payment(text,uuid,text,uuid,numeric,text,text,text,uuid,text,text,timestamptz) from public,anon;
revoke all on function public.refund_financial_payment(uuid,text,text,text,timestamptz) from public,anon;
grant execute on function public.list_finance_owners() to authenticated;
grant execute on function public.get_finance_manual_operation(uuid,text,uuid) to authenticated;
grant execute on function public.post_financial_payment(text,uuid,text,uuid,numeric,text,text,text,uuid,text,text,timestamptz) to authenticated;
grant execute on function public.refund_financial_payment(uuid,text,text,text,timestamptz) to authenticated;

comment on function public.can_read_finance_owner(text,uuid) is 'FINANCE-F1 canonical read authority derived from auth.uid(), finance admin permissions and real ownership/membership.';
comment on function public.can_manage_finance_owner(text,uuid) is 'FINANCE-F1 canonical mutation authority. Never grants organization finance to a generic active member.';
comment on function public.can_access_finance_owner(text,uuid) is 'Compatibility wrapper for the nine legacy Finance mini-app RPCs; intentionally manage-scoped.';

commit;
