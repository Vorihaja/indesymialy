import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8").replace(/\r\n?/g, "\n");

const navigation = read("modules/fighter-erp/config/navigation.ts");
const registry = read("modules/erp-dispatch-registry/registry.ts");
const repository = read("modules/erp-core/real-data/real-erp-supabase.repository.ts");
const prototype = read("modules/fighter-erp/features/FighterErpPrototype.tsx");
const overview = read("modules/fighter-erp/components/FighterOverview.tsx");
const realModuleView = read("modules/organizer-erp/components/RealModuleDataView.tsx");

const visibleNavigation = navigation.slice(
  navigation.indexOf("export const fighterModules"),
  navigation.indexOf("export const fighterFutureModules"),
);
const futureNavigation = navigation.slice(
  navigation.indexOf("export const fighterFutureModules"),
);
const visibleModules = [
  ...visibleNavigation.matchAll(/\bid:\s*'([^']+)'/g),
].map((match) => match[1]);

const fighterRegistry = new Map(
  [...registry.matchAll(
    /makeEntry\("fighter",\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]+)"/g,
  )].map((match) => [
    match[1],
    { status: match[2], handler: match[3] },
  ]),
);

const hiddenModules = [
  "training",
  "fight-preparation",
  "health",
  "team",
  "sponsors",
];
const futureModuleIds = [
  ...futureNavigation.matchAll(/\bid:\s*'([^']+)'/g),
].map((match) => match[1]);

function methodBlock(name, nextName) {
  const start = repository.indexOf(`private async ${name}(`);
  const end = repository.indexOf(`private async ${nextName}(`, start);
  assert.ok(start >= 0, `${name} method missing`);
  assert.ok(end > start, `${name} method boundary missing`);
  return repository.slice(start, end);
}

test("overview remains the first visible Fighter module", () => {
  assert.equal(visibleModules[0], "overview");
});

test("overview registry contract is implemented and specialized", () => {
  assert.deepEqual(fighterRegistry.get("overview"), {
    status: "implemented",
    handler: "fighter-overview",
  });
});

test("overview is wired from the shell to a real repository dispatcher", () => {
  assert.match(prototype, /activeModule\.id === "overview"[\s\S]*?<FighterOverview \/>/);
  assert.match(overview, /<RealModuleDataView[\s\S]*?moduleId="overview"/);
  assert.match(
    repository,
    /query\.role === "fighter" &&\s*query\.moduleId === "overview"[\s\S]*?return this\.fighterOverview\(/,
  );
});

test("overview dispatch and projection never return unsupported", () => {
  const dispatchStart = repository.indexOf('query.role === "fighter" &&\n      query.moduleId === "overview"');
  const dispatchEnd = repository.indexOf('query.role === "fighter" &&\n      query.moduleId === "profile"', dispatchStart);
  assert.ok(dispatchStart >= 0 && dispatchEnd > dispatchStart);
  assert.doesNotMatch(repository.slice(dispatchStart, dispatchEnd), /unsupported\s*\(/);
  assert.doesNotMatch(methodBlock("fighterOverview", "fighterCareer"), /unsupported\s*\(/);
});

test("overview projection uses canonical live authorities", () => {
  const block = methodBlock("fighterOverview", "fighterCareer");
  for (const authority of [
    "profiles",
    "fighters",
    "fighter_career_stats",
    "elo_history",
    "fights",
    "events",
  ]) {
    assert.match(block, new RegExp(`\\.from\\(\\"${authority}\\"\\)`));
  }
  assert.match(block, /source:\s*"supabase"|buildData\(/);
});

test("overview contains no demo, mock, fixture or artificial timer runtime", () => {
  const runtime = `${overview}\n${methodBlock("fighterOverview", "fighterCareer")}`;
  assert.doesNotMatch(runtime, /\b(?:mock|demo|fixture|setTimeout)\b/i);
  assert.doesNotMatch(runtime, /Mahajanga Fight Night|Tiana Rakoto|11–2–1|22,1 M Ar/);
  assert.doesNotMatch(runtime, /(?:wins|losses|draws)\s*=.*?\?\?\s*0/);
});

test("all five unavailable Fighter modules are hidden", () => {
  for (const moduleId of hiddenModules) {
    assert.ok(!visibleModules.includes(moduleId), `${moduleId} remains visible`);
  }
});

test("all five unavailable Fighter modules remain registered as unavailable", () => {
  for (const moduleId of hiddenModules) {
    assert.deepEqual(fighterRegistry.get(moduleId), {
      status: "unavailable",
      handler: "unavailable",
    });
    assert.ok(futureModuleIds.includes(moduleId), `${moduleId} future config missing`);
  }
});

test("Fight Room is visible in Fighter navigation", () => {
  assert.ok(visibleModules.includes("fight-room"));
});

test("Fight Room is classified implemented through Fight Live", () => {
  assert.deepEqual(fighterRegistry.get("fight-room"), {
    status: "implemented",
    handler: "fight-live",
  });
  assert.ok(!futureModuleIds.includes("fight-room"));
});

test("Fighter exposes exactly the ten certified modules in order", () => {
  assert.deepEqual(visibleModules, [
    "overview",
    "profile",
    "career",
    "competitions",
    "finance",
    "performance",
    "marketplace",
    "calendar",
    "settings",
    "fight-room",
  ]);
});

test("every visible Fighter module has an implemented non-unavailable handler", () => {
  for (const moduleId of visibleModules) {
    const entry = fighterRegistry.get(moduleId);
    assert.ok(entry, `${moduleId} registry entry missing`);
    assert.equal(entry.status, "implemented", `${moduleId} is not implemented`);
    assert.notEqual(entry.handler, "unavailable", `${moduleId} uses unavailable handler`);
  }
});

test("performance and marketplace real handlers remain preserved", () => {
  assert.deepEqual(fighterRegistry.get("performance"), {
    status: "implemented",
    handler: "fighter-performance",
  });
  assert.deepEqual(fighterRegistry.get("marketplace"), {
    status: "implemented",
    handler: "marketplace-public",
  });
  assert.match(repository, /query\.moduleId === "performance"[\s\S]*?this\.fighterPerformance\(/);
  assert.match(prototype, /activeModule\.id === "marketplace"[\s\S]*?<CatalogFeature \/>/);
});

test("no visible Fighter module can resolve the generic unavailable component", () => {
  const unavailableVisible = visibleModules.filter(
    (moduleId) => fighterRegistry.get(moduleId)?.status !== "implemented",
  );
  assert.deepEqual(unavailableVisible, []);
  assert.match(realModuleView, /implementationStatus === "unavailable"/);
});

test("generic unavailable JSX contains no literal Unicode escape", () => {
  assert.doesNotMatch(realModuleView, /\\u[0-9a-fA-F]{4}/);
  assert.match(realModuleView, /Module en cours de développement/);
  assert.match(realModuleView, /Référence : \{role\}\/\{moduleId\}/);
});
