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

const verifier = readFileSync(
  "scripts/verify-erp-dispatch.js",
  "utf8",
).replace(/\r\n?/g, "\n");

const modules = [
  ["super-admin", "platform-overview"],
  ["admin", "admin-overview"],
  ["organizer", "organizer-overview"],
  ["sponsor", "sponsor-overview"],
  ["official", "official-overview"],
  ["fan", "fan-overview"],
];

test("six remaining overview modules have explicit handlers", () => {
  for (const [role, handler] of modules) {
    assert.match(
      registry,
      new RegExp(
        `makeEntry\\("${role}", "overview", "implemented", "${handler}"`,
      ),
    );

    assert.match(
      registry,
      new RegExp(`"${handler}"`),
    );

    assert.match(
      verifier,
      new RegExp(`'${handler}'`),
    );
  }
});

test("platform overview uses canonical platform sources", () => {
  assert.match(
    repository,
    /private async platformOverview/,
  );

  for (const source of [
    "profiles",
    "organizations",
    "events",
    "products",
  ]) {
    assert.match(
      repository,
      new RegExp(`\\.from\\("${source}"\\)`),
    );
  }
});

test("organizer and sponsor reuse real organization overview", () => {
  assert.match(
    repository,
    /"organizer"/,
  );

  assert.match(
    repository,
    /"sponsor"/,
  );

  assert.match(
    repository,
    /return this\.organizationOverview\(/,
  );
});

test("official overview uses assignment and availability authorities", () => {
  assert.match(
    repository,
    /private async officialOverview/,
  );

  for (const source of [
    "event_official_assignments",
    "fight_official_assignments",
    "official_availability",
  ]) {
    assert.match(
      repository,
      new RegExp(`"${source}"`),
    );
  }

  assert.match(
    repository,
    /\.eq\(\s*"profile_id",\s*context\.userId/,
  );

  assert.match(
    repository,
    /\.eq\(\s*"user_id",\s*context\.userId/,
  );
});

test("fan overview is personal and event-backed", () => {
  assert.match(
    repository,
    /private async fanOverview/,
  );

  assert.match(
    repository,
    /\.eq\(\s*"invitee_profile_id",\s*context\.userId/,
  );

  assert.match(
    repository,
    /\.from\(\s*"event_invitations",?\s*\)/,
  );

  assert.match(
    repository,
    /\.from\("events"\)/,
  );
});

test("all six overview modules remain read only", () => {
  for (const [role] of modules) {
    const line =
      registry
        .split("\n")
        .find(
          (candidate) =>
            candidate.includes(
              `makeEntry("${role}", "overview"`,
            ),
        );

    assert.ok(line);

    assert.match(
      line,
      /\{ read: true \}/,
    );

    assert.doesNotMatch(
      line,
      /create: true/,
    );

    assert.doesNotMatch(
      line,
      /update: true/,
    );

    assert.doesNotMatch(
      line,
      /delete: true/,
    );
  }
});

test("overview handlers have no generic runtime fallback", () => {
  assert.doesNotMatch(
    repository,
    /return this\.workspaceRecords/,
  );

  assert.doesNotMatch(
    repository,
    /const stores\s*=\s*new Map/,
  );
});