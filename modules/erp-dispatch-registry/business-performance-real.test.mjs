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

test("Organizer and Sponsor performance use explicit real handlers", () => {
  assert.match(
    registry,
    /makeEntry\("organizer", "performance", "implemented", "organizer-performance", "event-performance", "event", \{ read: true \}\)/,
  );

  assert.match(
    registry,
    /makeEntry\("sponsor", "performance", "implemented", "sponsor-performance", "sponsor-performance", "organization", \{ read: true \}\)/,
  );

  assert.match(
    verifier,
    /'organizer-performance'/,
  );

  assert.match(
    verifier,
    /'sponsor-performance'/,
  );
});

test("Organizer performance has explicit stable-tab dispatch", () => {
  assert.match(
    repository,
    /query\.role === "organizer" &&\s*query\.moduleId === "performance"/,
  );

  assert.match(
    repository,
    /return this\.organizerPerformance\(/,
  );

  for (const tab of [
    "results",
    "sport",
    "ticketing",
    "finance",
    "operations",
    "audience",
    "reports",
  ]) {
    assert.match(
      repository,
      new RegExp(`query\\.tab === "${tab}"`),
    );
  }
});

test("Organizer performance uses canonical event authorities", () => {
  for (const source of [
    "events",
    "fights",
    "ticket_sales",
    "event_transactions",
    "event_operation_records",
    "event_reports",
  ]) {
    assert.match(
      repository,
      new RegExp(`"${source}"`),
    );
  }
});

test("Sponsor performance has explicit stable-tab dispatch", () => {
  assert.match(
    repository,
    /query\.role === "sponsor" &&\s*query\.moduleId === "performance"/,
  );

  assert.match(
    repository,
    /return this\.sponsorPerformance\(/,
  );

  for (const tab of [
    "audience",
    "visibility",
    "engagement",
    "roi",
    "reports",
  ]) {
    assert.match(
      repository,
      new RegExp(`query\\.tab === "${tab}"`),
    );
  }
});

test("Sponsor performance uses canonical sponsor authorities", () => {
  for (const source of [
    "event_sponsors",
    "sponsor_visibility_items",
    "sponsor_activations",
    "event_sponsor_deliverables",
  ]) {
    assert.match(
      repository,
      new RegExp(`"${source}"`),
    );
  }

  assert.match(
    repository,
    /\.eq\(\s*"sponsor_id",\s*sponsorId/,
  );
});

test("Performance handlers remain read only", () => {
  for (const [role, moduleId] of [
    ["organizer", "performance"],
    ["sponsor", "performance"],
  ]) {
    const line =
      registry
        .split("\n")
        .find(
          (candidate) =>
            candidate.includes(
              `makeEntry("${role}", "${moduleId}"`,
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

test("Business performance handlers do not use generic workspace fallback", () => {
  const organizerStart =
    repository.indexOf(
      "private async organizerPerformance(",
    );

  const sponsorStart =
    repository.indexOf(
      "private async sponsorPerformance(",
    );

  const platformStart =
    repository.indexOf(
      "private async platformOverview(",
    );

  assert.ok(
    organizerStart >= 0,
  );

  assert.ok(
    sponsorStart > organizerStart,
  );

  assert.ok(
    platformStart > sponsorStart,
  );

  const performanceBlock =
    repository.slice(
      organizerStart,
      platformStart,
    );

  assert.doesNotMatch(
    performanceBlock,
    /workspaceRecords/,
  );

  assert.doesNotMatch(
    performanceBlock,
    /erp_workspace_records/,
  );

  assert.doesNotMatch(
    performanceBlock,
    /const stores\s*=\s*new Map/,
  );
});