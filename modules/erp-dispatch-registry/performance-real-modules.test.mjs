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

test("fighter performance has an explicit real handler", () => {
  assert.match(
    registry,
    /makeEntry\("fighter", "performance", "implemented", "fighter-performance", "fighter-performance", "fighter", \{ read: true \}\)/,
  );

  assert.match(
    verifier,
    /'fighter-performance'/,
  );
});

test("club performance has an explicit real handler", () => {
  assert.match(
    registry,
    /makeEntry\("club", "performance", "implemented", "club-performance", "club-performance", "organization", \{ read: true \}\)/,
  );

  assert.match(
    verifier,
    /'club-performance'/,
  );
});

test("performance modules use stable module dispatch", () => {
  assert.match(
    repository,
    /query\.role === "fighter" &&\s*query\.moduleId === "performance"/,
  );

  assert.match(
    repository,
    /query\.role === "club" &&\s*query\.moduleId === "performance"/,
  );

  assert.match(
    repository,
    /return this\.fighterPerformance\(/,
  );

  assert.match(
    repository,
    /return this\.clubPerformance\(/,
  );
});

test("fighter performance is derived from canonical fighter and fight data", () => {
  const start = repository.indexOf("private async fighterPerformance(");
  const end = repository.indexOf("private async clubPerformance(", start);
  const fighterPerformance = repository.slice(start, end);

  assert.ok(start >= 0 && end > start);

  assert.match(
    fighterPerformance,
    /private async fighterPerformance/,
  );

  assert.match(
    fighterPerformance,
    /\.from\("fighters"\)/,
  );

  assert.match(
    fighterPerformance,
    /\.from\("fights"\)/,
  );

  assert.match(
    fighterPerformance,
    /query\.tab === "sport"/,
  );

  assert.match(
    fighterPerformance,
    /query\.tab === "condition"/,
  );

  assert.match(
    fighterPerformance,
    /query\.tab === "fights"/,
  );

  assert.doesNotMatch(
    fighterPerformance,
    /query\.tab === "reports"/,
  );

  assert.doesNotMatch(
    fighterPerformance,
    /query\.tab === "progress"/,
  );
});

test("club performance is derived only from club, fighter and fight authorities", () => {
  assert.match(
    repository,
    /private async clubPerformance/,
  );

  assert.match(
    repository,
    /\.from\("club_members"\)/,
  );

  assert.match(
    repository,
    /query\.tab === "fighters"/,
  );

  assert.match(
    repository,
    /query\.tab === "groups"/,
  );

  assert.match(
    repository,
    /query\.tab ===\s*"competitions"/,
  );

  assert.match(
    repository,
    /query\.tab === "reports"/,
  );
});

test("performance modules remain read only", () => {
  const fighterLine =
    registry
      .split("\n")
      .find(
        (line) =>
          line.includes(
            'makeEntry("fighter", "performance"',
          ),
      );

  const clubLine =
    registry
      .split("\n")
      .find(
        (line) =>
          line.includes(
            'makeEntry("club", "performance"',
          ),
      );

  assert.ok(fighterLine);
  assert.ok(clubLine);

  for (const line of [
    fighterLine,
    clubLine,
  ]) {
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
