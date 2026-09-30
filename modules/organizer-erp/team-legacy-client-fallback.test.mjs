import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const sql = readFileSync(
  "supabase/migrations/20260930170000_event_team_legacy_client_fallback_fix.sql",
  "utf8",
).replace(/\r\n?/g, "\n");

test("legacy Team fallback uses the resolved profile identity", () => {
  assert.match(
    sql,
    /if v_profile_id is null then[\s\S]*?from public\.profiles p[\s\S]*?where lower\(p\.username\) = lower\(v_mention\)/,
  );

  assert.match(
    sql,
    /elsif v_profile_id is not null then/,
  );

  assert.match(
    sql,
    /assignment\.event_id = v_event_id/,
  );

  assert.match(
    sql,
    /assignment\.profile_id = v_profile_id/,
  );

  assert.match(
    sql,
    /assignment\.role = v_staff_role/,
  );

  assert.doesNotMatch(
    sql,
    /elsif v_payload_profile_id is not null then/,
  );

  assert.doesNotMatch(
    sql,
    /assignment\.profile_id = v_payload_profile_id/,
  );
});

test("same recipient and role preserve the existing decision state", () => {
  assert.match(
    sql,
    /v_staff_recipient_changed :=[\s\S]*?v_staff_assignment\.profile_id is distinct from v_profile_id/,
  );

  assert.match(
    sql,
    /v_staff_role_changed := v_staff_assignment\.role is distinct from v_staff_role/,
  );

  assert.match(
    sql,
    /status = case[\s\S]*?when v_staff_recipient_changed or v_staff_role_changed then 'invited'[\s\S]*?else status/,
  );

  assert.match(
    sql,
    /confirmed_at = case[\s\S]*?when v_staff_recipient_changed or v_staff_role_changed then null[\s\S]*?else confirmed_at/,
  );

  assert.match(
    sql,
    /availability_status = case[\s\S]*?when v_staff_recipient_changed or v_staff_role_changed then 'unknown'[\s\S]*?else availability_status/,
  );
});

test("Team remains staff-assignment authority and fighter invitations remain", () => {
  assert.doesNotMatch(
    sql,
    /jsonb_build_object\('_type','team'/,
  );

  assert.match(
    sql,
    /jsonb_build_object\('_type','fighter','_role','Combattant'\)/,
  );
});

test("workflow function remains security hardened", () => {
  assert.match(
    sql,
    /security definer/i,
  );

  assert.match(
    sql,
    /set search_path = ''/i,
  );

  assert.match(
    sql,
    /revoke all on function public\.save_organizer_event_workflow\(uuid, jsonb, text\)[\s\S]*?from public, anon;/i,
  );

  assert.match(
    sql,
    /grant execute on function public\.save_organizer_event_workflow\(uuid, jsonb, text\)[\s\S]*?to authenticated;/i,
  );
});