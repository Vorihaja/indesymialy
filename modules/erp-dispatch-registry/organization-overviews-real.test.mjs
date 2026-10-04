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

const roles = [
  ["federation", "federation-overview"],
  ["league", "league-overview"],
  ["club", "club-overview"],
  ["coach", "coach-overview"],
];

test("four organization overview modules have explicit handlers", () => {
  for (const [role, handler] of roles) {
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

test("overview dispatch uses stable role and module ids", () => {
  assert.match(
    repository,
    /query\.moduleId === "overview"/,
  );

  assert.match(
    repository,
    /\["federation", "league", "club", "coach"\]\.includes/,
  );

  assert.match(
    repository,
    /return this\.organizationOverview\(/,
  );
});

test("organization overview uses only canonical real sources", () => {
  assert.match(
    repository,
    /private async organizationOverview/,
  );

  for (const source of [
    "organizations",
    "organization_members",
    "events",
    "event_coorganizers",
    "training_sessions",
  ]) {
    assert.match(
      repository,
      new RegExp(`\\.from\\("${source}"\\)`),
    );
  }
});

test("organization overviews are read only", () => {
  for (const [role] of roles) {
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

test("overview handler does not use workspace or memory fallback", () => {
  assert.doesNotMatch(
    repository,
    /return this\.workspaceRecords/,
  );

  assert.doesNotMatch(
    repository,
    /const stores\s*=\s*new Map/,
  );
});