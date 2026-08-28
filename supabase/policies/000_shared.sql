-- Apply after migrations. No unconditional policy is used.

create policy platform_reference_values_public_read
on public.platform_reference_values for select
to anon, authenticated
using (is_active = true);

create policy platform_reference_values_admin_write
on public.platform_reference_values for all
to authenticated
using (exists (
  select 1 from public.profile_system_roles psr
  join public.system_roles sr on sr.id = psr.system_role_id
  where psr.profile_id = auth.uid() and sr.code in ('admin','super_admin')
))
with check (exists (
  select 1 from public.profile_system_roles psr
  join public.system_roles sr on sr.id = psr.system_role_id
  where psr.profile_id = auth.uid() and sr.code in ('admin','super_admin')
));
