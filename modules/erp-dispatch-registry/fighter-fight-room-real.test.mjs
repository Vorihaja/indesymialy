import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8").replace(/\r\n?/g, "\n");

const navigation = read("modules/fighter-erp/config/navigation.ts");
const registry = read("modules/erp-dispatch-registry/registry.ts");
const prototype = read("modules/fighter-erp/features/FighterErpPrototype.tsx");
const adapter = read("modules/fighter-erp/components/FighterFightRoom.tsx");
const hook = read("modules/fight-live/hooks/useFightLiveWorkspace.ts");
const useCase = read("modules/fight-live/use-cases/manage-fight-live.use-case.ts");
const service = read("modules/fight-live/services/fight-live-integration.service.ts");
const repository = read("modules/fight-live/repositories/fight-live-supabase.repository.ts");
const workspace = read("modules/fight-live/features/FightLiveWorkspaceFeature.tsx");
const access = read("modules/fight-live/access.ts");
const migration = read("supabase/migrations/20260925082825_complete_fight_live_authority.sql");

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
const futureModules = [
  ...futureNavigation.matchAll(/\bid:\s*'([^']+)'/g),
].map((match) => match[1]);

const registryEntry = registry.match(
  /makeEntry\("fighter", "fight-room", "([^"]+)", "([^"]+)", "([^"]+)", "([^"]+)"/,
);

test("Fight Room registry resolves to the canonical Fight Live handler", () => {
  assert.deepEqual(registryEntry?.slice(1), [
    "implemented", "fight-live", "fight-live", "fighter",
  ]);
});

test("Fight Room is visible only after the real integration", () => {
  assert.equal(visibleModules.at(-1), "fight-room");
  assert.ok(!futureModules.includes("fight-room"));
});

test("the Fighter shell dispatches Fight Room to its real adapter", () => {
  assert.match(prototype, /activeModule\.id === "fight-room"[\s\S]*?<FighterFightRoom \/>/);
});

test("the adapter uses the canonical Fighter list hook", () => {
  assert.match(adapter, /useFightLiveList\("fighter"\)/);
  assert.match(hook, /useCase\.list\(scope\)/);
  assert.match(useCase, /list\(scope:[\s\S]*?this\.service\.list\(scope\)/);
  assert.match(service, /this\.repository\.list\(scope\)/);
});

test("the canonical repository uses the deployed Fighter list scope", () => {
  assert.match(repository, /rpc\("fight_live_list_ids",\s*\{\s*p_scope: scope/);
  assert.match(migration, /when 'fighter' then auth\.uid\(\) is not null/);
});

test("the adapter reuses the canonical Fight Live detail feature", () => {
  assert.match(adapter, /<FightLiveWorkspaceFeature[\s\S]*?mode="fighter"[\s\S]*?section="overview"/);
  assert.match(workspace, /useFightLiveWorkspace\(fightId, false,[\s\S]*?mode\)/);
  assert.match(hook, /await useCase\.get\(fightId\)/);
});

test("arbitrary detail identifiers remain protected by participant RLS", () => {
  assert.match(migration, /create policy fights_participant_read[\s\S]*?fi\.profile_id = auth\.uid\(\)/);
  assert.match(migration, /private\.can_view_fight_live\(fight_id\)/);
});

test("Fighter identity maps auth user to either fight corner", () => {
  assert.match(migration, /fi\.id in \(f\.fighter_red_id, f\.fighter_blue_id\)[\s\S]*?fi\.profile_id = auth\.uid\(\)/);
});

test("Fight Room cannot reach unsupported or the generic placeholder", () => {
  const dispatchStart = prototype.indexOf('activeModule.id === "fight-room"');
  const dispatchEnd = prototype.indexOf(" ) : (", dispatchStart);
  assert.ok(dispatchStart >= 0);
  assert.doesNotMatch(prototype.slice(dispatchStart, dispatchEnd), /unsupported|RealModuleDataView/);
  assert.doesNotMatch(adapter, /unsupported|Module en cours de développement/);
});

test("the Fighter adapter contains no demo data or artificial timer", () => {
  assert.doesNotMatch(adapter, /\b(?:mock|demo|fixture|setTimeout|setInterval)\b/i);
  assert.doesNotMatch(adapter, /Mahajanga|Tiana Rakoto|Nomena|70,2 kg/);
});

test("the Fighter UI has no direct Supabase access", () => {
  assert.doesNotMatch(`${adapter}\n${prototype}`, /createClient|createSupabase|supabase\.(?:from|rpc)/);
});

test("the Fighter presentation exposes no Fight Live mutation", () => {
  assert.doesNotMatch(adapter, /\.timer\(|\.action\(|saveScore|submitCard|decide|publish|recalculate/);
  assert.match(access, /mode === "fighter"[\s\S]*?canViewOperationalLive: true/);
  assert.match(access, /viewerCapabilities[\s\S]*?canControlTimer: false/);
});

test("no parallel Fight Live authority is introduced", () => {
  assert.doesNotMatch(adapter, /class .*Repository|\.rpc\(|\.from\(|create table|create or replace function/i);
  assert.match(repository, /class FightLiveSupabaseRepository implements FightLiveRepositoryPort/);
});

test("the previous nine visible Fighter modules remain in order", () => {
  assert.deepEqual(visibleModules.slice(0, 9), [
    "overview", "profile", "career", "competitions", "finance",
    "performance", "marketplace", "calendar", "settings",
  ]);
});

test("the five deferred Fighter modules remain hidden", () => {
  for (const moduleId of ["training", "fight-preparation", "health", "team", "sponsors"]) {
    assert.ok(!visibleModules.includes(moduleId), `${moduleId} remains visible`);
    assert.ok(futureModules.includes(moduleId), `${moduleId} future config missing`);
  }
});
