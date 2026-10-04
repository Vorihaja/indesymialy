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

function profileBlock() {
  const start =
    repository.indexOf(
      "private async fighterProfile(",
    );

  const end =
    repository.indexOf(
      "private async fighterCompetitions(",
      start,
    );

  assert.ok(start >= 0);
  assert.ok(end > start);

  return repository.slice(
    start,
    end,
  );
}

test("Fighter profile has an explicit real read-only handler", () => {
  assert.match(
    registry,
    /makeEntry\("fighter", "profile", "implemented", "fighter-profile", "fighter-profile", "personal", \{ read: true \}\)/,
  );

  assert.match(
    verifier,
    /'fighter-profile'/,
  );
});

test("Fighter profile uses stable role and module dispatch", () => {
  assert.match(
    repository,
    /query\.role === "fighter" &&\s*query\.moduleId === "profile"/,
  );

  assert.match(
    repository,
    /return this\.fighterProfile\(/,
  );
});

test("all five profile tabs have explicit semantics", () => {
  const block =
    profileBlock();

  for (const tab of [
    "identity",
    "disciplines",
    "categories",
    "clubs",
    "documents",
  ]) {
    assert.match(
      block,
      new RegExp(
        `query\\.tab ===\\s*"${tab}"`,
      ),
    );
  }
});

test("Fighter profile uses canonical personal authorities", () => {
  const block =
    profileBlock();

  for (const source of [
    "profiles",
    "fighters",
    "user_disciplines",
    "disciplines",
    "club_members",
    "organizations",
    "profile_verification_documents",
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
    /\.eq\(\s*"id",\s*context\.userId/,
  );

  assert.match(
    block,
    /\.eq\(\s*"user_id",\s*context\.userId/,
  );

  assert.match(
    block,
    /\.eq\(\s*"profile_id",\s*context\.userId/,
  );
});

test("Fighter profile remains read only in ERP", () => {
  const line =
    registry
      .split("\n")
      .find(
        (candidate) =>
          candidate.includes(
            'makeEntry("fighter", "profile"',
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

test("Fighter profile projection cannot mutate canonical identity", () => {
  const block =
    profileBlock();

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
    /workspaceRecords/,
  );

  assert.doesNotMatch(
    block,
    /erp_workspace_records/,
  );
});