import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("Fight Live repositories use persistent RPC authority without storage placeholders", async () => {
  const sources = await Promise.all([
    read("modules/fight-live/repositories/fight-live-supabase.repository.ts"),
    read("modules/fight-live/repositories/fight-timer.repository.ts"),
    read("modules/fight-live/repositories/fight-statistics.repository.ts"),
  ]);
  const combined = sources.join("\n");
  assert.doesNotMatch(combined, /storageNotImplemented|notImplemented/i);
  for (const rpc of [
    "fight_live_timer_action", "fight_live_record_action",
    "fight_live_save_judge_score", "fight_live_submit_judge_card",
    "fight_live_decide", "fight_live_publish_result",
    "sync_timer_to_timeline", "update_fight_statistics",
    "update_fighter_career_stats",
  ]) assert.match(combined, new RegExp(rpc));
});

test("the primary repository does not directly mutate protected live tables", async () => {
  const source = await read("modules/fight-live/repositories/fight-live-supabase.repository.ts");
  assert.doesNotMatch(source, /\.from\("fight_(?:timer_events|rounds|live_actions|penalties|incidents|judge_round_scores|decisions)"\)\s*\.(?:insert|update|delete)/);
  assert.match(source, /fight_live_list_ids/);
  assert.match(source, /get_round_remaining_time/);
  assert.match(source, /if \(scope === "public"\)[\s\S]*fight_public_projection[\s\S]*this\.getPublic/);
  assert.match(source, /\.from\("fight_events_timeline"\)/);
  assert.doesNotMatch(source, /async assignOfficial/);
});

test("legacy repositories cannot bypass the live state machine with direct writes", async () => {
  const sources = await Promise.all([
    read("modules/fight-live/repositories/fight.repository.ts"),
    read("modules/fight-live/repositories/fight-official.repository.ts"),
  ]);
  const combined = sources.join("\n");
  assert.doesNotMatch(combined, /\.from\("fights"\)\s*\.update/);
  assert.doesNotMatch(combined, /\.from\("fight_officials"\)\s*\.(?:insert|update|delete)/);
  assert.match(combined, /fight_official_assignments/);
});

test("visible controls cover both corners and persisted realtime refresh", async () => {
  const panels = await read("modules/fight-live/components/FightLivePanels.tsx");
  const hook = await read("modules/fight-live/hooks/useFightLiveWorkspace.ts");
  assert.match(panels, /action\(value, "red"\)/);
  assert.match(panels, /action\(value, "blue"\)/);
  assert.match(panels, /Valider sans gagnant/);
  assert.match(hook, /subscribeToTimer/);
  assert.match(hook, /subscribeToStatus/);
  assert.match(hook, /subscribeToResult/);
  assert.match(hook, /subscribeToLiveActions/);
  assert.match(hook, /subscribeToStatistics/);
  assert.match(hook, /subscribeToJudgeCards/);
});

test("public reads use an explicit safe projection and the persisted timeline", async () => {
  const source = await read("modules/fight-live/repositories/fight-live-supabase.repository.ts");
  const publicMethod = source.slice(source.indexOf("async getPublic"), source.indexOf("async updateTimer"));
  assert.match(publicMethod, /\.rpc\("fight_public_projection", \{ p_fight_id: fightId \}\)/);
  assert.doesNotMatch(publicMethod, /\.from\("fights"\)/);
  assert.match(publicMethod, /fight_events_timeline/);
  assert.match(publicMethod, /\.from\("fight_decisions"\)/);
  assert.match(publicMethod, /result: fight\.status === "published" \? this\.mapDecision\(fight, decision, \[\]\) : null/);
  assert.doesNotMatch(publicMethod, /fight_(?:judge_cards|judge_round_scores|event_log|incidents|timer_events|live_actions|penalties)/);
  assert.doesNotMatch(publicMethod, /recorded_by/);
  assert.doesNotMatch(publicMethod, /as FightRow/);
  assert.match(source, /type PublicFightRow = Pick</);
});

test("all public event fight consumers use the safe database projection", async () => {
  const [eventSource, homeSource] = await Promise.all([
    read("modules/event-core/repositories/event-supabase.repository.ts"),
    read("modules/home-season/repositories/home-season-supabase.repository.ts"),
  ]);
  const publicEventBranch = eventSource.slice(
    eventSource.indexOf("if (this.mode === 'public')"),
    eventSource.indexOf("const organizationId = await this.organizationId()"),
  );
  assert.match(publicEventBranch, /fight_public_projection/);
  assert.doesNotMatch(publicEventBranch, /\.from\('fights'\)/);
  assert.match(homeSource, /countFightsForEvents[\s\S]*fight_public_projection/);
  assert.doesNotMatch(homeSource, /\.from\("fights"\)/);
});

test("public status refreshes use the safe timeline rather than full fight rows", async () => {
  const source = await read("modules/fight-live/repositories/fight-live-realtime.repository.ts");
  const statusSubscription = source.slice(
    source.indexOf("subscribeToStatus"),
    source.indexOf("subscribeToResult"),
  );
  assert.match(statusSubscription, /table:\s*"fight_events_timeline"/);
  assert.match(statusSubscription, /`fight_id=eq\.\$\{fightId\}`/);
  assert.doesNotMatch(statusSubscription, /table:\s*"fights"/);
});
