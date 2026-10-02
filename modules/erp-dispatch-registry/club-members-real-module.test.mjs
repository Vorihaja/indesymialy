import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const registry = readFileSync(
  "modules/erp-dispatch-registry/registry.ts",
  "utf8",
).replace(/\r\n?/g, "\n");

const repository = readFileSync(
  "modules/erp-core/real-data/real-erp-supabase.repository.ts",
  "utf8",
).replace(/\r\n?/g, "\n");

const types = readFileSync(
  "modules/erp-core/real-data/types.ts",
  "utf8",
).replace(/\r\n?/g, "\n");

const migration = readFileSync(
  "supabase/migrations/20261002090000_club_members_authority_v1.sql",
  "utf8",
).replace(/\r\n?/g, "\n");

test("Club Members has an explicit real handler", () => {
  assert.match(
    registry,
    /makeEntry\("club", "members", "implemented", "club-members", "club-members", "organization"/,
  );

  assert.match(
    registry,
    /"club-members"/,
  );
});

test("Club Members uses stable tab IDs", () => {
  assert.match(
    repository,
    /query\.role === "club" && query\.moduleId === "members"/,
  );

  assert.match(
    repository,
    /key === "attendance"/,
  );

  assert.match(
    repository,
    /query\.tab === "fighters"/,
  );

  assert.match(
    repository,
    /query\.tab === "coaches"/,
  );
});

test("Club member and attendance entities are real CRUD authorities", () => {
  assert.match(
    types,
    /"club_members"/,
  );

  assert.match(
    types,
    /"attendances"/,
  );

  for (const entity of [
    "club_members",
    "attendances",
  ]) {
    assert.match(
      repository,
      new RegExp(`case "${entity}"`),
    );
  }

  assert.match(
    repository,
    /from\("club_members"\)/,
  );

  assert.match(
    repository,
    /from\("attendances"\)/,
  );
});

test("Club mutation authority is privilege-aware", () => {
  assert.match(
    migration,
    /create or replace function public\.can_manage_club_membership/,
  );

  assert.match(
    migration,
    /security definer/,
  );

  assert.match(
    migration,
    /set search_path = ''/,
  );

  assert.match(
    migration,
    /om\.role in \([\s\S]*?'owner'[\s\S]*?'admin'[\s\S]*?'manager'[\s\S]*?'organizer'/,
  );

  assert.match(
    migration,
    /club_members_insert_managers/,
  );

  assert.match(
    migration,
    /attendances_insert_managers/,
  );

  assert.doesNotMatch(
    migration,
    /with check\s*\(\s*true\s*\)/i,
  );
});

test("anonymous execution of club authority is revoked", () => {
  assert.match(
    migration,
    /revoke all[\s\S]*?can_manage_club_membership\(uuid\)[\s\S]*?from public, anon;/i,
  );

  assert.match(
    migration,
    /grant execute[\s\S]*?can_manage_club_membership\(uuid\)[\s\S]*?to authenticated;/i,
  );
});