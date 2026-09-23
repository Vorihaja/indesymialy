import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { EventPlatformService } from "./services/event-platform.service.ts";

const root = new URL("../../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("organizer decisions validate domain requirements before persistence", async () => {
  const decisions = [];
  const repository = {
    decideRegistration: async (id, decision) => decisions.push({ id, decision }),
  };
  const service = new EventPlatformService(repository);

  assert.throws(
    () => service.registration("registration", {
      status: "validated",
      eligibilityStatus: "pending",
    }),
    /éligible/,
  );
  assert.throws(
    () => service.registration("registration", {
      status: "refused",
      eligibilityStatus: "ineligible",
    }),
    /motif/,
  );
  assert.throws(
    () => service.registration("registration", {
      status: "waiting_list",
      eligibilityStatus: "eligible",
      waitlistPosition: 0,
    }),
    /position/,
  );

  await service.registration("registration", {
    status: "validated",
    eligibilityStatus: "eligible",
    paymentStatus: "paid",
  });
  assert.equal(decisions.length, 1);
});

test("Event repository uses the transactional registration RPC", async () => {
  const source = await read("modules/event-core/repositories/event-supabase.repository.ts");
  assert.match(source, /rpc\(\s*['"]review_event_registration['"]/);
  assert.doesNotMatch(source, /storageNotImplemented/);
});

test("Organizer ERP uses the same RPC and current database status values", async () => {
  const source = await read("modules/erp-core/real-data/real-erp-supabase.repository.ts");
  const registrationSection = source.slice(
    source.indexOf("private async eventRegistrations"),
    source.indexOf("private async eventParticipants"),
  );
  assert.match(source, /rpc\("review_event_registration"/);
  assert.doesNotMatch(registrationSection, /value:\s*"approved"/);
  assert.doesNotMatch(registrationSection, /value:\s*"waitlisted"/);
  assert.doesNotMatch(registrationSection, /value:\s*"rejected"/);
  assert.doesNotMatch(registrationSection, /value:\s*"waived"/);
});

test("organizer registration UI exposes review detail and all decisions", async () => {
  const [panel, route, navigation] = await Promise.all([
    read("modules/event-core/components/EventRegistrationPanel.tsx"),
    read("app/dashboard/organisateur/events/[id]/registrations/page.tsx"),
    read("modules/event-core/components/EventViews.tsx"),
  ]);
  assert.match(panel, /Motif de décision/);
  assert.match(panel, /Position sur liste d’attente/);
  assert.match(panel, /Historique persistant/);
  assert.match(panel, /decide\("validated"\)/);
  assert.match(panel, /decide\("waiting_list"\)/);
  assert.match(panel, /decide\("refused"\)/);
  assert.match(route, /section="registrations"/);
  assert.match(navigation, /\["registrations","Inscriptions"\]/);
});

test("registration documents are represented but no fake upload is exposed", async () => {
  const [types, panel] = await Promise.all([
    read("modules/event-core/types.ts"),
    read("modules/event-core/components/EventRegistrationPanel.tsx"),
  ]);
  assert.match(types, /medicalCertificate:boolean/);
  assert.match(types, /documents:string\[\]/);
  assert.doesNotMatch(panel, /type="file"/);
  assert.doesNotMatch(panel, /storage\.from/);
});
