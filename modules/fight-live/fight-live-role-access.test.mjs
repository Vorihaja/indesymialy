import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

const roles = [
  "admin", "club", "coach", "fan", "federation",
  "league", "official", "seller", "sponsor", "super-admin",
];
const viewerRoles = ["club", "coach", "fan", "federation", "league", "seller", "sponsor"];

test("role capabilities execute with least privilege", async () => {
  const {
    resolveFightLiveCapabilities,
    resolveRoleLiveCapabilities,
  } = await import("./access.ts");

  for (const role of viewerRoles) {
    const capabilities = resolveRoleLiveCapabilities(role);
    assert.equal(capabilities.accessMode, "public-viewer");
    assert.equal(capabilities.canViewPublicLive, true);
    assert.equal(capabilities.canViewOperationalLive, false);
    assert.equal(Object.entries(capabilities).some(([key, value]) => key.startsWith("can") && key !== "canViewPublicLive" && value === true), false);
  }

  for (const role of ["admin", "super-admin"]) {
    const capabilities = resolveRoleLiveCapabilities(role);
    assert.equal(capabilities.accessMode, "platform-manager");
    assert.equal(capabilities.canDecideFight, true);
    assert.equal(capabilities.canPublishResult, true);
  }

  const unassignedOfficial = resolveFightLiveCapabilities("referee", []);
  assert.equal(unassignedOfficial.canControlTimer, false);
  assert.equal(unassignedOfficial.canRecordOfficialAction, false);

  const referee = resolveFightLiveCapabilities("referee", ["referee"]);
  assert.equal(referee.canControlTimer, true);
  assert.equal(referee.canRecordOfficialAction, true);
  assert.equal(referee.canScoreJudgeCard, false);

  const judge = resolveFightLiveCapabilities("judge", ["judge"]);
  assert.equal(judge.canScoreJudgeCard, true);
  assert.equal(judge.canControlTimer, false);
  assert.equal(judge.canDecideFight, false);

  const participant = resolveFightLiveCapabilities("fighter", []);
  assert.equal(participant.accessMode, "authorized-participant");
  assert.equal(participant.canViewOperationalLive, true);
  assert.equal(participant.canRecordOfficialAction, false);
});

