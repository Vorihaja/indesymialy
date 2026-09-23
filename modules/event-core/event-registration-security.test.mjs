import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("forward migration fixes organization participant visibility without a tautology", async () => {
  const migration = await read("supabase/migrations/20260923083042_complete_event_registration_authority.sql");
  assert.doesNotMatch(migration, /om\.organization_id\s*=\s*om\.organization_id/i);
  assert.match(migration, /om\.organization_id\s*=\s*event_participants\.organization_id/i);
  assert.match(migration, /om\.profile_id\s*=\s*auth\.uid\(\)/i);
  assert.match(migration, /public\.can_manage_event\(event_participants\.event_id\)/i);
});

test("historical policy sources are also unambiguous for fresh replay", async () => {
  const sources = await Promise.all([
    read("supabase/migrations/202608130200_rls_policies.sql"),
    read("supabase/policies/040_events.sql"),
  ]);
  for (const source of sources) {
    assert.doesNotMatch(source, /om\.organization_id\s*=\s*om\.organization_id/i);
    assert.match(source, /om\.organization_id\s*=\s*event_participants\.organization_id/i);
  }
});

test("public participants require an intentionally public published event", async () => {
  const migration = await read("supabase/migrations/20260923083042_complete_event_registration_authority.sql");
  assert.match(migration, /public_visible[\s\S]*e\.visibility\s*=\s*'public'/i);
  assert.match(migration, /e\.published_at is not null/i);
  assert.match(migration, /e\.archived_at is null/i);
});

test("decision authority authenticates, authorizes, and owns review metadata", async () => {
  const migration = await read("supabase/migrations/20260923083042_complete_event_registration_authority.sql");
  assert.match(migration, /create or replace function public\.review_event_registration/);
  assert.match(migration, /security definer[\s\S]*set search_path = ''/i);
  assert.match(migration, /v_actor uuid := auth\.uid\(\)/);
  assert.match(migration, /public\.can_manage_event\(v_registration\.event_id\)/);
  assert.match(migration, /reviewed_by = case when p_status = 'pending' then null else v_actor end/);
  assert.match(migration, /revoke all on function public\.review_event_registration[\s\S]*from public, anon/);
});

test("state changes create history and validated registrations sync participants", async () => {
  const migration = await read("supabase/migrations/20260923083042_complete_event_registration_authority.sql");
  assert.match(migration, /INVALID_REGISTRATION_TRANSITION/);
  assert.match(migration, /insert into public\.event_registration_history/);
  assert.match(migration, /changed_by,[\s\S]*auth\.uid\(\)/);
  assert.match(migration, /insert into public\.event_participants/);
  assert.match(migration, /on conflict \(event_id, profile_id, participant_type\)/);
  assert.match(migration, /on conflict \(event_id, organization_id, participant_type\)/);
});
