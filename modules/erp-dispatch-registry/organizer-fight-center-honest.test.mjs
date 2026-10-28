import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");

const navigation = read("modules/organizer-erp/config/navigation.ts");
const prototype = read("modules/organizer-erp/features/OrganizerErpPrototype.tsx");
const feature = read("modules/organizer-erp/fight-center/features/FightCenterFeature.tsx");
const registry = read("modules/erp-dispatch-registry/registry.ts");
const realRepository = read("modules/erp-core/real-data/real-erp-supabase.repository.ts");
const fightRepository = read("modules/organizer-erp/fight-center/repositories/fight-center-supabase.repository.ts");
const weighInRepository = read("modules/organizer-erp/fight-center/weigh-ins/repositories/fight-weigh-in-supabase.repository.ts");
const officialsRepository = read("modules/organizer-erp/fight-center/officials/repositories/fight-officials-supabase.repository.ts");
const routeIntegration = read("modules/finance-erp/components/FinanceErpRouteIntegration.tsx");

const fightCenterNavigation = navigation
  .split(/\r?\n/u)
  .find((line) => line.includes("{ id: 'fight-center'")) ?? "";

test("Fight Center remains visible in Organizer navigation", () => {
  assert.match(fightCenterNavigation, /id: 'fight-center'/);
});

test("Fight Center registry contract remains implemented", () => {
  assert.match(registry, /makeEntry\("organizer", "fight-center", "implemented", "organizer-fight-center", "fight-center-supabase", "event"/);
});

test("Organizer shell dispatches Fight Center to its dedicated feature", () => {
  assert.match(prototype, /activeModule\.id ===\s*"fight-center"[\s\S]*?<FightCenterFeature/);
});

test("Fight Center runtime has no unsupported or generic module fallback", () => {
  assert.doesNotMatch(feature, /unsupported\s*\(/i);
  assert.doesNotMatch(feature, /GenericModule|ModulePlaceholder/);
});

test("fight-card uses the dedicated event fight-card authority", () => {
  assert.match(feature, /FIGHT_CARD_TAB[\s\S]*?<FightCardWorkspace/);
  assert.match(fightRepository, /\.from\('event_fight_cards'\)/);
  assert.match(fightRepository, /\.from\('event_fight_cards'\)\.insert\(/);
});

test("fights uses the dedicated operational fights workspace", () => {
  assert.match(feature, /COMBATS_TAB[\s\S]*?<OperationalFightsWorkspace/);
  assert.match(fightRepository, /\.from\('fights'\)/);
});

test("fighters projection resolves event fighters rather than a placeholder", () => {
  assert.match(realRepository, /key === "fighters"[\s\S]*?this\.eventFighters/);
  assert.match(realRepository, /private async eventFighters[\s\S]*?\.from\("fighters"\)/);
});

test("weigh-in uses the dedicated persistent workspace", () => {
  assert.match(feature, /WEIGH_IN_TAB[\s\S]*?<FightWeighInWorkspace/);
  assert.match(weighInRepository, /\.from\('weigh_ins'\)/);
  assert.match(weighInRepository, /\.from\('weigh_in_history'\)/);
});

test("officials uses the dedicated assignment workspace", () => {
  assert.match(feature, /OFFICIALS_TAB[\s\S]*?<FightOfficialsWorkspace/);
  assert.match(officialsRepository, /\.from\('event_official_assignments'\)/);
  assert.match(officialsRepository, /\.from\('fight_official_assignments'\)/);
  assert.match(officialsRepository, /\.from\('official_availability'\)/);
});

test("replacements resolves the persistent replacement authority", () => {
  assert.match(realRepository, /key === "replacements"[\s\S]*?this\.fightReplacements/);
  assert.match(realRepository, /\.from\("fight_replacements"\)/);
});

test("results resolves persisted fights and real result mutations", () => {
  assert.match(realRepository, /private async organizerFights[\s\S]*?\.from\("fights"\)/);
  assert.match(realRepository, /private async organizerFights[\s\S]*?winner_id[\s\S]*?mutation\("fights"/);
});

test("matchmaking is not exposed as a Fight Center tab", () => {
  assert.doesNotMatch(fightCenterNavigation, /tab\('matchmaking'/);
  assert.doesNotMatch(feature, /case "matchmaking"/);
});

test("Fight Live is not exposed as a competing Fight Center tab", () => {
  assert.doesNotMatch(fightCenterNavigation, /tab\('fight-live'/);
  assert.doesNotMatch(feature, /case "fight-live"/);
});

test("only the three real generic projections can reach RealModuleDataView", () => {
  assert.match(feature, /REAL_PROJECTION_TABS = new Set\(\[\s*"fighters",\s*"replacements",\s*"results",\s*\]\)/);
  assert.match(feature, /REAL_PROJECTION_TABS\.has\([\s\S]*?<RealModuleDataView/);
});

test("unknown or removed tabs fall back to the real fight-card workspace", () => {
  assert.match(feature, /REAL_PROJECTION_TABS\.has\([\s\S]*?\) : \(\s*<FightCardWorkspace/);
});

test("every visible Fight Center tab has a matching real runtime authority", () => {
  for (const tab of ["fight-card", "fights", "fighters", "weigh-in", "officials", "replacements", "results"]) {
    assert.match(fightCenterNavigation, new RegExp(`tab\\('${tab}'`));
  }
  assert.match(routeIntegration, /"fight-live": \{ moduleId: "control-room", tab: "live", preserveRouteContent: true \}/);
});
