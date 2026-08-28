-- Cross-party financial ledger.
-- Every completed payment produces one payer expense and one payee revenue.
-- Refunds are immutable counter-payments and never delete accounting history.
begin;

create table public.financial_accounts (
  id uuid primary key default gen_random_uuid(),
  owner_type text not null check (owner_type in ('profile', 'organization')),
  profile_id uuid references public.profiles(id) on delete restrict,
  organization_id uuid references public.organizations(id) on delete restrict,
  currency_code text not null default 'MGA' check (currency_code ~ '^[A-Z]{3}$'),
  created_at timestamptz not null default now(),
  constraint financial_accounts_owner_check check (
    (owner_type = 'profile' and profile_id is not null and organization_id is null)
    or
    (owner_type = 'organization' and organization_id is not null and profile_id is null)
  )
);
create unique index financial_accounts_profile_currency_idx
  on public.financial_accounts(profile_id, currency_code) where profile_id is not null;
create unique index financial_accounts_organization_currency_idx
  on public.financial_accounts(organization_id, currency_code) where organization_id is not null;

create table public.financial_payments (
  id uuid primary key default gen_random_uuid(),
  payer_account_id uuid not null references public.financial_accounts(id) on delete restrict,
  payee_account_id uuid not null references public.financial_accounts(id) on delete restrict,
  amount numeric(14,2) not null check (amount > 0),
  currency_code text not null check (currency_code ~ '^[A-Z]{3}$'),
  payment_kind text not null default 'payment' check (payment_kind in ('payment', 'refund')),
  status text not null default 'completed' check (status = 'completed'),
  idempotency_key text not null check (length(btrim(idempotency_key)) between 1 and 200),
  source_type text not null check (length(btrim(source_type)) between 1 and 80),
  source_id uuid,
  reference text,
  description text not null,
  refunded_payment_id uuid references public.financial_payments(id) on delete restrict,
  occurred_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint financial_payments_parties_check check (payer_account_id <> payee_account_id),
  constraint financial_payments_refund_check check (
    (payment_kind = 'payment' and refunded_payment_id is null)
    or (payment_kind = 'refund' and refunded_payment_id is not null)
  ),
  constraint financial_payments_idempotency_key unique (idempotency_key),
  constraint financial_payments_one_refund_key unique (refunded_payment_id)
);
create index financial_payments_payer_date_idx on public.financial_payments(payer_account_id, occurred_at desc);
create index financial_payments_payee_date_idx on public.financial_payments(payee_account_id, occurred_at desc);
create index financial_payments_source_idx on public.financial_payments(source_type, source_id) where source_id is not null;

