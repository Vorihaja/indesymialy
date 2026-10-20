begin;

create or replace function public.is_assigned_fight_official(
  p_fight_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select auth.uid() is not null
    and exists (
      select 1
      from public.fight_official_assignments foa
      where foa.fight_id = p_fight_id
        and foa.user_id = auth.uid()
        and coalesce(foa.status, 'assigned')
          in ('assigned', 'confirmed', 'completed')
    );
$function$;

alter function public.is_assigned_fight_official(uuid)
  owner to postgres;

revoke all on function public.is_assigned_fight_official(uuid)
  from public, anon;
grant execute on function public.is_assigned_fight_official(uuid)
  to authenticated, service_role;

drop policy if exists fights_assigned_official_read
  on public.fights;

create policy fights_assigned_official_read
on public.fights
for select
to authenticated
using (public.is_assigned_fight_official(id));

commit;
