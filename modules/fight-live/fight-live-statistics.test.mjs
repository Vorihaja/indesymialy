import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migration = await readFile(new URL("../../supabase/migrations/20260925082825_complete_fight_live_authority.sql", import.meta.url), "utf8");

test("fight statistics are fully recomputed from canonical actions, scores, and penalties", () => {
  assert.match(migration, /create or replace function private\.recalculate_fight_statistics/);
  assert.match(migration, /from public\.fight_live_actions/);
  assert.match(migration, /from public\.fight_scores/);
  assert.match(migration, /from public\.fight_penalties/);
  assert.match(migration, /on conflict \(fight_id, fighter_id\) do update set/);
  assert.match(migration, /f\.winner_id = v_fighter_id[\s\S]*f\.method[\s\S]*= 'submission'/);
  assert.doesNotMatch(migration, /total_strikes\s*=\s*public\.fight_statistics\.total_strikes\s*\+/);
});

test("competing incremental statistics triggers are removed", () => {
  assert.match(migration, /drop trigger if exists trigger_update_fight_statistics/);
  assert.match(migration, /drop trigger if exists trigger_calculate_fight_score/);
});
