-- ERP-ORG-003 extensions over STAB-003 access logs and refunds. PREPARED ONLY.
begin;

alter table public.ticket_types
  add constraint ticket_types_event_id_fkey foreign key (event_id) references public.events(id) on delete cascade not valid;
alter table public.tickets
  add constraint tickets_event_id_fkey foreign key (event_id) references public.events(id) on delete cascade not valid;
alter table public.ticket_sales
  add constraint ticket_sales_event_id_fkey foreign key (event_id) references public.events(id) on delete cascade not valid;

alter table public.ticket_refunds
  add column if not exists processed_amount numeric(14,2),
  add column if not exists currency_code text not null default 'MGA',
  add column if not exists processed_by uuid references public.profiles(id) on delete set null,
  add column if not exists processed_at timestamptz,
  add column if not exists external_reference text;

alter table public.ticket_refunds
  add constraint ticket_refunds_processed_amount_check check (processed_amount is null or processed_amount > 0),
  add constraint ticket_refunds_currency_check check (currency_code ~ '^[A-Z]{3}$'),
  add constraint ticket_refunds_processed_check check (
    status <> 'processed'
    or (processed_at is not null and processed_by is not null and processed_amount is not null)
  );

create index ticket_refunds_processed_idx on public.ticket_refunds(status, processed_at desc);
create index event_access_logs_operator_date_idx on public.event_access_logs(operator_profile_id, occurred_at desc) where operator_profile_id is not null;

comment on table public.event_access_logs is 'Official ticket scan and access-control log; no ticket_access_scans duplicate is introduced.';

commit;

-- Rollback (manual): drop the new indexes, event foreign keys, refund constraints and columns.
