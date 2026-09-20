-- ==========================================================
-- INDESY MIALY
-- FIN-1B - MANUAL FINANCE CORE V1
--
-- Existing authority preserved:
--   financial_accounts
--   financial_payments
--   financial_entries
--
-- Manual operations use an invisible system clearing account.
-- Accounting history is append-only.
-- Corrections use reverse payments, never destructive deletes.
-- ==========================================================

begin;

-- ==========================================================
-- 1. EXTEND FINANCIAL ACCOUNTS FOR HIDDEN SYSTEM ACCOUNTS
-- ==========================================================

alter table public.financial_accounts
  add column if not exists system_key text;

alter table public.financial_accounts
  drop constraint if exists financial_accounts_owner_type_check;

alter table public.financial_accounts
  drop constraint if exists financial_accounts_owner_check;

alter table public.financial_accounts
  add constraint financial_accounts_owner_type_check
  check (
    owner_type in (
      'profile',
      'organization',
      'system'
    )
  );

alter table public.financial_accounts
  add constraint financial_accounts_owner_check
  check (
    (
      owner_type = 'profile'
      and profile_id is not null
      and organization_id is null
      and system_key is null
    )
    or
    (
      owner_type = 'organization'
      and organization_id is not null
      and profile_id is null
      and system_key is null
    )
    or
    (
      owner_type = 'system'
      and profile_id is null
      and organization_id is null
      and system_key is not null
      and length(btrim(system_key)) between 1 and 80
    )
  );

create unique index if not exists
  financial_accounts_system_currency_idx
on public.financial_accounts(
  system_key,
  currency_code
)
where system_key is not null;

comment on column public.financial_accounts.system_key is
  'Internal-only account identity. System accounts are invisible to normal users and are used for balanced technical postings such as manual finance clearing.';

-- ==========================================================
-- 2. FINANCE OWNER ACCESS
-- ==========================================================

