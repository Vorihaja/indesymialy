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