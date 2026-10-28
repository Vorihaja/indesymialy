import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");

const registry = read("modules/erp-dispatch-registry/registry.ts");
const verifier = read("scripts/verify-erp-dispatch.js");
const navigation = read("modules/organizer-erp/config/navigation.ts");
const prototype = read("modules/organizer-erp/features/OrganizerErpPrototype.tsx");
const access = read("modules/fight-live/access.ts");
const shell = read("modules/fight-live/components/FightLiveShell.tsx");
const routeIntegration = read("modules/finance-erp/components/FinanceErpRouteIntegration.tsx");
const listFeature = read("modules/fight-live/features/FightLiveListFeature.tsx");
const workspaceFeature = read("modules/fight-live/features/FightLiveWorkspaceFeature.tsx");
const workspaceHook = read("modules/fight-live/hooks/useFightLiveWorkspace.ts");
const factory = read("modules/fight-live/factories/fight-live.factory.ts");
const repository = read("modules/fight-live/repositories/fight-live-supabase.repository.ts");
const fightCenter = read("modules/organizer-erp/fight-center/features/FightCenterFeature.tsx");

test("organizer control room is backed by canonical Fight Live authority", () => {
  assert.match(
    registry,
    /makeEntry\("organizer",\s*"control-room",\s*"implemented",\s*"fight-live",\s*"fight-live",\s*"event",\s*\{\s*read:\s*true,\s*create:\s*true,\s*update:\s*true,\s*delete:\s*false\s*\}\)/,
  );

  assert.doesNotMatch(
    registry,
    /!confirmedHandlerKeys\.has\(handlerKey\)\s*\|\|\s*\(canonicalRole\s*===\s*"organizer"\s*&&\s*moduleId\s*===\s*"control-room"\)/,
  );

  assert.match(
    registry,
    /canonicalRole === "organizer" && moduleId === "control-room"[\s\S]*capabilityMode:\s*"permission-aware"[\s\S]*deletion is never exposed/,
  );
});

test("central semantic verifier no longer forces organizer control room unavailable", () => {
  const start = verifier.indexOf(
    "if (entry.role === 'organizer' && entry.moduleId === 'control-room')",
  );

  assert.ok(start >= 0);

  const slice = verifier.slice(start, start + 900);

  assert.doesNotMatch(slice, /status:\s*'unavailable'/);
  assert.doesNotMatch(slice, /authority:\s*'not-implemented'/);

  assert.match(
    slice,
    /capabilities:\s*' read: true, create: true, update: true, delete: false '/,
  );

  assert.match(
    slice,
    /capabilityMode:\s*'permission-aware'/,
  );
});

test("organizer ERP Control Room renders the existing Fight Live list inside its shell", () => {
  assert.match(
    navigation,
    /id:\s*'control-room'[\s\S]*?tab\('live',\s*'Direct'\)[\s\S]*?live:\s*true/,
  );

  assert.match(
    prototype,
    /FightLiveListFeature/,
  );

  assert.match(
    prototype,
    /activeModule\.id ===\s*"control-room"[\s\S]*?<FightLiveListFeature[\s\S]*?mode="organizer"/,
  );

  assert.doesNotMatch(
    prototype,
    /controlRoomMock/,
  );

  assert.doesNotMatch(
    prototype,
    /ControlRoomDashboard/,
  );
});

test("Fight Live still exposes organizer-manager operational authority", () => {
  assert.match(
    access,
    /organizer-manager/,
  );

  assert.match(
    shell,
    /organizer:\s*\[[^\]]*"overview"[^\]]*"setup"[^\]]*"officials"[^\]]*"control"[^\]]*"statistics"[^\]]*"result"[^\]]*\]/,
  );
});

test("Organizer Fight Live routes resolve to Control Room in the ERP shell", () => {
  assert.match(
    routeIntegration,
    /"fight-live": \{ moduleId: "control-room", tab: "live", preserveRouteContent: true \}/,
  );
});

test("Control Room uses the canonical Fight Live list and workspace path", () => {
  assert.match(listFeature, /useFightLiveList\(listScope\)/);
  assert.match(listFeature, /mode === "organizer"[\s\S]*?"organizer"/);
  assert.match(workspaceFeature, /useFightLiveWorkspace/);
});

test("canonical Fight Live hooks resolve through the Supabase repository factory", () => {
  assert.match(workspaceHook, /createFightLiveFeatureUseCase/);
  assert.match(factory, /new FightLiveSupabaseRepository/);
  assert.match(repository, /fight_live_list_ids/);
});

test("Control Room runtime does not use mock or memory repositories", () => {
  for (const source of [listFeature, workspaceFeature, workspaceHook, factory]) {
    assert.doesNotMatch(source, /Mock|MemoryRepository|setTimeout\s*\(/);
  }
});

test("Organizer Fight Live mutations use canonical permission-aware RPCs", () => {
  for (const rpc of [
    "fight_live_timer_action",
    "fight_live_record_action",
    "fight_live_decide",
    "fight_live_publish_result",
  ]) {
    assert.match(repository, new RegExp(rpc));
  }
  assert.match(access, /organizer-manager/);
});

test("Fight Center no longer competes with Control Room for Fight Live", () => {
  const fightCenterNavigation = navigation
    .split(/\r?\n/u)
    .find((line) => line.includes("{ id: 'fight-center'")) ?? "";
  assert.match(fightCenterNavigation, /id: 'fight-center'/);
  assert.doesNotMatch(fightCenterNavigation, /tab\('fight-live'/);
  assert.doesNotMatch(fightCenter, /case "fight-live"/);
});
