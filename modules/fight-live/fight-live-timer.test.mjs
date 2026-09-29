import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migration = await readFile(new URL("../../supabase/migrations/20260925082825_complete_fight_live_authority.sql", import.meta.url), "utf8");

test("timer transitions are locked and server validated", () => {
  assert.match(migration, /select \* into v_fight from public\.fights where id = p_fight_id for update/);
  assert.match(migration, /v_fight\.status not in \('scheduled','ready'\)/);
  assert.match(migration, /p_action in \('pause','timeout','medical_timeout','technical_pause'\)/);
  assert.match(migration, /v_fight\.status <> 'paused'/);
  assert.match(migration, /p_action = 'next_round'[\s\S]*v_fight\.status <> 'recovery'/);
  assert.match(migration, /p_action in \('end_round','end_fight'\)/);
});

test("only one active pause can exist and repeated timer sync is idempotent", () => {
  assert.match(migration, /fight_timer_events_open_pause_key[\s\S]*where ended_at is null/);
  assert.match(migration, /fight_events_timeline_timer_event_key/);
  assert.match(migration, /source_timer_event_id/);
  assert.match(migration, /on conflict \(source_timer_event_id\) do nothing/g);
  assert.match(migration, /Recovery\/backfill authority/);
  assert.match(migration, /set source_timer_event_id = matches\.timer_event_id/);
});

test("remaining time is computed from server timestamps including pauses", () => {
  assert.match(migration, /create or replace function public\.get_round_remaining_time/);
  assert.match(migration, /extract\(epoch from \(coalesce\(v_round\.ended_at, now\(\)\) - v_round\.started_at\)\)/);
  assert.match(migration, /v_pause_seconds/);
});

test("round end and fight end have distinct recovery transitions", () => {
  assert.match(migration, /p_action = 'end_round' and v_fight\.status not in \('live','paused'\)/);
  assert.match(migration, /p_action = 'end_fight' and v_fight\.status not in \('live','paused','recovery'\)/);
});
