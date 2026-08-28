-- ERP-ORG-003 reference domains extension. PREPARED ONLY.
begin;

alter table public.platform_reference_values
  drop constraint if exists platform_reference_values_domain_check;

alter table public.platform_reference_values
  add constraint platform_reference_values_domain_check check (domain in (
    'notification_type','support_category','event_category','payment_type','document_type',
    'organizer_budget_category','organizer_transaction_type','registration_status',
    'weigh_in_status','staff_role','schedule_type','sponsor_pipeline_status','refund_reason'
  ));

comment on constraint platform_reference_values_domain_check on public.platform_reference_values is
  'STAB-003 reference domains plus non-sensitive organizer operational domains.';

commit;

-- Rollback (manual): remove organizer-domain rows, then restore the original five-domain constraint.
