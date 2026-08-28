begin;

create table public.event_budget_history (
  id uuid primary key default gen_random_uuid(),
  event_budget_id uuid not null references public.event_budgets(id) on delete cascade,
  from_status text,
  to_status text not null,
  note text,
  changed_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);
create index event_budget_history_budget_idx on public.event_budget_history(event_budget_id, created_at desc);

create table public.event_transaction_history (
  id uuid primary key default gen_random_uuid(),
  event_transaction_id uuid not null references public.event_transactions(id) on delete cascade,
  from_status text,
  to_status text not null,
  note text,
  changed_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);
create index event_transaction_history_transaction_idx on public.event_transaction_history(event_transaction_id, created_at desc);

create table public.event_invoices (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  invoice_number text not null,
  direction text not null check (direction in ('receivable','payable')),
  counterparty_name text not null,
  counterparty_email text,
  counterparty_organization_id uuid references public.organizations(id) on delete set null,
  description text not null,
  issue_date date not null default current_date,
  due_date date not null,
  subtotal numeric(14,2) not null check (subtotal >= 0),
  tax_amount numeric(14,2) not null default 0 check (tax_amount >= 0),
  total_amount numeric(14,2) generated always as (subtotal + tax_amount) stored,
  amount_paid numeric(14,2) not null default 0 check (amount_paid >= 0),
  currency_code text not null default 'MGA' check (currency_code ~ '^[A-Z]{3}$'),
  status text not null default 'draft' check (status in ('draft','issued','partial','paid','overdue','cancelled')),
  document_path text,
  notes text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_invoices_number_key unique(event_id, invoice_number),
  constraint event_invoices_dates_check check (due_date >= issue_date),
  constraint event_invoices_paid_check check (amount_paid <= subtotal + tax_amount)
);
create index event_invoices_event_status_due_idx on public.event_invoices(event_id, status, due_date);

create table public.event_invoice_payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.event_invoices(id) on delete restrict,
  amount numeric(14,2) not null check (amount > 0),
  method text not null check (method in ('cash','bank_transfer','mobile_money','card','cheque','other')),
  reference text,
  paid_at timestamptz not null default now(),
  notes text,
  recorded_by uuid not null references public.profiles(id) on delete restrict,
  financial_payment_id uuid references public.financial_payments(id) on delete restrict,
  created_at timestamptz not null default now()
);
create index event_invoice_payments_invoice_date_idx on public.event_invoice_payments(invoice_id, paid_at desc);

alter table public.event_budget_history enable row level security;
alter table public.event_transaction_history enable row level security;
alter table public.event_invoices enable row level security;
alter table public.event_invoice_payments enable row level security;

create policy event_budget_history_manager_manage on public.event_budget_history for all to authenticated
using (exists (select 1 from public.event_budgets budget where budget.id=event_budget_id and public.can_manage_event(budget.event_id)))
with check (changed_by=auth.uid() and exists (select 1 from public.event_budgets budget where budget.id=event_budget_id and public.can_manage_event(budget.event_id)));
create policy event_transaction_history_manager_manage on public.event_transaction_history for all to authenticated
using (exists (select 1 from public.event_transactions tx where tx.id=event_transaction_id and public.can_manage_event(tx.event_id)))
with check (changed_by=auth.uid() and exists (select 1 from public.event_transactions tx where tx.id=event_transaction_id and public.can_manage_event(tx.event_id)));
create policy event_invoices_manager_manage on public.event_invoices for all to authenticated
using (public.can_manage_event(event_id))
with check (public.can_manage_event(event_id));
create policy event_invoice_payments_manager_read on public.event_invoice_payments for select to authenticated
using (exists (select 1 from public.event_invoices invoice where invoice.id=invoice_id and public.can_manage_event(invoice.event_id)));
create policy event_invoice_payments_manager_create on public.event_invoice_payments for insert to authenticated
with check (recorded_by=auth.uid() and exists (select 1 from public.event_invoices invoice where invoice.id=invoice_id and public.can_manage_event(invoice.event_id)));

create or replace function public.transition_event_budget(p_budget_id uuid,p_status text,p_note text default null)
returns uuid language plpgsql security invoker set search_path=public as $$
declare v_row public.event_budgets%rowtype;
begin
  select * into v_row from public.event_budgets where id=p_budget_id for update;
  if v_row.id is null then raise exception 'Budget introuvable.'; end if;
  if not public.can_manage_event(v_row.event_id) then raise exception 'Accès refusé.'; end if;
  if p_status=v_row.status then return v_row.id; end if;
  if not ((v_row.status='draft' and p_status in ('submitted','archived')) or (v_row.status='submitted' and p_status in ('draft','approved')) or (v_row.status='approved' and p_status='closed')) then raise exception 'Transition budgétaire invalide.'; end if;
  update public.event_budgets set status=p_status,approved_by=case when p_status='approved' then auth.uid() else approved_by end,approved_at=case when p_status='approved' then now() else approved_at end,closed_by=case when p_status='closed' then auth.uid() else closed_by end,closed_at=case when p_status='closed' then now() else closed_at end,updated_at=now() where id=p_budget_id;
  insert into public.event_budget_history(event_budget_id,from_status,to_status,note,changed_by) values(p_budget_id,v_row.status,p_status,nullif(btrim(p_note),''),auth.uid());
  return p_budget_id;
