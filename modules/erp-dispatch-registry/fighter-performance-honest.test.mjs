import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8").replace(/\r\n?/g, "\n");

const navigation = read("modules/fighter-erp/config/navigation.ts");
const registry = read("modules/erp-dispatch-registry/registry.ts");
const repository = read("modules/erp-core/real-data/real-erp-supabase.repository.ts");
const prototype = read("modules/fighter-erp/features/FighterErpPrototype.tsx");

const performanceNavigation = navigation.match(
  /\{ id: 'performance',[^\n]+\}/,
)?.[0] ?? "";

const methodStart = repository.indexOf("private async fighterPerformance(");
const methodEnd = repository.indexOf("private async clubPerformance(", methodStart);
const performanceRuntime = repository.slice(methodStart, methodEnd);

test("Fighter Performance remains visible with its real specialized handler", () => {
  assert.match(performanceNavigation, /id: 'performance'/);
  assert.match(
    registry,
    /makeEntry\("fighter", "performance", "implemented", "fighter-performance", "fighter-performance", "fighter", \{ read: true \}\)/,
  );
  assert.match(prototype, /<RealModuleDataView[\s\S]*?role="fighter"/);
});

test("Fighter Performance exposes only the four honest V1 tabs", () => {
  const tabs = [...performanceNavigation.matchAll(/tab\('([^']+)'/g)].map(
    (match) => match[1],
  );

  assert.deepEqual(tabs, ["summary", "sport", "condition", "fights"]);
  assert.ok(!tabs.includes("progress"));
  assert.ok(!tabs.includes("reports"));
});

test("every visible Performance tab is backed by canonical fighter or fight data", () => {
  assert.ok(methodStart >= 0 && methodEnd > methodStart);
  assert.match(performanceRuntime, /\.from\("fighters"\)/);
  assert.match(performanceRuntime, /\.from\("fights"\)/);
  assert.match(performanceRuntime, /query\.tab === "sport"/);
  assert.match(performanceRuntime, /query\.tab === "condition"/);
  assert.match(performanceRuntime, /query\.tab === "fights"/);
  assert.match(performanceRuntime, /return buildData\(/);
});

test("Performance does not expose duplicated fight projections as progress or reports", () => {
  assert.doesNotMatch(performanceRuntime, /query\.tab === "progress"/);
  assert.doesNotMatch(performanceRuntime, /query\.tab === "reports"/);
  assert.doesNotMatch(performanceNavigation, /tab\('progress'/);
  assert.doesNotMatch(performanceNavigation, /tab\('reports'/);
});

test("Performance runtime contains no mock, demo, fixture, timer, or hard-coded trend", () => {
  assert.doesNotMatch(performanceRuntime, /\b(?:mock|demo|fixture|setTimeout)\b/i);
  assert.doesNotMatch(performanceRuntime, /(?:trend|tendance|progression|percentage|pourcentage)\s*[:=]/i);
});

test("Performance remains read-only and never reaches unsupported", () => {
  const registryLine = registry
    .split("\n")
    .find((line) => line.includes('makeEntry("fighter", "performance"'));

  assert.ok(registryLine);
  assert.doesNotMatch(registryLine, /(?:create|update|delete): true/);
  assert.doesNotMatch(performanceRuntime, /unsupported\s*\(/);
});

test("Performance presentation has no direct Supabase access", () => {
  assert.doesNotMatch(prototype, /createSupabase|supabase\.(?:from|rpc)\s*\(/);
});

test("Performance summary reports only stored or counted values", () => {
  assert.match(performanceRuntime, /fighter\.wins/);
  assert.match(performanceRuntime, /fighter\.losses/);
  assert.match(performanceRuntime, /fighter\.draws/);
  assert.match(performanceRuntime, /fighter\.elo_rating/);
  assert.match(performanceRuntime, /fights\.length/);
});

test("Condition is a real fighter profile projection, not a fight alias", () => {
  const conditionStart = performanceRuntime.indexOf('query.tab === "condition"');
  const fightsStart = performanceRuntime.indexOf('query.tab === "fights"');
  const conditionBlock = performanceRuntime.slice(conditionStart, fightsStart);

  assert.ok(conditionStart >= 0 && fightsStart > conditionStart);
  assert.match(conditionBlock, /fighter\.current_weight_kg/);
  assert.match(conditionBlock, /fighter\.last_medical_check/);
  assert.doesNotMatch(conditionBlock, /fights\.map/);
});

test("Fights is the only visible tab that projects fight rows", () => {
  const fightsStart = performanceRuntime.indexOf('query.tab === "fights"');
  const fightsBlock = performanceRuntime.slice(fightsStart);

  assert.ok(fightsStart >= 0);
  assert.match(fightsBlock, /fights\.map/);
  assert.match(fightsBlock, /opponentName/);
  assert.match(fightsBlock, /fightResult/);
});