test("all ten role live entries have explicit verified handlers", async () => {
  const registry = await read("modules/erp-dispatch-registry/registry.ts");
  for (const role of roles) {
    const handler = role === "official" ? "fight-live" : "role-live";
    assert.match(
      registry,
      new RegExp(`makeEntry\\("${role}", "live", "implemented", "${handler}"`),
    );
  }
  assert.equal(
    [...registry.matchAll(/makeEntry\("([^"]+)", "live",/g)].length,
    10,
  );
});

test("fan seller and sponsor are public viewers without mutation controls", async () => {
  const access = await read("modules/fight-live/access.ts");
  for (const role of ["fan", "seller", "sponsor"]) {
    assert.match(access, new RegExp(`"${role}"`));
  }
  assert.match(access, /accessMode: "public-viewer"/);
  assert.match(access, /canControlTimer: false/);
  assert.match(access, /canRecordOfficialAction: false/);
  assert.match(access, /canScoreJudgeCard: false/);
  assert.match(access, /canDecideFight: false/);
  assert.match(access, /canPublishResult: false/);
});

test("club coach federation and league gain no powers from their labels", async () => {
  const [access, registry] = await Promise.all([
    read("modules/fight-live/access.ts"),
    read("modules/erp-dispatch-registry/registry.ts"),
  ]);
  for (const role of ["club", "coach", "federation", "league"]) {
    assert.match(registry, new RegExp(`makeEntry\\("${role}", "live", "implemented", "role-live", "fight-live-public", "public", \\{ read: true \\}\\)`));
  }
  assert.match(access, /role === "admin" \|\| role === "super-admin"/);
  assert.doesNotMatch(access, /role === "(?:club|coach|federation|league)"[^\n]*managerCapabilities/);
});

test("admin and super admin follow platform authority through database-backed management", async () => {
  const [access, feature, repository] = await Promise.all([
    read("modules/fight-live/access.ts"),
    read("modules/fight-live/features/RoleLiveFeature.tsx"),
    read("modules/fight-live/repositories/fight-live-supabase.repository.ts"),
  ]);
  assert.match(access, /role === "admin" \|\| role === "super-admin"[\s\S]*managerCapabilities/);
  assert.match(feature, /capabilities\.canViewOperationalLive \? "admin" : "public"/);
  assert.match(feature, /mode="admin"/);
  assert.match(repository, /fight_live_list_ids/);
});

test("official and judge controls remain assignment scoped", async () => {
  const [access, workspace, repository] = await Promise.all([
    read("modules/fight-live/access.ts"),
    read("modules/fight-live/features/FightLiveWorkspaceFeature.tsx"),
    read("modules/fight-live/repositories/fight-live-supabase.repository.ts"),
  ]);
  assert.match(access, /assignedRoles\.some\([\s\S]*"referee" \|\| role === "timekeeper"/);
  assert.match(access, /\["referee", "timekeeper", "doctor", "supervisor"\]/);
  assert.match(access, /assignedRoles\.includes\("judge"\)/);
  assert.match(workspace, /capabilities\.canScoreJudgeCard/);
  assert.match(repository, /requireJudgeAssignment/);
});

test("role live routes stay in their ERP shells and survive reload by URL", async () => {
  const [feature, universal, workspaceTypes, adminRoute, clubRoute] = await Promise.all([
    read("modules/fight-live/features/RoleLiveFeature.tsx"),
    read("modules/universal-erp/components/UniversalErpPrototype.tsx"),
    read("modules/platform-workspaces/types.ts"),
    read("modules/admin/features/AdminRouteFeature.tsx"),
    read("app/dashboard/club/live/page.tsx"),
  ]);
  for (const role of viewerRoles) assert.match(feature, new RegExp(`${role}: "/dashboard/`));
  assert.match(feature, /searchParams\.get\("fightId"\)/);
  assert.match(feature, /encodeURIComponent\(fightId\)/);
  assert.match(universal, /activeModule\.id === "live"[\s\S]*RoleLiveFeature/);
  assert.match(workspaceTypes, /"live"/);
  assert.match(adminRoute, /section === "live"[\s\S]*RoleLiveFeature/);
  assert.match(clubRoute, /WorkspaceSectionPage role="club" section="live"/);
});

test("role live loading error and empty states are explicit", async () => {
  const [list, publicFeature, workspace] = await Promise.all([
    read("modules/fight-live/features/FightLiveListFeature.tsx"),
    read("modules/fight-live/features/PublicFightLiveFeature.tsx"),
    read("modules/fight-live/features/FightLiveWorkspaceFeature.tsx"),
  ]);
  assert.match(list, /if \(loading\)/);
  assert.match(list, /if \(error\)/);
  assert.match(list, /fights\.length === 0/);
  assert.match(publicFeature, /if \(loading\)/);
  assert.match(publicFeature, /if \(error\)/);
  assert.match(workspace, /if \(state\.loading\)/);
  assert.match(workspace, /state\.error/);
});

test("public role live reads only the safe projection and published decisions", async () => {
  const repository = await read("modules/fight-live/repositories/fight-live-supabase.repository.ts");
  const publicMethod = repository.slice(repository.indexOf("async getPublic"), repository.indexOf("async updateTimer"));
  assert.match(publicMethod, /fight_public_projection/);
  assert.doesNotMatch(publicMethod, /\.from\("fights"\)/);
  assert.match(publicMethod, /\.from\("fight_decisions"\)/);
  assert.match(publicMethod, /fight\.status === "published"/);
  assert.doesNotMatch(publicMethod, /\.from\("fights"\)[\s\S]*?\.select\("\*"\)/);
});

test("public realtime subscribes only to readable projection tables", async () => {
  const hook = await read("modules/fight-live/hooks/useFightLiveWorkspace.ts");
  const start = hook.indexOf("const channels = publicOnly");
  const publicBranch = hook.slice(start, hook.indexOf(": judgeScorecardOnly", start));
  assert.match(publicBranch, /subscribeToStatistics/);
  assert.match(publicBranch, /subscribeToStatus/);
  assert.match(publicBranch, /subscribeToResult/);
  assert.doesNotMatch(publicBranch, /subscribeTo(?:FightEvents|Timer|Scores|LiveActions|JudgeCards)/);
});

test("official judge and participant realtime subscriptions remain scoped", async () => {
  const hook = await read("modules/fight-live/hooks/useFightLiveWorkspace.ts");
  const fighterStart = hook.indexOf(': mode === "fighter"');
  const fighterBranch = hook.slice(fighterStart, hook.indexOf(': mode === "referee"', fighterStart));
  const refereeStart = hook.indexOf(': mode === "referee"');
  const refereeBranch = hook.slice(refereeStart, hook.indexOf(": [", refereeStart));

  assert.match(fighterBranch, /subscribeToTimer/);
  assert.match(fighterBranch, /subscribeToLiveActions/);
  assert.doesNotMatch(fighterBranch, /subscribeTo(?:FightEvents|Scores|JudgeCards)/);
  assert.match(refereeBranch, /subscribeToFightEvents/);
  assert.match(refereeBranch, /subscribeToScores/);
  assert.doesNotMatch(refereeBranch, /subscribeToJudgeCards/);
  assert.match(hook, /judgeScorecardOnly[\s\S]*subscribeToJudgeCards/);
});

test("role live uses persistent repositories without fake or memory mutation", async () => {
  const sources = await Promise.all([
    read("modules/fight-live/features/RoleLiveFeature.tsx"),
    read("modules/fight-live/factories/fight-live.factory.ts"),
    read("modules/fight-live/repositories/fight-live-supabase.repository.ts"),
  ]);
  const combined = sources.join("\n");
  assert.match(combined, /FightLiveSupabaseRepository/);
  assert.doesNotMatch(combined, /storageNotImplemented|FightLiveMemoryRepository/);
  assert.doesNotMatch(combined, /coming later|bientôt|prochainement/i);
});
