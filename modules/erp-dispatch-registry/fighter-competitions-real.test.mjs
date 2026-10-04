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

test("Fighter competitions has an explicit real read-only handler", () => {
  assert.match(
    registry,
    /makeEntry\("fighter", "competitions", "implemented", "fighter-competitions", "fighter-competitions", "event", \{ read: true \}\)/,
  );

  assert.match(
    verifier,
    /'fighter-competitions'/,
  );
});

test("Fighter competitions uses stable role/module dispatch", () => {
  assert.match(
    repository,
    /query\.role === "fighter" &&\s*query\.moduleId === "competitions"/,
  );

  assert.match(
    repository,
    /return this\.fighterCompetitions\(/,
  );
});

test("all five competition tabs have explicit semantics", () => {
  const start =
    repository.indexOf(
      "private async fighterCompetitions(",
    );

  const end =
    repository.indexOf(
      "private async fighterPerformance(",
      start,
    );

  assert.ok(start >= 0);
  assert.ok(end > start);

  const block =
    repository.slice(
      start,
      end,
    );

  for (const tab of [
    "invitations",
    "registrations",
    "fights",
    "results",
    "calendar",
  ]) {
    assert.match(
      block,
      new RegExp(
        `query\\.tab ===\\s*"${tab}"`,
      ),
    );
  }
});

test("competition projection uses canonical personal authorities", () => {
  const start =
    repository.indexOf(
      "private async fighterCompetitions(",
    );

  const end =
    repository.indexOf(
      "private async fighterPerformance(",
      start,
    );

  const block =
    repository.slice(
      start,
      end,
    );

  for (const source of [
    "event_invitations",
    "event_registrations",
    "fights",
    "fighters",
    "events",
  ]) {
    assert.match(
      block,
      new RegExp(
        `"${source}"`,
      ),
    );
  }

  assert.match(
    block,
    /\.eq\(\s*"invitee_profile_id",\s*context\.userId/,
  );

  assert.match(
    block,
    /\.eq\(\s*"applicant_profile_id",\s*context\.userId/,
  );

  assert.match(
    block,
    /fighter_red_id\.eq\.\$\{context\.fighterId\},fighter_blue_id\.eq\.\$\{context\.fighterId\}/,
  );
});

test("Fighter competition invitations stay read-only in ERP", () => {
  const line =
    registry
      .split("\n")
      .find(
        (candidate) =>
          candidate.includes(
            'makeEntry("fighter", "competitions"',
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
});

test("Fighter competitions does not create a duplicate decision authority", () => {
  const start =
    repository.indexOf(
      "private async fighterCompetitions(",
    );

  const end =
    repository.indexOf(
      "private async fighterPerformance(",
      start,
    );

  const block =
    repository.slice(
      start,
      end,
    );

  assert.doesNotMatch(
    block,
    /\.insert\(/,
  );

  assert.doesNotMatch(
    block,
    /\.update\(/,
  );

  assert.doesNotMatch(
    block,
    /\.delete\(/,
  );

  assert.doesNotMatch(
    block,
    /respond_to_event_invitation/,
  );

  assert.doesNotMatch(
    block,
    /workspaceRecords/,
  );

  assert.doesNotMatch(
    block,
    /erp_workspace_records/,
  );
});