create or replace function public.can_access_finance_owner(
  p_owner_type text,
  p_owner_id uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_access boolean := false;
begin
  if auth.uid() is null then
    return false;
  end if;

  if p_owner_type = 'profile' then
    return p_owner_id = auth.uid();
  end if;

  if p_owner_type = 'organization' then
    select exists (
      select 1
      from public.financial_accounts fa
      where fa.owner_type = 'organization'
        and fa.organization_id = p_owner_id
        and public.can_access_financial_account(fa.id)
    )
    into v_access;

    if v_access then
      return true;
    end if;

    return public.can_manage_organization(p_owner_id);
  end if;

  return false;
end;
$$;

revoke all on function
  public.can_access_finance_owner(text, uuid)
from public, anon;

grant execute on function
  public.can_access_finance_owner(text, uuid)
to authenticated;

-- ==========================================================
-- 3. INTERNAL SYSTEM ACCOUNT RESOLUTION
-- ==========================================================

create or replace function public.ensure_financial_system_account(
  p_system_key text,
  p_currency_code text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account_id uuid;
  v_key text;
  v_currency text;
begin
  v_key := btrim(coalesce(p_system_key, ''));
  v_currency := upper(btrim(coalesce(p_currency_code, '')));

  if length(v_key) < 1 or length(v_key) > 80 then
    raise exception using
      errcode = '22023',
      message = 'Invalid financial system account key';
  end if;

  if v_currency !~ '^[A-Z]{3}$' then
    raise exception using
      errcode = '22023',
      message = 'Invalid financial currency code';
  end if;

  insert into public.financial_accounts(
    owner_type,
    profile_id,
    organization_id,
    system_key,
    currency_code
  )
  values (
    'system',
    null,
    null,
    v_key,
    v_currency
  )
  on conflict (
    system_key,
    currency_code
  )
  where system_key is not null
  do nothing;

  select fa.id
  into v_account_id
  from public.financial_accounts fa
  where fa.owner_type = 'system'
    and fa.system_key = v_key
    and fa.currency_code = v_currency;

  if v_account_id is null then
    raise exception using
      errcode = 'P0001',
      message = 'Financial system account could not be resolved';
  end if;

  return v_account_id;
end;
$$;

revoke all on function
  public.ensure_financial_system_account(text, text)
from public, anon, authenticated;

-- ==========================================================
-- 4. ACCOUNT-ID BASED INTERNAL POSTING
--
-- This is the common low-level posting primitive.
-- Existing profile/organization posting keeps its public API.
-- ==========================================================

create or replace function public.post_financial_payment_accounts_internal(
  p_payer_account_id uuid,
  p_payee_account_id uuid,
  p_amount numeric,
  p_currency_code text,
  p_idempotency_key text,
  p_source_type text,
  p_source_id uuid,
  p_reference text,
  p_description text,
  p_created_by uuid default null,
  p_payment_kind text default 'payment',
  p_refunded_payment_id uuid default null,
  p_occurred_at timestamptz default now()
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment_id uuid;
  v_payer public.financial_accounts%rowtype;
  v_payee public.financial_accounts%rowtype;
  v_currency text;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception using
      errcode = '22003',
      message = 'Payment amount must be positive';
  end if;

  if p_payer_account_id is null
     or p_payee_account_id is null
     or p_payer_account_id = p_payee_account_id then
    raise exception using
      errcode = '22023',
      message = 'Payer and payee accounts must be different';
  end if;

  if length(btrim(coalesce(p_idempotency_key, ''))) < 1 then
    raise exception using
      errcode = '22023',
      message = 'Idempotency key is required';
  end if;

  if length(btrim(coalesce(p_source_type, ''))) < 1 then
    raise exception using
      errcode = '22023',
      message = 'Financial source type is required';
  end if;

  if length(btrim(coalesce(p_description, ''))) < 1 then
    raise exception using
      errcode = '22023',
      message = 'Financial description is required';
  end if;

  v_currency := upper(btrim(coalesce(p_currency_code, '')));

  if v_currency !~ '^[A-Z]{3}$' then
    raise exception using
      errcode = '22023',
      message = 'Invalid financial currency code';
  end if;

  select *
  into v_payer
  from public.financial_accounts
  where id = p_payer_account_id;

  if not found then
    raise exception using
      errcode = '22023',
      message = 'Financial payer account not found';
  end if;

  select *
  into v_payee
  from public.financial_accounts
  where id = p_payee_account_id;

  if not found then
    raise exception using
      errcode = '22023',
      message = 'Financial payee account not found';
  end if;

  if v_payer.currency_code <> v_currency
     or v_payee.currency_code <> v_currency then
    raise exception using
      errcode = '22023',
      message = 'Financial account currency mismatch';
  end if;

  select fp.id
  into v_payment_id
  from public.financial_payments fp
  where fp.idempotency_key = p_idempotency_key;

  if v_payment_id is not null then
    return v_payment_id;
  end if;

  insert into public.financial_payments(
    payer_account_id,
    payee_account_id,
    amount,
    currency_code,
    payment_kind,
    status,
    idempotency_key,
    source_type,
    source_id,
    reference,
    description,
    refunded_payment_id,
    occurred_at,
    created_by
  )
  values (
    p_payer_account_id,
    p_payee_account_id,
    p_amount,
    v_currency,
    p_payment_kind,
    'completed',
    btrim(p_idempotency_key),
    btrim(p_source_type),
    p_source_id,
    nullif(btrim(coalesce(p_reference, '')), ''),
    btrim(p_description),
    p_refunded_payment_id,
    coalesce(p_occurred_at, now()),
    p_created_by
  )
  on conflict (idempotency_key)
  do nothing
  returning id
  into v_payment_id;

  if v_payment_id is null then
    select fp.id
    into v_payment_id
    from public.financial_payments fp
    where fp.idempotency_key = p_idempotency_key;

    return v_payment_id;
  end if;

  insert into public.financial_entries(
    payment_id,
    account_id,
    entry_type,
    amount,
    currency_code,
    occurred_at,
    description,
    counterparty_account_id
  )
  values
  (
    v_payment_id,
    p_payer_account_id,
    'expense',
    p_amount,
    v_currency,
    coalesce(p_occurred_at, now()),
    btrim(p_description),
    p_payee_account_id
  ),
  (
    v_payment_id,
    p_payee_account_id,
    'revenue',
    p_amount,
    v_currency,
    coalesce(p_occurred_at, now()),
    btrim(p_description),
    p_payer_account_id
  );

  return v_payment_id;
end;
$$;

revoke all on function
  public.post_financial_payment_accounts_internal(
    uuid,
    uuid,
    numeric,
    text,
    text,
    text,
    uuid,
    text,
    text,
    uuid,
    text,
    uuid,
    timestamptz
  )
from public, anon, authenticated;

-- ==========================================================
-- 5. PRESERVE EXISTING INTERNAL POSTING CONTRACT
--
-- Existing triggers and repositories continue calling exactly
-- the same function signature.
-- ==========================================================

create or replace function public.post_financial_payment_internal(
  p_payer_type text,
  p_payer_id uuid,
  p_payee_type text,
  p_payee_id uuid,
  p_amount numeric,
  p_currency_code text,
  p_idempotency_key text,
  p_source_type text,
  p_source_id uuid,
  p_reference text,
  p_description text,
  p_created_by uuid default null,
  p_payment_kind text default 'payment',
  p_refunded_payment_id uuid default null,
  p_occurred_at timestamptz default now()
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payer_account_id uuid;
  v_payee_account_id uuid;
begin
  v_payer_account_id :=
    public.ensure_financial_account(
      p_payer_type,
      p_payer_id,
      p_currency_code
    );

  v_payee_account_id :=
    public.ensure_financial_account(
      p_payee_type,
      p_payee_id,
      p_currency_code
    );

  return public.post_financial_payment_accounts_internal(
    v_payer_account_id,
    v_payee_account_id,
    p_amount,
    p_currency_code,
    p_idempotency_key,
    p_source_type,
    p_source_id,
    p_reference,
    p_description,
    p_created_by,
    p_payment_kind,
    p_refunded_payment_id,
    p_occurred_at
  );
end;
$$;

revoke all on function
  public.post_financial_payment_internal(
    text,
    uuid,
    text,
    uuid,
    numeric,
    text,
    text,
    text,
    uuid,
    text,
    text,
    uuid,
    text,
    uuid,
    timestamptz
  )
from public, anon, authenticated;

-- ==========================================================
-- 6. CUSTOM FINANCE CATEGORIES
-- ==========================================================

create table if not exists public.finance_categories (
  id uuid primary key default gen_random_uuid(),

  owner_type text not null
    check (owner_type in ('profile', 'organization')),

  profile_id uuid
    references public.profiles(id)
    on delete cascade,

  organization_id uuid
    references public.organizations(id)
    on delete cascade,

  operation_type text not null
    check (operation_type in ('income', 'expense')),

  name text not null
    check (length(btrim(name)) between 1 and 120),

  description text,

  sort_order integer not null default 0,

  archived_at timestamptz,

  created_by uuid not null
    references public.profiles(id)
    on delete restrict,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint finance_categories_owner_check check (
    (
      owner_type = 'profile'
      and profile_id is not null
      and organization_id is null
    )
    or
    (
      owner_type = 'organization'
      and organization_id is not null
      and profile_id is null
    )
  )
);

create unique index if not exists
  finance_categories_profile_active_name_idx
on public.finance_categories(
  profile_id,
  operation_type,
  lower(name)
)
where profile_id is not null
  and archived_at is null;

create unique index if not exists
  finance_categories_organization_active_name_idx
on public.finance_categories(
  organization_id,
  operation_type,
  lower(name)
)
where organization_id is not null
  and archived_at is null;

create index if not exists
  finance_categories_profile_idx
on public.finance_categories(
  profile_id,
  operation_type,
  sort_order,
  name
)
where profile_id is not null;

create index if not exists
  finance_categories_organization_idx
on public.finance_categories(
  organization_id,
  operation_type,
  sort_order,
  name
)
where organization_id is not null;

comment on table public.finance_categories is
  'User-defined persistent categories for manual income and expense operations. Categories are owner-scoped and archived instead of hard-deleted.';

-- ==========================================================
-- 7. MANUAL OPERATIONS
-- ==========================================================

create table if not exists public.finance_manual_operations (
  id uuid primary key default gen_random_uuid(),

  owner_type text not null
    check (owner_type in ('profile', 'organization')),

  profile_id uuid
    references public.profiles(id)
    on delete restrict,

  organization_id uuid
    references public.organizations(id)
    on delete restrict,

  operation_type text not null
    check (operation_type in ('income', 'expense')),

  category_id uuid
    references public.finance_categories(id)
    on delete set null,

  category_name text not null
    check (length(btrim(category_name)) between 1 and 120),

  amount numeric(14,2) not null
    check (amount > 0),

  currency_code text not null default 'MGA'
    check (currency_code ~ '^[A-Z]{3}$'),

  occurred_at timestamptz not null default now(),

  description text not null
    check (length(btrim(description)) between 1 and 500),

  reference text,
  payment_method text,
  counterparty_name text,
  notes text,
  receipt_path text,

  idempotency_key text not null
    unique
    check (
      length(btrim(idempotency_key))
      between 1 and 200
    ),

  financial_payment_id uuid
    unique
    references public.financial_payments(id)
    on delete restrict,

  reversed_at timestamptz,

  reversal_payment_id uuid
    unique
    references public.financial_payments(id)
    on delete restrict,

  reversal_reason text,

  created_by uuid not null
    references public.profiles(id)
    on delete restrict,

  created_at timestamptz not null default now(),

  constraint finance_manual_operations_owner_check check (
    (
      owner_type = 'profile'
      and profile_id is not null
      and organization_id is null
    )
    or
    (
      owner_type = 'organization'
      and organization_id is not null
      and profile_id is null
    )
  ),

  constraint finance_manual_operations_reversal_check check (
    (
      reversed_at is null
      and reversal_payment_id is null
    )
    or
    (
      reversed_at is not null
      and reversal_payment_id is not null
    )
  )
);

create index if not exists
  finance_manual_operations_profile_date_idx
on public.finance_manual_operations(
  profile_id,
  occurred_at desc
)
where profile_id is not null;

create index if not exists
  finance_manual_operations_organization_date_idx
on public.finance_manual_operations(
  organization_id,
  occurred_at desc
)
where organization_id is not null;

create index if not exists
  finance_manual_operations_category_idx
on public.finance_manual_operations(category_id)
where category_id is not null;

comment on table public.finance_manual_operations is
  'Manual owner-scoped income and expense source records. Every posted operation maps to the append-only financial ledger. Corrections are performed by reversal payments.';

-- ==========================================================
-- 8. RLS
-- ==========================================================

alter table public.finance_categories
  enable row level security;

alter table public.finance_manual_operations
  enable row level security;

drop policy if exists
  finance_categories_owner_read
on public.finance_categories;

create policy finance_categories_owner_read
on public.finance_categories
for select
to authenticated
using (
  public.can_access_finance_owner(
    owner_type,
    coalesce(profile_id, organization_id)
  )
);

drop policy if exists
  finance_manual_operations_owner_read
on public.finance_manual_operations;

create policy finance_manual_operations_owner_read
on public.finance_manual_operations
for select
to authenticated
using (
  public.can_access_finance_owner(
    owner_type,
    coalesce(profile_id, organization_id)
  )
);

revoke insert, update, delete
on public.finance_categories
from authenticated;

revoke insert, update, delete
on public.finance_manual_operations
from authenticated;

grant select
on public.finance_categories
to authenticated;

grant select
on public.finance_manual_operations
to authenticated;

-- ==========================================================
-- 9. CATEGORY RPC - CREATE
-- ==========================================================

create or replace function public.create_finance_category(
  p_owner_type text,
  p_owner_id uuid,
  p_operation_type text,
  p_name text,
  p_description text default null,
  p_sort_order integer default 0
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_name text;
begin
  if not public.can_access_finance_owner(
    p_owner_type,
    p_owner_id
  ) then
    raise exception using
      errcode = '42501',
      message = 'Finance owner access denied';
  end if;

  if p_operation_type not in ('income', 'expense') then
    raise exception using
      errcode = '22023',
      message = 'Invalid finance category operation type';
  end if;

  v_name := btrim(coalesce(p_name, ''));

  if length(v_name) < 1 or length(v_name) > 120 then
    raise exception using
      errcode = '22023',
      message = 'Invalid finance category name';
  end if;

  insert into public.finance_categories(
    owner_type,
    profile_id,
    organization_id,
    operation_type,
    name,
    description,
    sort_order,
    created_by
  )
  values (
    p_owner_type,
    case
      when p_owner_type = 'profile'
      then p_owner_id
      else null
    end,
    case
      when p_owner_type = 'organization'
      then p_owner_id
      else null
    end,
    p_operation_type,
    v_name,
    nullif(
      btrim(coalesce(p_description, '')),
      ''
    ),
    coalesce(p_sort_order, 0),
    auth.uid()
  )
  returning id
  into v_id;

  return v_id;
end;
$$;

-- ==========================================================
-- 10. CATEGORY RPC - UPDATE
-- ==========================================================

create or replace function public.update_finance_category(
  p_category_id uuid,
  p_name text,
  p_description text default null,
  p_sort_order integer default 0
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.finance_categories%rowtype;
  v_name text;
begin
  select *
  into v_row
  from public.finance_categories
  where id = p_category_id
  for update;

  if not found then
    raise exception using
      errcode = '22023',
      message = 'Finance category not found';
  end if;

  if not public.can_access_finance_owner(
    v_row.owner_type,
    coalesce(
      v_row.profile_id,
      v_row.organization_id
    )
  ) then
    raise exception using
      errcode = '42501',
      message = 'Finance category access denied';
  end if;

  if v_row.archived_at is not null then
    raise exception using
      errcode = '22023',
      message = 'Archived finance category cannot be edited';
  end if;

  v_name := btrim(coalesce(p_name, ''));

  if length(v_name) < 1 or length(v_name) > 120 then
    raise exception using
      errcode = '22023',
      message = 'Invalid finance category name';
  end if;

  update public.finance_categories
  set
    name = v_name,
    description = nullif(
      btrim(coalesce(p_description, '')),
      ''
    ),
    sort_order = coalesce(p_sort_order, 0),
    updated_at = now()
  where id = p_category_id;

  return p_category_id;
end;
$$;

-- ==========================================================
-- 11. CATEGORY RPC - ARCHIVE
-- ==========================================================

create or replace function public.archive_finance_category(
  p_category_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.finance_categories%rowtype;
begin
  select *
  into v_row
  from public.finance_categories
  where id = p_category_id
  for update;

  if not found then
    raise exception using
      errcode = '22023',
      message = 'Finance category not found';
  end if;

  if not public.can_access_finance_owner(
    v_row.owner_type,
    coalesce(
      v_row.profile_id,
      v_row.organization_id
    )
  ) then
    raise exception using
      errcode = '42501',
      message = 'Finance category access denied';
  end if;

  update public.finance_categories
  set
    archived_at = coalesce(archived_at, now()),
    updated_at = now()
  where id = p_category_id;

  return p_category_id;
end;
$$;

-- ==========================================================
-- 12. CATEGORY READ FEED
-- ==========================================================

create or replace function public.get_finance_categories(
  p_owner_type text,
  p_owner_id uuid,
  p_operation_type text default null
)
returns table(
  id uuid,
  operation_type text,
  name text,
  description text,
  sort_order integer,
  archived_at timestamptz,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.can_access_finance_owner(
    p_owner_type,
    p_owner_id
  ) then
    raise exception using
      errcode = '42501',
      message = 'Finance owner access denied';
  end if;

  return query
  select
    fc.id,
    fc.operation_type,
    fc.name,
    fc.description,
    fc.sort_order,
    fc.archived_at,
    fc.created_at
  from public.finance_categories fc
  where fc.owner_type = p_owner_type
    and (
      (
        p_owner_type = 'profile'
        and fc.profile_id = p_owner_id
      )
      or
      (
        p_owner_type = 'organization'
        and fc.organization_id = p_owner_id
      )
    )
    and fc.archived_at is null
    and (
      p_operation_type is null
      or fc.operation_type = p_operation_type
    )
  order by
    fc.sort_order,
    lower(fc.name);
end;
$$;

-- ==========================================================
-- 13. POST MANUAL INCOME / EXPENSE
-- ==========================================================

create or replace function public.post_manual_financial_operation(
  p_owner_type text,
  p_owner_id uuid,
  p_operation_type text,
  p_amount numeric,
  p_currency_code text,
  p_category_name text,
  p_description text,
  p_idempotency_key text,
  p_category_id uuid default null,
  p_occurred_at timestamptz default now(),
  p_reference text default null,
  p_payment_method text default null,
  p_counterparty_name text default null,
  p_notes text default null,
  p_receipt_path text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_operation_id uuid;
  v_existing_payment_id uuid;
  v_owner_account_id uuid;
  v_system_account_id uuid;
  v_payment_id uuid;
  v_category public.finance_categories%rowtype;
  v_category_name text;
  v_currency text;
begin
  if not public.can_access_finance_owner(
    p_owner_type,
    p_owner_id
  ) then
    raise exception using
      errcode = '42501',
      message = 'Finance owner access denied';
  end if;

  if p_operation_type not in ('income', 'expense') then
    raise exception using
      errcode = '22023',
      message = 'Manual finance operation must be income or expense';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception using
      errcode = '22003',
      message = 'Manual finance amount must be positive';
  end if;

  if length(btrim(coalesce(p_description, ''))) < 1 then
    raise exception using
      errcode = '22023',
      message = 'Manual finance description is required';
  end if;

  if length(btrim(coalesce(p_idempotency_key, ''))) < 1 then
    raise exception using
      errcode = '22023',
      message = 'Manual finance idempotency key is required';
  end if;

  v_currency :=
    upper(
      btrim(
        coalesce(
          p_currency_code,
          'MGA'
        )
      )
    );

  if v_currency !~ '^[A-Z]{3}$' then
    raise exception using
      errcode = '22023',
      message = 'Invalid manual finance currency';
  end if;

  select
    fmo.id,
    fmo.financial_payment_id
  into
    v_operation_id,
    v_existing_payment_id
  from public.finance_manual_operations fmo
  where fmo.idempotency_key = p_idempotency_key;

  if v_operation_id is not null then
    return v_operation_id;
  end if;

  if p_category_id is not null then
    select *
    into v_category
    from public.finance_categories
    where id = p_category_id;

    if not found then
      raise exception using
        errcode = '22023',
        message = 'Finance category not found';
    end if;

    if v_category.archived_at is not null then
      raise exception using
        errcode = '22023',
        message = 'Archived finance category cannot be used';
    end if;

    if v_category.operation_type <> p_operation_type then
      raise exception using
        errcode = '22023',
        message = 'Finance category type mismatch';
    end if;

    if v_category.owner_type <> p_owner_type then
      raise exception using
        errcode = '42501',
        message = 'Finance category owner mismatch';
    end if;

    if p_owner_type = 'profile'
       and v_category.profile_id <> p_owner_id then
      raise exception using
        errcode = '42501',
        message = 'Finance category profile mismatch';
    end if;

    if p_owner_type = 'organization'
       and v_category.organization_id <> p_owner_id then
      raise exception using
        errcode = '42501',
        message = 'Finance category organization mismatch';
    end if;

    v_category_name := v_category.name;
  else
    v_category_name :=
      btrim(
        coalesce(
          p_category_name,
          ''
        )
      );
  end if;

  if length(v_category_name) < 1
     or length(v_category_name) > 120 then
    raise exception using
      errcode = '22023',
      message = 'Manual finance category is required';
  end if;

  insert into public.finance_manual_operations(
    owner_type,
    profile_id,
    organization_id,
    operation_type,
    category_id,
    category_name,
    amount,
    currency_code,
    occurred_at,
    description,
    reference,
    payment_method,
    counterparty_name,
    notes,
    receipt_path,
    idempotency_key,
    created_by
  )
  values (
    p_owner_type,
    case
      when p_owner_type = 'profile'
      then p_owner_id
      else null
    end,
    case
      when p_owner_type = 'organization'
      then p_owner_id
      else null
    end,
    p_operation_type,
    p_category_id,
    v_category_name,
    p_amount,
    v_currency,
    coalesce(p_occurred_at, now()),
    btrim(p_description),
    nullif(
      btrim(coalesce(p_reference, '')),
      ''
    ),
    nullif(
      btrim(coalesce(p_payment_method, '')),
      ''
    ),
    nullif(
      btrim(coalesce(p_counterparty_name, '')),
      ''
    ),
    nullif(
      btrim(coalesce(p_notes, '')),
      ''
    ),
    nullif(
      btrim(coalesce(p_receipt_path, '')),
      ''
    ),
    btrim(p_idempotency_key),
    auth.uid()
  )
  on conflict (idempotency_key)
  do nothing
  returning id
  into v_operation_id;

  if v_operation_id is null then
    select fmo.id
    into v_operation_id
    from public.finance_manual_operations fmo
    where fmo.idempotency_key = p_idempotency_key;

    return v_operation_id;
  end if;

  v_owner_account_id :=
    public.ensure_financial_account(
      p_owner_type,
      p_owner_id,
      v_currency
    );

  v_system_account_id :=
    public.ensure_financial_system_account(
      'manual-clearing',
      v_currency
    );

  if p_operation_type = 'income' then
    v_payment_id :=
      public.post_financial_payment_accounts_internal(
        v_system_account_id,
        v_owner_account_id,
        p_amount,
        v_currency,
        'manual-finance-payment:' || btrim(p_idempotency_key),
        'manual_finance_operation',
        v_operation_id,
        p_reference,
        btrim(p_description),
        auth.uid(),
        'payment',
        null,
        coalesce(p_occurred_at, now())
      );
  else
    v_payment_id :=
      public.post_financial_payment_accounts_internal(
        v_owner_account_id,
        v_system_account_id,
        p_amount,
        v_currency,
        'manual-finance-payment:' || btrim(p_idempotency_key),
        'manual_finance_operation',
        v_operation_id,
        p_reference,
        btrim(p_description),
        auth.uid(),
        'payment',
        null,
        coalesce(p_occurred_at, now())
      );
  end if;

  update public.finance_manual_operations
  set financial_payment_id = v_payment_id
  where id = v_operation_id;

  return v_operation_id;
end;
$$;

-- ==========================================================
-- 14. REVERSE MANUAL OPERATION
--
-- Never deletes the original operation or ledger entries.
-- ==========================================================

create or replace function public.reverse_manual_financial_operation(
  p_operation_id uuid,
  p_idempotency_key text,
  p_reason text default null,
  p_occurred_at timestamptz default now()
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_operation public.finance_manual_operations%rowtype;
  v_original public.financial_payments%rowtype;
  v_reversal_payment_id uuid;
begin
  select *
  into v_operation
  from public.finance_manual_operations
  where id = p_operation_id
  for update;

  if not found then
    raise exception using
      errcode = '22023',
      message = 'Manual finance operation not found';
  end if;

  if not public.can_access_finance_owner(
    v_operation.owner_type,
    coalesce(
      v_operation.profile_id,
      v_operation.organization_id
    )
  ) then
    raise exception using
      errcode = '42501',
      message = 'Manual finance operation access denied';
  end if;

  if v_operation.reversal_payment_id is not null then
    return v_operation.reversal_payment_id;
  end if;

  if v_operation.financial_payment_id is null then
    raise exception using
      errcode = '22023',
      message = 'Manual finance operation has no posted payment';
  end if;

  select *
  into v_original
  from public.financial_payments
  where id = v_operation.financial_payment_id;

  if not found then
    raise exception using
      errcode = '22023',
      message = 'Original financial payment not found';
  end if;

  v_reversal_payment_id :=
    public.post_financial_payment_accounts_internal(
      v_original.payee_account_id,
      v_original.payer_account_id,
      v_original.amount,
      v_original.currency_code,
      btrim(p_idempotency_key),
      'manual_finance_operation_reversal',
      v_operation.id,
      v_original.reference,
      coalesce(
        nullif(btrim(coalesce(p_reason, '')), ''),
        'Annulation de l''opération manuelle : ' ||
        v_original.description
      ),
      auth.uid(),
      'refund',
      v_original.id,
      coalesce(p_occurred_at, now())
    );

  update public.finance_manual_operations
  set
    reversed_at = coalesce(p_occurred_at, now()),
    reversal_payment_id = v_reversal_payment_id,
    reversal_reason = nullif(
      btrim(coalesce(p_reason, '')),
      ''
    )
  where id = p_operation_id;

  return v_reversal_payment_id;
end;
$$;

-- ==========================================================
-- 15. ACCOUNT SNAPSHOT
-- ==========================================================

create or replace function public.get_finance_account_snapshot(
  p_owner_type text,
  p_owner_id uuid,
  p_currency_code text default 'MGA'
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_account_id uuid;
  v_currency text;
  v_balance numeric := 0;
  v_revenue numeric := 0;
  v_expense numeric := 0;
begin
  if not public.can_access_finance_owner(
    p_owner_type,
    p_owner_id
  ) then
    raise exception using
      errcode = '42501',
      message = 'Finance owner access denied';
  end if;

  v_currency :=
    upper(
      btrim(
        coalesce(
          p_currency_code,
          'MGA'
        )
      )
    );

  select fa.id
  into v_account_id
  from public.financial_accounts fa
  where fa.owner_type = p_owner_type
    and fa.currency_code = v_currency
    and (
      (
        p_owner_type = 'profile'
        and fa.profile_id = p_owner_id
      )
      or
      (
        p_owner_type = 'organization'
        and fa.organization_id = p_owner_id
      )
    );

  if v_account_id is not null then
    select
      fab.balance,
      fab.total_revenue,
      fab.total_expense
    into
      v_balance,
      v_revenue,
      v_expense
    from public.financial_account_balances fab
    where fab.account_id = v_account_id;
  end if;

  return jsonb_build_object(
    'ownerType', p_owner_type,
    'ownerId', p_owner_id,
    'accountId', v_account_id,
    'currencyCode', v_currency,
    'balance', coalesce(v_balance, 0),
    'totalRevenue', coalesce(v_revenue, 0),
    'totalExpense', coalesce(v_expense, 0)
  );
end;
$$;

-- ==========================================================
-- 16. LEDGER READ FEED
-- ==========================================================

create or replace function public.get_finance_ledger_entries(
  p_owner_type text,
  p_owner_id uuid,
  p_currency_code text default 'MGA',
  p_from timestamptz default null,
  p_to timestamptz default null,
  p_limit integer default 200
)
returns table(
  entry_id uuid,
  payment_id uuid,
  entry_type text,
  amount numeric,
  currency_code text,
  occurred_at timestamptz,
  description text,
  reference text,
  payment_kind text,
  source_type text,
  source_id uuid,
  counterparty_owner_type text,
  counterparty_profile_id uuid,
  counterparty_organization_id uuid,
  is_manual boolean,
  manual_operation_id uuid,
  manual_operation_type text,
  category_id uuid,
  category_name text,
  payment_method text,
  counterparty_name text,
  receipt_path text,
  reversed_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_account_id uuid;
  v_currency text;
  v_limit integer;
begin
  if not public.can_access_finance_owner(
    p_owner_type,
    p_owner_id
  ) then
    raise exception using
      errcode = '42501',
      message = 'Finance owner access denied';
  end if;

  v_currency :=
    upper(
      btrim(
        coalesce(
          p_currency_code,
          'MGA'
        )
      )
    );

  v_limit :=
    greatest(
      1,
      least(
        coalesce(p_limit, 200),
        500
      )
    );

  select fa.id
  into v_account_id
  from public.financial_accounts fa
  where fa.owner_type = p_owner_type
    and fa.currency_code = v_currency
    and (
      (
        p_owner_type = 'profile'
        and fa.profile_id = p_owner_id
      )
      or
      (
        p_owner_type = 'organization'
        and fa.organization_id = p_owner_id
      )
    );

  if v_account_id is null then
    return;
  end if;

  return query
  select
    fe.id,
    fp.id,
    fe.entry_type,
    fe.amount,
    fe.currency_code,
    fe.occurred_at,
    fe.description,
    fp.reference,
    fp.payment_kind,
    fp.source_type,
    fp.source_id,
    cp.owner_type,
    cp.profile_id,
    cp.organization_id,
    (fmo.id is not null),
    fmo.id,
    fmo.operation_type,
    fmo.category_id,
    fmo.category_name,
    fmo.payment_method,
    fmo.counterparty_name,
    fmo.receipt_path,
    fmo.reversed_at
  from public.financial_entries fe
  join public.financial_payments fp
    on fp.id = fe.payment_id
  join public.financial_accounts cp
    on cp.id = fe.counterparty_account_id
  left join public.finance_manual_operations fmo
    on fmo.financial_payment_id = fp.id
       or fmo.reversal_payment_id = fp.id
  where fe.account_id = v_account_id
    and fe.currency_code = v_currency
    and (
      p_from is null
      or fe.occurred_at >= p_from
    )
    and (
      p_to is null
      or fe.occurred_at <= p_to
    )
  order by
    fe.occurred_at desc,
    fe.id desc
  limit v_limit;
end;
$$;

-- ==========================================================
-- 17. RPC PERMISSIONS
-- ==========================================================

revoke all on function
  public.create_finance_category(
    text,
    uuid,
    text,
    text,
    text,
    integer
  )
from public, anon;

revoke all on function
  public.update_finance_category(
    uuid,
    text,
    text,
    integer
  )
from public, anon;

revoke all on function
  public.archive_finance_category(uuid)
from public, anon;

revoke all on function
  public.get_finance_categories(
    text,
    uuid,
    text
  )
from public, anon;

revoke all on function
  public.post_manual_financial_operation(
    text,
    uuid,
    text,
    numeric,
    text,
    text,
    text,
    text,
    uuid,
    timestamptz,
    text,
    text,
    text,
    text,
    text
  )
from public, anon;

revoke all on function
  public.reverse_manual_financial_operation(
    uuid,
    text,
    text,
    timestamptz
  )
from public, anon;

revoke all on function
  public.get_finance_account_snapshot(
    text,
    uuid,
    text
  )
from public, anon;

revoke all on function
  public.get_finance_ledger_entries(
    text,
    uuid,
    text,
    timestamptz,
    timestamptz,
    integer
  )
from public, anon;

grant execute on function
  public.create_finance_category(
    text,
    uuid,
    text,
    text,
    text,
    integer
  )
to authenticated;

grant execute on function
  public.update_finance_category(
    uuid,
    text,
    text,
    integer
  )
to authenticated;

grant execute on function
  public.archive_finance_category(uuid)
to authenticated;

grant execute on function
  public.get_finance_categories(
    text,
    uuid,
    text
  )
to authenticated;

grant execute on function
  public.post_manual_financial_operation(
    text,
    uuid,
    text,
    numeric,
    text,
    text,
    text,
    text,
    uuid,
    timestamptz,
    text,
    text,
    text,
    text,
    text
  )
to authenticated;

grant execute on function
  public.reverse_manual_financial_operation(
    uuid,
    text,
    text,
    timestamptz
  )
to authenticated;

grant execute on function
  public.get_finance_account_snapshot(
    text,
    uuid,
    text
  )
to authenticated;

grant execute on function
  public.get_finance_ledger_entries(
    text,
    uuid,
    text,
    timestamptz,
    timestamptz,
    integer
  )
to authenticated;

-- ==========================================================
-- 18. COMMENTS / CONTRACT
-- ==========================================================

comment on function public.post_manual_financial_operation(
  text,
  uuid,
  text,
  numeric,
  text,
  text,
  text,
  text,
  uuid,
  timestamptz,
  text,
  text,
  text,
  text,
  text
) is
  'Posts an owner-authorized manual income or expense through the canonical double-entry financial ledger using an internal clearing account.';

comment on function public.reverse_manual_financial_operation(
  uuid,
  text,
  text,
  timestamptz
) is
  'Reverses a manual finance operation through an immutable counter-payment. Original accounting records are never deleted.';

comment on function public.get_finance_ledger_entries(
  text,
  uuid,
  text,
  timestamptz,
  timestamptz,
  integer
) is
  'Owner-scoped finance ledger feed for the Indesy Finance mini-application.';

commit;
