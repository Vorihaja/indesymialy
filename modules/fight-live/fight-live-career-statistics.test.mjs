import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migration = await readFile(new URL("../../supabase/migrations/20260923130720_complete_fight_live_authority.sql", import.meta.url), "utf8");

test("career statistics only count fights in which the fighter participated", () => {
  assert.match(migration, /where p_fighter_id in \(f\.fighter_red_id, f\.fighter_blue_id\)/);
  assert.match(migration, /f\.status in \('completed','published'\)/);
  assert.match(migration, /not in \('draw','no_contest'\)/);
});

test("career recalculation replaces deterministic totals instead of incrementing", () => {
  assert.match(migration, /on conflict \(fighter_id\) do update set[\s\S]*total_fights = excluded\.total_fights/);
  assert.doesNotMatch(migration, /total_fights\s*=\s*public\.fighter_career_stats\.total_fights\s*\+/);
  assert.match(migration, /drop trigger if exists trigger_update_fighter_career_stats/);
});
