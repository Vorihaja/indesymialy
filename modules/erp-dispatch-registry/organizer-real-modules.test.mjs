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

const modules = [
  ["ticketing", "organizer-ticketing", "event-ticketing"],
  ["team", "organizer-team", "event-team"],
  ["operations", "organizer-operations", "event-operations"],
  ["partners", "organizer-partners", "event-partners"],
  ["personnel", "organizer-personnel", "event-team"],
];

test("five Organizer modules have explicit real handlers", () => {
  for (const [moduleId, handler, authority] of modules) {
    assert.match(
      registry,
      new RegExp(
        `makeEntry\\("organizer", "${moduleId}", "implemented", "${handler}", "${authority}"`,
      ),
    );

    assert.match(
      registry,
      new RegExp(`"${handler}"`),
    );

    assert.match(
      verifier,
      new RegExp(`'${handler}'`),
    );
  }
});

test("ticketing stable tab ids resolve to canonical data sources", () => {
  assert.match(repository, /key === "invitations"/);
  assert.match(repository, /key === "access-control"/);
  assert.match(repository, /key === "refunds"/);
  assert.match(repository, /\["ticket-types", "quotas"\]\.includes\(key\)/);

  assert.match(repository, /return this\.ticketTypes\(query, context\)/);
  assert.match(repository, /return this\.ticketSales\(query, context\)/);
  assert.match(repository, /return this\.eventInvitations\(query, context\)/);
  assert.match(repository, /return this\.eventAccessLogs\(query, context\)/);
  assert.match(repository, /return this\.ticketRefunds\(query, context\)/);
});

test("Team stable ids resolve without label dispatch", () => {
  assert.match(
    repository,
    /\["referees", "judges", "officials"\]\.includes\(key\)/,
  );

  assert.match(repository, /key === "assignments"/);
  assert.match(repository, /key === "accreditations"/);
  assert.match(repository, /benevole\|volunteer/);
  assert.match(repository, /arbitre\|referee/);
  assert.match(repository, /juge\|judge/);

  assert.match(repository, /return this\.eventStaff\(query, context\)/);
  assert.match(repository, /return this\.eventOfficials\(query, context\)/);
  assert.match(repository, /return this\.fightOfficialAssignments\(query, context\)/);
  assert.match(repository, /return this\.eventAccreditations\(query, context\)/);
});

test("Organizer Operations uses stable ids for mutations", () => {
  assert.match(repository, /logistique\|logistics/);
  assert.match(repository, /securite\|security/);

  assert.match(
    repository,
    /from\("event_operation_records"\)/,
  );

  assert.match(
    repository,
    /case "event_operations"/,
  );
});

test("Organizer Partners has stable-id routing and full CRUD entities", () => {
  for (const id of [
    "deliverables",
    "activations",
    "visibility",
    "packages",
    "contracts",
    "partners",
  ]) {
    assert.match(
      repository,
      new RegExp(`key === "${id}"`),
    );
  }

  for (const entity of [
    "sponsors",
    "sponsor_pipeline",
    "sponsor_packages",
    "sponsor_contracts",
    "sponsor_visibility",
    "sponsor_activations",
    "sponsor_deliverables",
  ]) {
    assert.match(
      repository,
      new RegExp(`case "${entity}"`),
    );
  }
});

test("Organizer Personnel uses canonical staff assignment authority", () => {
  assert.match(
    repository,
    /query\.role === "organizer" && query\.moduleId === "personnel"/,
  );

  assert.match(
    repository,
    /case "staff_assignments"/,
  );

  assert.match(
    repository,
    /from\("staff_assignments"\)/,
  );
});