create table public.financial_entries (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.financial_payments(id) on delete restrict,
  account_id uuid not null references public.financial_accounts(id) on delete restrict,
  entry_type text not null check (entry_type in ('expense', 'revenue')),
  amount numeric(14,2) not null check (amount > 0),
  currency_code text not null check (currency_code ~ '^[A-Z]{3}$'),
  occurred_at timestamptz not null,
  description text not null,
  counterparty_account_id uuid not null references public.financial_accounts(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint financial_entries_counterparty_check check (account_id <> counterparty_account_id),
  constraint financial_entries_payment_account_key unique (payment_id, account_id)
);
create index financial_entries_account_date_idx on public.financial_entries(account_id, occurred_at desc);

create view public.financial_account_balances
with (security_invoker = true) as
select
  fa.id as account_id,
  fa.owner_type,
  fa.profile_id,
  fa.organization_id,
  fa.currency_code,
  coalesce(sum(case when fe.entry_type = 'revenue' then fe.amount else -fe.amount end), 0)::numeric(14,2) as balance,
  coalesce(sum(fe.amount) filter (where fe.entry_type = 'revenue'), 0)::numeric(14,2) as total_revenue,
  coalesce(sum(fe.amount) filter (where fe.entry_type = 'expense'), 0)::numeric(14,2) as total_expense
from public.financial_accounts fa
left join public.financial_entries fe on fe.account_id = fa.id
group by fa.id;

create function public.can_access_financial_account(p_account_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.financial_accounts fa
    where fa.id = p_account_id
      and (
        fa.profile_id = auth.uid()
        or exists (
          select 1 from public.organizations o
          where o.id = fa.organization_id and o.owner_id = auth.uid()
        )
        or exists (
          select 1 from public.organization_members om
          where om.organization_id = fa.organization_id
            and om.profile_id = auth.uid()
            and coalesce(om.status, 'active') = 'active'
        )
      )
  );
$$;

create function public.ensure_financial_account(
  p_owner_type text,
  p_owner_id uuid,
  p_currency_code text
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_account_id uuid;
begin
  if p_owner_type = 'profile' then
    insert into public.financial_accounts(owner_type, profile_id, currency_code)
    values ('profile', p_owner_id, upper(p_currency_code))
    on conflict (profile_id, currency_code) where profile_id is not null do nothing;
    select id into v_account_id from public.financial_accounts
      where profile_id = p_owner_id and currency_code = upper(p_currency_code);
  elsif p_owner_type = 'organization' then
    insert into public.financial_accounts(owner_type, organization_id, currency_code)
    values ('organization', p_owner_id, upper(p_currency_code))
    on conflict (organization_id, currency_code) where organization_id is not null do nothing;
    select id into v_account_id from public.financial_accounts
      where organization_id = p_owner_id and currency_code = upper(p_currency_code);
  else
    raise exception using errcode = '22023', message = 'Unsupported financial owner type';
  end if;
  return v_account_id;
end;
$$;

create function public.post_financial_payment_internal(
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
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_payment_id uuid;
  v_payer_account_id uuid;
  v_payee_account_id uuid;
begin
  if p_amount <= 0 then
    raise exception using errcode = '22003', message = 'Payment amount must be positive';
  end if;

  select id into v_payment_id from public.financial_payments where idempotency_key = p_idempotency_key;
  if v_payment_id is not null then return v_payment_id; end if;

  v_payer_account_id := public.ensure_financial_account(p_payer_type, p_payer_id, p_currency_code);
  v_payee_account_id := public.ensure_financial_account(p_payee_type, p_payee_id, p_currency_code);

  insert into public.financial_payments(
    payer_account_id, payee_account_id, amount, currency_code, payment_kind,
    idempotency_key, source_type, source_id, reference, description,
    refunded_payment_id, occurred_at, created_by
  ) values (
    v_payer_account_id, v_payee_account_id, p_amount, upper(p_currency_code), p_payment_kind,
    p_idempotency_key, p_source_type, p_source_id, p_reference, p_description,
    p_refunded_payment_id, p_occurred_at, p_created_by
  ) returning id into v_payment_id;

  insert into public.financial_entries(
    payment_id, account_id, entry_type, amount, currency_code, occurred_at, description, counterparty_account_id
  ) values
    (v_payment_id, v_payer_account_id, 'expense', p_amount, upper(p_currency_code), p_occurred_at, p_description, v_payee_account_id),
    (v_payment_id, v_payee_account_id, 'revenue', p_amount, upper(p_currency_code), p_occurred_at, p_description, v_payer_account_id);

  return v_payment_id;
end;
$$;

create function public.post_financial_payment(
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
  p_occurred_at timestamptz default now()
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_payer_account_id uuid;
begin
  v_payer_account_id := public.ensure_financial_account(p_payer_type, p_payer_id, p_currency_code);
  if not public.can_access_financial_account(v_payer_account_id) then
    raise exception using errcode = '42501', message = 'Only the payer can post this payment';
  end if;
  return public.post_financial_payment_internal(
    p_payer_type, p_payer_id, p_payee_type, p_payee_id, p_amount, p_currency_code,
    p_idempotency_key, p_source_type, p_source_id, p_reference, p_description,
    auth.uid(), 'payment', null, p_occurred_at
  );
end;
$$;

create function public.refund_financial_payment(
  p_payment_id uuid,
  p_idempotency_key text,
  p_reference text default null,
  p_description text default null,
  p_occurred_at timestamptz default now()
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_original public.financial_payments%rowtype;
declare v_payer public.financial_accounts%rowtype;
declare v_payee public.financial_accounts%rowtype;
begin
  select * into v_original from public.financial_payments where id = p_payment_id for update;
  if not found or v_original.payment_kind <> 'payment' then
    raise exception using errcode = '22023', message = 'Refundable payment not found';
  end if;
  if not public.can_access_financial_account(v_original.payee_account_id) then
    raise exception using errcode = '42501', message = 'Only the original payee can refund this payment';
  end if;
  select * into v_payer from public.financial_accounts where id = v_original.payer_account_id;
  select * into v_payee from public.financial_accounts where id = v_original.payee_account_id;
  return public.post_financial_payment_internal(
    v_payee.owner_type, coalesce(v_payee.profile_id, v_payee.organization_id),
    v_payer.owner_type, coalesce(v_payer.profile_id, v_payer.organization_id),
    v_original.amount, v_original.currency_code, p_idempotency_key, 'financial_refund',
    p_payment_id, p_reference, coalesce(p_description, 'Remboursement: ' || v_original.description),
    auth.uid(), 'refund', p_payment_id, p_occurred_at
  );
end;
$$;

create function public.reject_financial_mutation()
returns trigger language plpgsql as $$
begin
  raise exception using errcode = '55000', message = 'Financial records are immutable; create a refund instead';
end;
$$;
create trigger financial_payments_immutable before update or delete on public.financial_payments
for each row execute function public.reject_financial_mutation();
create trigger financial_entries_immutable before update or delete on public.financial_entries
for each row execute function public.reject_financial_mutation();

-- Marketplace payments become ledger entries as soon as they are paid.
create function public.ledger_marketplace_payment_paid()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_transaction public.marketplace_transactions%rowtype;
begin
  if new.status = 'paid' and (tg_op = 'INSERT' or old.status is distinct from 'paid') then
    select * into v_transaction from public.marketplace_transactions where id = new.transaction_id;
    perform public.post_financial_payment_internal(
      case when v_transaction.transaction_type in ('refund', 'deposit_release') then 'organization' else 'profile' end,
      case when v_transaction.transaction_type in ('refund', 'deposit_release') then v_transaction.seller_organization_id else v_transaction.customer_id end,
      case when v_transaction.transaction_type in ('refund', 'deposit_release') then 'profile' else 'organization' end,
      case when v_transaction.transaction_type in ('refund', 'deposit_release') then v_transaction.customer_id else v_transaction.seller_organization_id end,
      v_transaction.amount, v_transaction.currency, 'marketplace-payment:' || new.id::text,
      'marketplace_payment', new.id, coalesce(new.provider_reference, v_transaction.external_reference),
      case when v_transaction.transaction_type in ('refund', 'deposit_release') then 'Remboursement marketplace' else 'Paiement marketplace' end,
      null, 'payment', null, coalesce(new.paid_at, now())
    );
  end if;
  return new;
end;
$$;
create trigger marketplace_payments_post_to_ledger
after insert or update of status on public.marketplace_payments
for each row execute function public.ledger_marketplace_payment_paid();

-- Staff and official payments debit the organizer and credit the beneficiary.
create function public.ledger_staff_payment_paid()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_profile_id uuid; declare v_organization_id uuid; declare v_event_id uuid;
begin
  if new.status = 'paid' and (tg_op = 'INSERT' or old.status is distinct from 'paid') then
    select sa.profile_id, sa.event_id into v_profile_id, v_event_id from public.staff_assignments sa where sa.id = new.staff_assignment_id;
    select e.organizer_id into v_organization_id from public.events e where e.id = v_event_id;
    if v_profile_id is not null and v_organization_id is not null then
      perform public.post_financial_payment_internal(
        'organization', v_organization_id, 'profile', v_profile_id, new.amount, new.currency_code,
        'staff-payment:' || new.id::text, 'staff_payment', new.id, new.reference,
        'RÃ©munÃ©ration du personnel', new.recorded_by, 'payment', null, new.paid_at
      );
    end if;
  end if;
  return new;
end;
$$;
create trigger staff_payments_post_to_ledger
after insert or update of status on public.staff_payments
for each row execute function public.ledger_staff_payment_paid();

create function public.ledger_official_payment_paid()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_organization_id uuid;
begin
  if new.status = 'paid' and (tg_op = 'INSERT' or old.status is distinct from 'paid') then
    select e.organizer_id into v_organization_id from public.events e where e.id = new.event_id;
    if v_organization_id is not null then
      perform public.post_financial_payment_internal(
        'organization', v_organization_id, 'profile', new.official_profile_id, new.amount, new.currency_code,
        'official-payment:' || new.id::text, 'official_payment', new.id, new.reference,
        'IndemnitÃ© officielle', new.recorded_by, 'payment', null, new.paid_at
      );
    end if;
  end if;
  return new;
end;
$$;
create trigger official_payments_post_to_ledger
after insert or update of status on public.official_payments
for each row execute function public.ledger_official_payment_paid();

alter table public.financial_accounts enable row level security;
alter table public.financial_payments enable row level security;
alter table public.financial_entries enable row level security;

create policy financial_accounts_parties_read on public.financial_accounts for select to authenticated
using (public.can_access_financial_account(id));
create policy financial_payments_parties_read on public.financial_payments for select to authenticated
using (public.can_access_financial_account(payer_account_id) or public.can_access_financial_account(payee_account_id));
create policy financial_entries_account_read on public.financial_entries for select to authenticated
using (public.can_access_financial_account(account_id));

revoke all on function public.ensure_financial_account(text, uuid, text) from public, anon, authenticated;
revoke all on function public.post_financial_payment_internal(text, uuid, text, uuid, numeric, text, text, text, uuid, text, text, uuid, text, uuid, timestamptz) from public, anon, authenticated;
grant execute on function public.post_financial_payment(text, uuid, text, uuid, numeric, text, text, text, uuid, text, text, timestamptz) to authenticated;
grant execute on function public.refund_financial_payment(uuid, text, text, text, timestamptz) to authenticated;
grant select on public.financial_account_balances to authenticated;

comment on table public.financial_entries is 'Append-only cross-party ledger: exactly one expense and one revenue per payment.';
comment on function public.refund_financial_payment is 'Creates an immutable reverse payment; never edits or deletes the original entries.';

commit;
