-- Fight Live policies and least-privilege grants are installed by
-- 20260923130720_complete_fight_live_authority.sql because they depend on its
-- private authorization helpers. These revokes remain a deployment check.
revoke all on function public.sync_timer_to_timeline(uuid) from public, anon;
revoke all on function public.update_fight_statistics(uuid) from public, anon;
revoke all on function public.update_fighter_career_stats(uuid) from public, anon;
grant execute on function public.sync_timer_to_timeline(uuid) to authenticated;
grant execute on function public.update_fight_statistics(uuid) to authenticated;
grant execute on function public.update_fighter_career_stats(uuid) to authenticated;
