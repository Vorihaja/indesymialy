-- No new fight_* table is introduced by STAB-003.
-- RPC execution is restricted here as an additional deployment check.
revoke all on function public.sync_timer_to_timeline(uuid) from public, anon;
revoke all on function public.update_fight_statistics(uuid) from public, anon;
revoke all on function public.update_fighter_career_stats(uuid) from public, anon;
grant execute on function public.sync_timer_to_timeline(uuid) to authenticated;
grant execute on function public.update_fight_statistics(uuid) to authenticated;
grant execute on function public.update_fighter_career_stats(uuid) to authenticated;

-- Existing Fight Live table policies must be audited on the target branch before deployment.
-- This blueprint deliberately does not drop or replace remote policies.