end $$;

create or replace function public.transition_event_transaction(p_transaction_id uuid,p_status text,p_note text default null)
returns uuid language plpgsql security invoker set search_path=public as $$
declare v_row public.event_transactions%rowtype;
begin
  select * into v_row from public.event_transactions where id=p_transaction_id for update;
  if v_row.id is null then raise exception 'Transaction introuvable.'; end if;
  if not public.can_manage_event(v_row.event_id) then raise exception 'Accès refusé.'; end if;
  if p_status=v_row.status then return v_row.id; end if;
  if not (
    (v_row.status='planned' and p_status in ('committed','pending','paid','cancelled')) or
    (v_row.status='committed' and p_status in ('pending','paid','cancelled')) or
    (v_row.status='pending' and p_status in ('paid','failed','cancelled')) or
    (v_row.status='failed' and p_status in ('pending','cancelled'))
  ) then raise exception 'Transition comptable invalide.'; end if;
  update public.event_transactions set status=p_status,approved_by=case when p_status in ('committed','paid') then auth.uid() else approved_by end,occurred_at=case when p_status in ('committed','paid') then coalesce(occurred_at,now()) else occurred_at end,paid_at=case when p_status='paid' then now() else paid_at end,updated_at=now() where id=p_transaction_id;
  if v_row.budget_line_id is not null and p_status='committed' and v_row.status='planned' then update public.event_budget_lines set committed_amount=committed_amount+v_row.amount,updated_at=now() where id=v_row.budget_line_id; end if;
  if v_row.budget_line_id is not null and p_status='paid' and v_row.status<>'paid' then update public.event_budget_lines set actual_amount=actual_amount+v_row.amount,updated_at=now() where id=v_row.budget_line_id; end if;
  insert into public.event_transaction_history(event_transaction_id,from_status,to_status,note,changed_by) values(p_transaction_id,v_row.status,p_status,nullif(btrim(p_note),''),auth.uid());
  return p_transaction_id;
end $$;

create or replace function public.record_event_invoice_payment(p_invoice_id uuid,p_amount numeric,p_method text,p_reference text default null,p_notes text default null,p_paid_at timestamptz default now())
returns uuid language plpgsql security invoker set search_path=public as $$
declare v_invoice public.event_invoices%rowtype; v_payment_id uuid; v_new_paid numeric;
begin
  select * into v_invoice from public.event_invoices where id=p_invoice_id for update;
  if v_invoice.id is null then raise exception 'Facture introuvable.'; end if;
  if not public.can_manage_event(v_invoice.event_id) then raise exception 'Accès refusé.'; end if;
  if v_invoice.status in ('draft','cancelled','paid') then raise exception 'Cette facture ne peut pas recevoir de paiement.'; end if;
  if p_amount<=0 or v_invoice.amount_paid+p_amount>v_invoice.total_amount then raise exception 'Montant de paiement invalide.'; end if;
  insert into public.event_invoice_payments(invoice_id,amount,method,reference,paid_at,notes,recorded_by) values(p_invoice_id,p_amount,p_method,nullif(btrim(p_reference),''),p_paid_at,nullif(btrim(p_notes),''),auth.uid()) returning id into v_payment_id;
  v_new_paid:=v_invoice.amount_paid+p_amount;
  update public.event_invoices set amount_paid=v_new_paid,status=case when v_new_paid=v_invoice.total_amount then 'paid' else 'partial' end,updated_at=now() where id=p_invoice_id;
  insert into public.event_transactions(event_id,transaction_type,category_code,description,amount,currency_code,status,due_at,occurred_at,paid_at,counterparty_organization_id,reference,recorded_by,approved_by)
  values(v_invoice.event_id,case when v_invoice.direction='receivable' then 'revenue' else 'expense' end,'invoice',v_invoice.description,p_amount,v_invoice.currency_code,'paid',v_invoice.due_date,p_paid_at,p_paid_at,v_invoice.counterparty_organization_id,coalesce(p_reference,v_invoice.invoice_number),auth.uid(),auth.uid());
  return v_payment_id;
end $$;

grant execute on function public.transition_event_budget(uuid,text,text) to authenticated;
grant execute on function public.transition_event_transaction(uuid,text,text) to authenticated;
grant execute on function public.record_event_invoice_payment(uuid,numeric,text,text,text,timestamptz) to authenticated;

commit;
