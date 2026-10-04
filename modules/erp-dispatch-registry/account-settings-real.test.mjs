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
  "super-admin",
  "admin",
  "federation",
  "league",
  "club",
  "coach",
  "fighter",
  "official",
  "organizer",
  "sponsor",
  "seller",
  "fan",
];

function settingsBlock() {
  const start =
    repository.indexOf(
      "private async accountSettings(",
    );

  const end =
    repository.indexOf(
      "private async identity(",
      start,
    );

  assert.ok(
    start >= 0,
  );

  assert.ok(
    end > start,
  );

  return repository.slice(
    start,
    end,
  );
}

test("all twelve role settings modules use one explicit personal handler", () => {
  for (const role of roles) {
    assert.match(
      registry,
      new RegExp(
        `makeEntry\\("${role}", "settings", "implemented", "account-settings", "identity-core", "personal", \\{ read: true \\}\\)`,
      ),
    );
  }

  assert.match(
    verifier,
    /'account-settings'/,
  );
});

test("settings dispatch is based on stable role and module IDs", () => {
  assert.match(
    repository,
    /query\.moduleId === "settings"/,
  );

  for (const role of roles) {
    assert.match(
      repository,
      new RegExp(
        `"${role}"`,
      ),
    );
  }

  assert.match(
    repository,
    /return this\.accountSettings\(/,
  );
});

test("all five settings tabs have explicit semantics", () => {
  const block =
    settingsBlock();

  for (const tab of [
    "account",
    "profile-verification",
    "privacy",
    "notifications",
    "preferences",
  ]) {
    assert.match(
      block,
      new RegExp(
        `query\\.tab ===\\s*"${tab}"`,
      ),
    );
  }
});

test("account settings use canonical personal authorities", () => {
  const block =
    settingsBlock();

  for (const source of [
    "profiles",
    "account_preferences",
    "notification_preferences",
    "profile_verification_requests",
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

  const profileIdFilters =
    block.match(
      /\.eq\(\s*"profile_id",\s*context\.userId/g,
    ) ?? [];

  assert.ok(
    profileIdFilters.length >= 4,
  );
});

test("ERP settings do not duplicate Account mutation authority", () => {
  for (const role of roles) {
    const line =
      registry
        .split("\n")
        .find(
          (candidate) =>
            candidate.includes(
              `makeEntry("${role}", "settings"`,
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

test("account settings projection performs no direct mutation", () => {
  const block =
    settingsBlock();

  assert.doesNotMatch(
    block,
    /\.insert\(/,
  );

  assert.doesNotMatch(
    block,
    /\.upsert\(/,
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