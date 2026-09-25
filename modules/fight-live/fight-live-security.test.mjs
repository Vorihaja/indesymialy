import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationUrl = new URL("../../supabase/migrations/20260923130720_complete_fight_live_authority.sql", import.meta.url);
const migration = await readFile(migrationUrl, "utf8");
const eventAuthority = await readFile(
  new URL("../../supabase/migrations/202608130230_event_geography_coorganization.sql", import.meta.url),
  "utf8",
);

function functionBlock(signature) {
  const marker = `create or replace function ${signature}`;
  const start = migration.indexOf(marker);
  assert.notEqual(start, -1, `missing ${signature}`);
  const end = migration.indexOf("\n$$;", start);
  assert.notEqual(end, -1, `unterminated ${signature}`);
  return migration.slice(start, end + 4);
}

const anonReadRpcSignatures = [
  "private.fight_live_is_public(uuid)",
  "private.can_view_fight_live(uuid)",
  "public.fight_public_projection(uuid, uuid\\[\\])",
  "public.get_round_remaining_time(uuid)",
];

const mutationRpcSignatures = [
  "fight_live_timer_action\\(uuid, text, text, text\\)",
  "fight_live_record_action\\(uuid, text, text\\)",
  "fight_live_save_judge_score\\(uuid, uuid, integer, integer, integer\\)",
  "fight_live_submit_judge_card\\(uuid\\)",
  "fight_live_decide\\(uuid, uuid, text\\)",
  "fight_live_publish_result\\(uuid\\)",
  "sync_timer_to_timeline\\(uuid\\)",
  "update_fight_statistics\\(uuid\\)",
  "update_fighter_career_stats\\(uuid\\)",
];

