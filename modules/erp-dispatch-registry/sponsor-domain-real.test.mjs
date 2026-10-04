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
  ["contracts", "sponsor-contracts"],
  ["activations", "sponsor-activations"],
  ["deliverables", "sponsor-deliverables"],
];

function block(startName, endName) {
  const start =
    repository.indexOf(
      `private async ${startName}(`,
    );

  const end =
    repository.indexOf(
      `private async ${endName}(`,
      start,
    );

  assert.ok(start >= 0);
  assert.ok(end > start);

  return repository.slice(
    start,
    end,
  );
}

test("three Sponsor modules use explicit read-only handlers", () => {
  for (const [moduleId, handler] of modules) {
    assert.match(
      registry,
      new RegExp(
        `makeEntry\\("sponsor", "${moduleId}", "implemented", "${handler}", "${handler}", "organization", \\{ read: true \\}\\)`,
      ),
    );

    assert.match(
      verifier,
      new RegExp(
        `'${handler}'`,
      ),
    );
  }
});

test("Sponsor IDs are resolved through sponsors.organization_id", () => {
  assert.match(
    repository,
    /private async sponsorIdsForContext/,
  );

  assert.match(
    repository,
    /\.from\("sponsors"\)[\s\S]*?\.in\(\s*"organization_id",\s*context\.organizationIds/,
  );

  assert.match(
    repository,
    /\.from\("event_sponsors"\)[\s\S]*?\.in\(\s*"sponsor_id",\s*sponsorIds/,
  );
});

test("Sponsor performance no longer treats organization UUID as sponsors.id", () => {
  const performance =
    block(
      "sponsorPerformance",
      "sponsorContracts",
    );

  assert.match(
    performance,
    /sponsorIdsForContext/,
  );

  assert.match(
    performance,
    /\.in\(\s*"sponsor_id",\s*sponsorIds/,
  );

  assert.doesNotMatch(
    performance,
    /\bsponsorId\b/,
  );

  assert.doesNotMatch(
    performance,
    /organizationsResult/,
  );
});

test("Sponsor contracts implement all four configured tabs", () => {
  const contracts =
    block(
      "sponsorContracts",
      "sponsorActivations",
    );

  assert.match(
    contracts,
    /\.from\("sponsor_contracts"\)/,
  );

  for (const tab of [
    "active",
    "to-sign",
    "renewals",
    "archives",
  ]) {
    assert.match(
      contracts,
      new RegExp(
        `query\\.tab === "${tab}"`,
      ),
    );
  }
});

test("Sponsor activations implement all four configured tabs", () => {
  const activations =
    block(
      "sponsorActivations",
      "sponsorDeliverables",
    );

  assert.match(
    activations,
    /"sponsor_activations"/,
  );

  for (const tab of [
    "digital",
    "field",
    "hospitality",
  ]) {
    assert.match(
      activations,
      new RegExp(
        `query\\.tab ===\\s*"${tab}"`,
      ),
    );
  }

  assert.match(
    activations,
    /let rows =\s*allRows/,
  );
});

test("Sponsor deliverables implement all four configured tabs", () => {
  const deliverables =
    block(
      "sponsorDeliverables",
      "platformOverview",
    );

  assert.match(
    deliverables,
    /"event_sponsor_deliverables"/,
  );

  for (const tab of [
    "to-produce",
    "to-validate",
    "delivered",
    "proofs",
  ]) {
    assert.match(
      deliverables,
      new RegExp(
        `query\\.tab ===\\s*"${tab}"`,
      ),
    );
  }
});

test("Sponsor domain projection exposes no direct ERP mutation", () => {
  const start =
    repository.indexOf(
      "private async sponsorContracts(",
    );

  const end =
    repository.indexOf(
      "private async platformOverview(",
      start,
    );

  assert.ok(start >= 0);
  assert.ok(end > start);

  const sponsorDomain =
    repository.slice(
      start,
      end,
    );

  assert.doesNotMatch(
    sponsorDomain,
    /\.insert\(/,
  );

  assert.doesNotMatch(
    sponsorDomain,
    /\.update\(/,
  );

  assert.doesNotMatch(
    sponsorDomain,
    /\.delete\(/,
  );

  assert.doesNotMatch(
    sponsorDomain,
    /workspaceRecords/,
  );

  assert.doesNotMatch(
    sponsorDomain,
    /erp_workspace_records/,
  );
});