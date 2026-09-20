-- ==========================================================
-- INDESY MIALY
-- FIN-2A - FINANCE MINIAPP OWNER CONTEXT V1
--
-- Returns finance contexts available to the current user:
-- - personal finance
-- - organizations manageable by that user
--
-- No caller-supplied user id is trusted.
-- ==========================================================

begin;

create or replace function public.list_finance_owners()
returns table(
  owner_type text,
  owner_id uuid,
  label text
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return;
  end if;

  return query
  select
    'profile'::text,
    auth.uid(),
    'Personnel'::text;

  return query
  select
    'organization'::text,
    o.id,
    coalesce(
      nullif(btrim(o.name), ''),
      'Organisation'
    )::text
  from public.organizations o
  where public.can_manage_organization(o.id)
  order by lower(
    coalesce(
      nullif(btrim(o.name), ''),
      'Organisation'
    )
  );
end;
$$;

revoke all on function
  public.list_finance_owners()
from public, anon;

grant execute on function
  public.list_finance_owners()
to authenticated;

comment on function public.list_finance_owners() is
  'Returns the current authenticated profile and organizations it can manage for Indesy Finance.';

commit;