test("anonymous EXECUTE is split into four authorized reads and zero mutation RPCs", () => {
  for (const signature of anonReadRpcSignatures) {
    assert.match(
      migration,
      new RegExp(`grant execute on function ${signature.replaceAll(".", "\\.").replaceAll("(", "\\(").replaceAll(")", "\\)")}\\s+to anon, authenticated, service_role`, "i"),
    );
  }
  const anonymousExecuteGrants = migration.match(
    /grant execute on function (?:private|public)\.[^(\s]+\([^;]*?\)\s+to anon, authenticated, service_role;/gi,
  ) ?? [];
  assert.equal(anonymousExecuteGrants.length, 4);

  for (const signature of mutationRpcSignatures) {
    assert.match(migration, new RegExp(`revoke all on function public\\.${signature}[\\s\\S]*?from public, anon, authenticated`, "i"));
    const grant = migration.match(new RegExp(`grant execute on function public\\.${signature}[\\s\\S]*?;`, "i"))?.[0] ?? "";
    assert.doesNotMatch(grant, /\banon\b/i);
  }
});

test("anonymous visibility helpers are boolean-only, read-only, and private access requires identity", () => {
  const isPublic = functionBlock("private.fight_live_is_public(p_fight_id uuid)");
  const canView = functionBlock("private.can_view_fight_live(p_fight_id uuid)");
  for (const block of [isPublic, canView]) {
    assert.match(block, /returns boolean/);
    assert.match(block, /stable[\s\S]*security definer[\s\S]*set search_path = ''/);
    assert.doesNotMatch(block.slice(block.indexOf("as $$") + 5), /\b(insert|update|delete|merge|truncate|alter|drop|create)\b/i);
  }
  assert.match(isPublic, /join public\.events e on e\.id = f\.event_id/);
  assert.match(isPublic, /e\.visibility = 'public'/);
  assert.match(isPublic, /e\.published_at is not null/);
  assert.match(isPublic, /e\.archived_at is null/);
  assert.match(isPublic, /f\.status in \('live','paused','recovery','completed','published'\)/);
  assert.match(canView, /private\.fight_live_is_public\(p_fight_id\)[\s\S]*or \([\s\S]*auth\.uid\(\) is not null/);
  assert.match(canView, /private\.can_manage_fight_live\(p_fight_id\)/);
  assert.match(canView, /foa\.user_id = auth\.uid\(\)/);
  assert.match(canView, /auth\.uid\(\) in \(red\.profile_id, blue\.profile_id\)/);
});

test("authorized operators can see private fights but unrelated authenticated users cannot", () => {
  const canManage = functionBlock("private.can_manage_fight_live(p_fight_id uuid)");
  const canView = functionBlock("private.can_view_fight_live(p_fight_id uuid)");
  assert.match(canManage, /auth\.uid\(\) is not null[\s\S]*public\.is_platform_admin\(\)[\s\S]*public\.can_manage_event\(f\.event_id\)/);
  assert.match(canView, /auth\.uid\(\) is not null[\s\S]*private\.can_manage_fight_live\(p_fight_id\)/);
  assert.match(canView, /foa\.fight_id = p_fight_id[\s\S]*foa\.user_id = auth\.uid\(\)/);
  assert.match(canView, /f\.id = p_fight_id[\s\S]*auth\.uid\(\) in \(red\.profile_id, blue\.profile_id\)/);
  assert.doesNotMatch(canView, /or\s+auth\.uid\(\) is not null\s*;/i);
});

test("anonymous list scope cannot enumerate hidden or privileged fights", () => {
  const listIds = functionBlock("public.fight_live_list_ids(p_scope text)");
  assert.match(listIds, /returns table\(fight_id uuid\)/);
  assert.match(listIds, /stable[\s\S]*security definer[\s\S]*set search_path = ''/);
  assert.doesNotMatch(listIds.slice(listIds.indexOf("as $$") + 5), /\b(insert|update|delete|merge|truncate|alter|drop|create)\b/i);
  assert.match(listIds, /when 'public' then[\s\S]*private\.fight_live_is_public\(f\.id\)/);
  for (const scope of ["organizer", "official", "fighter"]) {
    assert.match(listIds, new RegExp(`when '${scope}' then auth\\.uid\\(\\) is not null`));
  }
  assert.match(listIds, /else false/);
  assert.doesNotMatch(listIds, /when '(all|admin|judge)'/);
});

test("remaining time hides unknown and private rounds before calculating", () => {
  const remaining = functionBlock("public.get_round_remaining_time(p_round_id uuid)");
  assert.match(remaining, /returns integer/);
  assert.match(remaining, /stable[\s\S]*security definer[\s\S]*set search_path = ''/);
  assert.doesNotMatch(remaining.slice(remaining.indexOf("as $$") + 5), /\b(insert|update|delete|merge|truncate|alter|drop|create)\b/i);
  assert.match(remaining, /from public\.fight_rounds r[\s\S]*private\.can_view_fight_live\(r\.fight_id\)/);
  assert.match(remaining, /ROUND_NOT_FOUND_OR_FORBIDDEN/);
  assert.doesNotMatch(remaining, /FIGHT_LIVE_READ_FORBIDDEN/);
});

test("private schema grants minimum helper privileges and is not added to the Data API", () => {
  assert.match(migration, /revoke all on schema private from public/);
  assert.match(migration, /grant usage on schema private to anon, authenticated, service_role/);
  assert.doesNotMatch(migration, /grant create on schema private/i);
  assert.doesNotMatch(migration, /pgrst\.db_schemas[\s\S]*private/i);
});

test("mutation RPCs reject anonymous execution and grant authenticated callers only", () => {
  for (const signature of mutationRpcSignatures) {
    assert.match(migration, new RegExp(`revoke all on function public\\.${signature}[\\s\\S]*?from public, anon, authenticated`, "i"));
    assert.match(migration, new RegExp(`grant execute on function public\\.${signature}[\\s\\S]*?to authenticated, service_role`, "i"));
  }
});

test("operators and judges are scoped by assignments and actors come from auth.uid", () => {
  assert.match(migration, /private\.can_operate_fight_live\(p_fight_id\)/);
  assert.match(migration, /foa\.user_id = auth\.uid\(\)[\s\S]*foa\.role in \('referee','timekeeper','doctor','supervisor'\)/);
  assert.match(migration, /v_card\.judge_id <> auth\.uid\(\)/);
  assert.match(migration, /p_judge_id is retained for compatibility and is deliberately ignored/);
  assert.match(migration, /p_user is retained for compatibility and is deliberately ignored/);
  assert.match(migration, /p_approved_by is retained for compatibility and is deliberately ignored/);
  assert.equal((migration.match(/p_recorded_by is retained for compatibility and is deliberately ignored/g) ?? []).length, 2);
  assert.match(migration, /recorded_by,[\s\S]*auth\.uid\(\)/);
});

test("private judging and operational tables have scoped reads, never public reads", () => {
  assert.match(migration, /fight_judge_cards_scoped_read[\s\S]*judge_id = auth\.uid\(\)[\s\S]*card_status in \('submitted','validated'\)/);
  assert.match(migration, /fight_judge_round_scores_scoped_read[\s\S]*jc\.judge_id = auth\.uid\(\)[\s\S]*jc\.card_status in \('submitted','validated'\)/);
  assert.match(migration, /'fight_scores','fight_event_log','fight_incidents'[\s\S]*private\.can_operate_fight_live\(fight_id\)/);
  assert.doesNotMatch(migration, /fight_judge_cards_public_read/);
  assert.match(migration, /fight_decisions_public_read[\s\S]*f\.status = 'published'/);
});

test("judge assignments create exactly one persistent judge card", () => {
  assert.match(migration, /unique index if not exists fight_judge_cards_fight_judge_key/);
  assert.match(migration, /create trigger ensure_fight_judge_card/);
  assert.match(migration, /on conflict \(fight_id, judge_id\) do nothing/);
});

test("public table grants expose only the live read model", () => {
  assert.match(migration, /revoke all privileges on table public\.fights from anon, authenticated/);
  assert.match(migration, /grant select \([\s\S]*?discipline_id, weight_category_id[\s\S]*?\) on public\.fights to anon/);
  const anonFightGrant = migration.match(/grant select \([\s\S]*?\) on public\.fights to anon/)?.[0] ?? "";
  assert.doesNotMatch(
    anonFightGrant,
    /winner_id|method|ending_round|ending_time|referee_id|cancellation_reason/,
  );
  assert.match(migration, /revoke all privileges on table[\s\S]*fight_judge_cards[\s\S]*from anon, authenticated/);
  assert.match(migration, /grant select \([\s\S]*fight_events_timeline to anon/);
  assert.match(migration, /fight_announcements_public_read[\s\S]*using \(is_public/);
  assert.doesNotMatch(migration, /create policy fight_timer_events_public_read/);
  assert.doesNotMatch(migration, /create policy fight_live_actions_public_read/);
  assert.doesNotMatch(migration, /create policy fight_penalties_public_read/);
});

test("anonymous fights table privileges are select-only safe columns", () => {
  const anonFightGrants = migration.match(/grant[^;]+public\.fights to anon;/gi) ?? [];
  assert.equal(anonFightGrants.length, 1);
  assert.match(anonFightGrants[0], /^grant select \(/i);
  assert.doesNotMatch(anonFightGrants[0], /\b(insert|update|delete|truncate|references|trigger)\b/i);
});

test("ordinary authenticated public users cannot select full fight rows", () => {
  const safePolicy = migration.match(/create policy fights_public_safe_read[\s\S]*?\);/)?.[0] ?? "";
  assert.match(migration, /drop policy if exists fights_public_published_read on public\.fights/);
  assert.match(safePolicy, /on public\.fights for select to anon/);
  assert.doesNotMatch(safePolicy, /authenticated/);
  assert.doesNotMatch(migration, /on public\.fights for select to anon, authenticated/);
});

test("authorized organizers officials and participants retain scoped fight access", () => {
  assert.match(migration, /create policy fights_organizer_manage[\s\S]*on public\.fights for all to authenticated[\s\S]*public\.can_manage_event\(event_id\)/);
  assert.match(eventAuthority, /create or replace function public\.can_manage_event[\s\S]*public\.is_platform_admin\(\)/);
  assert.match(migration, /create policy fights_assigned_official_read[\s\S]*foa\.user_id = auth\.uid\(\)/);
  assert.match(migration, /create policy fights_participant_read[\s\S]*fi\.profile_id = auth\.uid\(\)/);
});

test("authenticated fights privileges retain CRUD and revoke database-owner capabilities", () => {
  assert.match(migration, /grant select, insert, update, delete on table public\.fights to authenticated/);
  const authenticatedFightGrants = migration.match(/grant[^;]+public\.fights to authenticated;/gi) ?? [];
  assert.equal(authenticatedFightGrants.length, 1);
  assert.doesNotMatch(authenticatedFightGrants[0], /\b(truncate|references|trigger)\b/i);
});

test("public fight projection exposes only safe columns for published public events", () => {
  const projection = functionBlock("public.fight_public_projection(\n  p_fight_id uuid default null,");
  assert.match(projection, /returns table\([\s\S]*weight_category_id uuid[\s\S]*\)/);
  assert.match(projection, /join public\.events e on e\.id = f\.event_id/);
  assert.match(projection, /e\.visibility = 'public'/);
  assert.match(projection, /e\.published_at is not null/);
  assert.match(projection, /e\.archived_at is null/);
  assert.doesNotMatch(projection, /winner_id|method|ending_round|ending_time|referee_id|cancellation_reason/);
});

test("authenticated pending result columns are blocked at the database boundary", () => {
  const projection = functionBlock("public.fight_public_projection(\n  p_fight_id uuid default null,");
  const safePolicy = migration.match(/create policy fights_public_safe_read[\s\S]*?\);/)?.[0] ?? "";
  assert.doesNotMatch(safePolicy, /authenticated/);
  assert.doesNotMatch(
    projection,
    /winner_id|method|ending_round|ending_time|referee_id|cancellation_reason/,
  );
  assert.match(migration, /fight_decisions_public_read[\s\S]*f\.status = 'published'/);
});

test("legacy completed result data is not destructively rewritten for compatibility", () => {
  assert.doesNotMatch(migration, /delete\s+from\s+public\.fights/i);
  assert.doesNotMatch(
    migration,
    /update\s+public\.fights[\s\S]{0,300}set[\s\S]{0,300}(?:winner_id|method)\s*=\s*null/i,
  );
  assert.doesNotMatch(migration, /where[\s\S]{0,200}method\s*=\s*'Decision'/i);
});

test("combat actions require a running server timer", () => {
  assert.match(migration, /p_action_type in \('strike','takedown','knockdown','submission'\)[\s\S]*v_fight\.status <> 'live'/);
  assert.match(migration, /COMBAT_ACTION_REQUIRES_LIVE_TIMER/);
  assert.doesNotMatch(migration, /'incident','interruption','resume','medical_stoppage'/);
});

test("judge cards and points decisions are lifecycle constrained", () => {
  assert.match(migration, /JUDGE_ROUND_NOT_COMPLETED/);
  assert.match(migration, /JUDGE_CARD_FIGHT_NOT_COMPLETED/);
  assert.match(migration, /DECISION_DOES_NOT_MATCH_JUDGE_CARDS/);
  assert.match(migration, /JUDGE_CARDS_INCOMPLETE/);
});

test("decision comparison compiles as an unambiguous PL/pgSQL predicate", () => {
  const decision = functionBlock("public.fight_live_decide(\n  p_fight_id uuid,");
  assert.match(decision, /v_expected_winner_id uuid;/);
  assert.match(
    decision,
    /v_expected_winner_id := case v_judge_result->>'winner'[\s\S]*?end;/,
  );
  assert.match(
    decision,
    /if lower\(v_judge_result->>'decision'\) <> v_method\s+or v_expected_winner_id is distinct from p_winner_id then/,
  );
  assert.doesNotMatch(
    decision,
    /or\s+case v_judge_result->>'winner'[\s\S]*?end is distinct from p_winner_id then/,
  );
});

test("result is not exposed before publication", () => {
  const decision = functionBlock("public.fight_live_decide(\n  p_fight_id uuid,");
  assert.match(migration, /fight_decisions_public_read[\s\S]*f\.status = 'published'/);
  assert.match(decision, /insert into public\.fight_decisions/);
  assert.doesNotMatch(decision, /update public\.fights/);
});

test("decision remains pending without writing public fight result fields", () => {
  const decision = functionBlock("public.fight_live_decide(\n  p_fight_id uuid,");
  assert.match(decision, /v_fight\.status <> 'completed'/);
  assert.doesNotMatch(decision, /set winner_id\s*=|method\s*=|status\s*=\s*'completed'/);
});

test("publication atomically materializes the canonical decision before recalculation", () => {
  const publish = functionBlock("public.fight_live_publish_result(p_fight_id uuid)");
  assert.match(publish, /select \* into v_fight[\s\S]*for update/);
  assert.match(publish, /select \* into v_decision from public\.fight_decisions/);
  assert.match(publish, /v_fight\.status <> 'completed'/);
  const materialize = publish.indexOf("update public.fights");
  const fightStats = publish.indexOf("perform private.recalculate_fight_statistics");
  const careerStats = publish.indexOf("perform private.recalculate_fighter_career_stats");
  const announcement = publish.indexOf("insert into public.fight_announcements");
  const timeline = publish.indexOf("insert into public.fight_events_timeline");
  assert.ok(materialize > -1 && materialize < fightStats);
  assert.ok(fightStats < careerStats && careerStats < announcement && announcement < timeline);
  assert.match(publish, /set winner_id = v_decision\.winner_id,[\s\S]*method = lower\(v_decision\.decision_type\),[\s\S]*status = 'published'/);
});

test("published decisions are immutable", () => {
  const decision = functionBlock("public.fight_live_decide(\n  p_fight_id uuid,");
  const calculate = functionBlock("public.calculate_final_decision(\n  p_fight_id uuid,");
  for (const block of [decision, calculate]) {
    assert.match(block, /v_fight\.status <> 'completed'/);
  }
  assert.doesNotMatch(decision, /\('completed','published'\)/);
});

test("published results cannot regress to completed through an ordinary decision", () => {
  const decision = functionBlock("public.fight_live_decide(\n  p_fight_id uuid,");
  const calculate = functionBlock("public.calculate_final_decision(\n  p_fight_id uuid,");
  assert.doesNotMatch(decision, /status\s*=\s*'completed'/);
  assert.doesNotMatch(calculate, /status\s*=\s*'completed'/);
});

test("legacy official action is blocked after completion", () => {
  const legacy = functionBlock("public.record_official_action(\n  p_fight_id uuid,");
  assert.match(legacy, /v_fight\.status not in \('live','paused','recovery'\)/);
  assert.match(legacy, /OFFICIAL_ACTION_NOT_ALLOWED_FOR_STATUS/);
  assert.match(legacy, /insert into public\.fight_scores/);
  assert.ok(legacy.indexOf("OFFICIAL_ACTION_NOT_ALLOWED_FOR_STATUS") < legacy.indexOf("insert into public.fight_scores"));
});

test("legacy official action is blocked after publication", () => {
  const legacy = functionBlock("public.record_official_action(\n  p_fight_id uuid,");
  const allowedStatuses = legacy.match(/v_fight\.status not in \(([^)]+)\)/)?.[1] ?? "";
  assert.equal(allowedStatuses, "'live','paused','recovery'");
  assert.doesNotMatch(allowedStatuses, /published/);
  assert.ok(legacy.indexOf("v_fight.status not in ('live','paused','recovery')") < legacy.indexOf("insert into public.fight_scores"));
  assert.ok(legacy.indexOf("v_fight.status not in ('live','paused','recovery')") < legacy.indexOf("perform private.recalculate_fight_statistics"));
});

test("legacy official action accepts only the current lifecycle-appropriate round", () => {
  const legacy = functionBlock("public.record_official_action(\n  p_fight_id uuid,");
  assert.match(legacy, /r\.id = p_round_id and r\.fight_id = p_fight_id[\s\S]*for update/);
  assert.match(legacy, /v_fight\.status in \('live','paused'\) and v_round\.status <> 'active'/);
  assert.match(legacy, /v_fight\.status = 'recovery'[\s\S]*v_round\.status <> 'completed'/);
  assert.match(legacy, /select max\(r\.round_number\)[\s\S]*r\.status = 'completed'/);
  assert.match(legacy, /OFFICIAL_ACTION_ROUND_NOT_CURRENT/);
});

test("trigger-only functions are not exposed as application RPCs", () => {
  for (const name of [
    "sync_timer_to_timeline", "ensure_fight_judge_card",
    "update_fight_statistics", "update_fighter_career_stats",
    "calculate_fight_score", "process_fight_event",
    "guard_official_assignment_update", "validate_fight_official_assignment",
  ]) assert.match(migration, new RegExp(name));
  assert.match(migration, /revoke all on function public\.sync_timer_to_timeline\(\)[\s\S]*from public, anon, authenticated/);
  assert.match(migration, /revoke all on function public\.ensure_fight_judge_card\(\)[\s\S]*from public, anon, authenticated/);
});
