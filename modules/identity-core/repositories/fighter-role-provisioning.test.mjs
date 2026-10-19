import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const migration = fs.readFileSync(
  "supabase/migrations/20261010210000_fighter_role_provisioning_invariant_v1.sql",
  "utf8",
);

const registrationRepository = fs.readFileSync(
  "modules/identity-core/repositories/identity-supabase.repository.ts",
  "utf8",
);

const careerRepository = fs.readFileSync(
  "modules/erp-core/real-data/real-erp-supabase.repository.ts",
  "utf8",
);

const ensureFunction = migration.match(
  /create or replace function public\.ensure_fighter_for_profile\([\s\S]*?\$function\$;/i,
)?.[0];

const roleTriggerFunction = migration.match(
  /create or replace function public\.provision_fighter_for_role_assignment\(\)[\s\S]*?\$function\$;/i,
)?.[0];

const profileTriggerFunction = migration.match(
  /create or replace function public\.provision_fighter_for_profile_activation\(\)[\s\S]*?\$function\$;/i,
)?.[0];

const fighterStatusCheckAllowedValues = new Set([
  "active",
  "inactive",
  "suspended",
  "archived",
]);

const fighterStatusDefault = migration.match(
  /alter table public\.fighters\s+alter column status set default '([^']+)'/i,
)?.[1];

function helperChecksCanonicalRole() {
  return Boolean(
    ensureFunction?.includes("p.status = 'active'") &&
      /from public\.profile_roles pr\s+where pr\.profile_id = p\.id\s+and pr\.role_id = fighter_role_id/i.test(
        ensureFunction,
      ),
  );
}

function provision(state, profileId) {
  const profile = state.profiles.get(profileId);
  if (
    !profile ||
    profile.status !== "active" ||
    !helperChecksCanonicalRole() ||
    !profile.roles.has("fighter")
  ) {
    return;
  }

  if (!state.fighters.has(profileId)) {
    state.fighters.set(profileId, {
      profile_id: profileId,
      full_name: profile.fullName,
      status: "active",
      wins: 0,
      losses: 0,
      draws: 0,
      elo_rating: 1000,
      career: profile.existingCareer ?? [],
    });
  }
}

function triggerRoleAssignment(state, profileId, role) {
  if (
    role === "fighter" &&
    /after insert on public\.profile_roles/i.test(migration) &&
    /after update of profile_id, role_id on public\.profile_roles/i.test(
      migration,
    ) &&
    roleTriggerFunction?.includes(
      "perform public.ensure_fighter_for_profile(new.profile_id)",
    )
  ) {
    provision(state, profileId);
  }
}

function makeState(profile) {
  return {
    profiles: new Map(profile ? [[profile.id, profile]] : []),
    fighters: new Map(),
  };
}

test("profiles without the Combattant role do not get a fighter", () => {
  const state = makeState({
    id: "profile-1",
    fullName: "A",
    status: "active",
    primaryRole: "fan",
    roles: new Set(["fan"]),
  });

  provision(state, "profile-1");

  assert.equal(state.fighters.size, 0);
});

test("primary_role_id alone cannot provision a fighter", () => {
  const state = makeState({
    id: "profile-1",
    fullName: "A",
    status: "active",
    primaryRole: "fighter",
    roles: new Set(),
  });

  provision(state, "profile-1");

  assert.equal(state.fighters.size, 0);
  assert.doesNotMatch(
    ensureFunction ?? "",
    /\bp\.primary_role_id\b/i,
  );
});

test("a non-primary Combattant role in profile_roles still provisions a fighter", () => {
  const state = makeState({
    id: "profile-1",
    fullName: "A",
    status: "active",
    primaryRole: "seller",
    roles: new Set(["fighter", "seller"]),
  });

  provision(state, "profile-1");

  assert.equal(state.fighters.size, 1);
  assert.equal(state.fighters.get("profile-1").profile_id, "profile-1");
});

test("an inactive profile is provisioned when it later becomes active", () => {
  const state = makeState({
    id: "profile-1",
    fullName: "A",
    status: "inactive",
    primaryRole: null,
    roles: new Set(["fighter"]),
  });

  provision(state, "profile-1");
  assert.equal(state.fighters.size, 0);

  state.profiles.get("profile-1").status = "active";
  provision(state, "profile-1");

  assert.equal(state.fighters.size, 1);
});

test("assigning the active Combattant role provisions exactly one fighter", () => {
  const state = makeState({
    id: "profile-1",
    fullName: "A",
    status: "active",
    primaryRole: null,
    roles: new Set(),
  });
  state.profiles.get("profile-1").roles.add("fighter");

  triggerRoleAssignment(state, "profile-1", "fighter");

  assert.equal(state.fighters.size, 1);
  assert.equal(state.fighters.get("profile-1").profile_id, "profile-1");
});

test("assigning the same Combattant role again remains idempotent", () => {
  const state = makeState({
    id: "profile-1",
    fullName: "A",
    status: "active",
    primaryRole: "fighter",
    roles: new Set(["fighter"]),
  });

  triggerRoleAssignment(state, "profile-1", "fighter");
  triggerRoleAssignment(state, "profile-1", "fighter");

  assert.equal(state.fighters.size, 1);
});

test("an existing fighter row and its career data are never overwritten", () => {
  const state = makeState({
    id: "profile-1",
    fullName: "Updated profile name",
    status: "active",
    primaryRole: "fighter",
    roles: new Set(["fighter"]),
    existingCareer: ["fight", "elo", "contract"],
  });
  const original = {
    profile_id: "profile-1",
    full_name: "Original fighter name",
    wins: 7,
    losses: 2,
    draws: 1,
    elo_rating: 1420,
    career: ["fight", "elo", "contract"],
  };
  state.fighters.set("profile-1", original);

  triggerRoleAssignment(state, "profile-1", "fighter");

  assert.deepEqual(state.fighters.get("profile-1"), original);
});

test("assigning a non-Combattant role does not provision a fighter", () => {
  const state = makeState({
    id: "profile-1",
    fullName: "A",
    status: "active",
    primaryRole: "seller",
    roles: new Set(["seller"]),
  });

  triggerRoleAssignment(state, "profile-1", "seller");

  assert.equal(state.fighters.size, 0);
});

test("deactivating a profile preserves the existing fighter and its history", () => {
  assert.doesNotMatch(
    migration,
    /create\s+trigger[^;]*delete[^;]*fighters/i,
  );
  assert.match(
    roleTriggerFunction ?? "",
    /return new;/i,
  );
  assert.doesNotMatch(
    roleTriggerFunction ?? "",
    /\bdelete\s+from\s+public\.fighters\b/i,
  );

  const state = makeState({
    id: "profile-1",
    fullName: "A",
    status: "active",
    primaryRole: "fighter",
    roles: new Set(["fighter"]),
  });
  const fighter = {
    id: "fighter-id",
    career: ["fight"],
    eloHistory: ["elo"],
    contracts: ["contract"],
  };
  state.fighters.set("profile-1", fighter);
  state.profiles.get("profile-1").status = "inactive";
  provision(state, "profile-1");

  assert.equal(state.fighters.get("profile-1"), fighter);
  assert.deepEqual(state.fighters.get("profile-1").career, ["fight"]);
  assert.deepEqual(state.fighters.get("profile-1").eloHistory, ["elo"]);
  assert.deepEqual(state.fighters.get("profile-1").contracts, ["contract"]);
});

test("removing the Combattant role preserves the fighter and career history", () => {
  const state = makeState({
    id: "profile-1",
    fullName: "A",
    status: "active",
    primaryRole: "fighter",
    roles: new Set(["fighter"]),
  });
  const fighter = {
    id: "fighter-id",
    career: ["fight"],
    eloHistory: ["elo"],
    contracts: ["contract"],
  };
  state.fighters.set("profile-1", fighter);
  state.profiles.get("profile-1").roles.delete("fighter");
  state.profiles.get("profile-1").primaryRole = null;

  assert.equal(state.fighters.get("profile-1"), fighter);
  assert.deepEqual(state.fighters.get("profile-1").career, ["fight"]);
  assert.deepEqual(state.fighters.get("profile-1").eloHistory, ["elo"]);
  assert.deepEqual(state.fighters.get("profile-1").contracts, ["contract"]);
  assert.doesNotMatch(migration, /\bdelete\s+from\s+public\.fighters\b/i);
});

test("the backfill targets active Combattant profiles without a fighter row", () => {
  const backfill = migration.slice(
    migration.indexOf("for profile_row in"),
    migration.indexOf("loop"),
  );

  assert.match(backfill, /p\.status = 'active'/);
  assert.match(backfill, /r\.slug = 'fighter'/);
  assert.match(backfill, /public\.profile_roles/);
  assert.match(backfill, /not exists\s*\([\s\S]*?public\.fighters/i);
  assert.doesNotMatch(backfill, /primary_role_id/i);
  assert.match(migration, /order by p\.id/i);

  const state = makeState({
    id: "profile-1",
    fullName: "A",
    status: "active",
    primaryRole: null,
    roles: new Set(["fighter"]),
  });
  provision(state, "profile-1");

  assert.equal(state.fighters.size, 1);
});

test("backfill conflict handling preserves existing fighter rows", () => {
  assert.match(
    ensureFunction ?? "",
    /on conflict\s*\(profile_id\)\s*do nothing/i,
  );
  assert.doesNotMatch(
    ensureFunction ?? "",
    /do update/i,
  );

  const state = makeState({
    id: "profile-1",
    fullName: "A",
    status: "active",
    primaryRole: "fighter",
    roles: new Set(["fighter"]),
  });
  const original = { id: "existing-fighter", elo_rating: 1200 };
  state.fighters.set("profile-1", original);
  provision(state, "profile-1");

  assert.equal(state.fighters.size, 1);
  assert.equal(state.fighters.get("profile-1"), original);
});

test("primary role and profile activation transitions use the same helper", () => {
  assert.match(
    migration,
    /after update of primary_role_id, status on public\.profiles/i,
  );
  assert.match(
    profileTriggerFunction ?? "",
    /perform public\.ensure_fighter_for_profile\(new\.id\)/i,
  );
  assert.match(
    profileTriggerFunction ?? "",
    /from public\.profile_roles pr\s+join public\.roles r on r\.id = pr\.role_id[\s\S]*?r\.slug = 'fighter'/i,
  );
  assert.doesNotMatch(
    ensureFunction ?? "",
    /\bp\.primary_role_id\b/i,
  );
});

test("the helper rejects a missing profile rather than silently provisioning", () => {
  assert.match(
    ensureFunction ?? "",
    /if not exists\s*\([\s\S]*?from public\.profiles p[\s\S]*?p\.id = target_profile_id[\s\S]*?\)\s+then\s+raise exception/i,
  );
  assert.match(
    ensureFunction ?? "",
    /errcode = '23503'/i,
  );
});

test("Career resolves fighters by the authenticated profile id", () => {
  const start = careerRepository.indexOf("private async context()");
  const end = careerRepository.indexOf("private async fighterCareer", start);
  const contextMethod = careerRepository.slice(start, end);

  assert.ok(start >= 0 && end > start);
  assert.match(
    contextMethod,
    /\.from\(\s*"fighters"\s*\)[\s\S]*?\.eq\(\s*"profile_id",\s*data\.user\.id\s*\)/,
  );
});

test("registration assigns roles through profile_roles and DB provisioning", () => {
  const start = registrationRepository.indexOf(
    "async completeRegistration(",
  );
  const end = registrationRepository.indexOf(
    "async completePendingRegistration(",
    start,
  );
  const registrationMethod = registrationRepository.slice(start, end);

  assert.ok(start >= 0 && end > start);
  assert.match(
    registrationMethod,
    /assignFlexibleRole\(input\.role,\s*\{\s*makePrimary:\s*true\s*\}\)/,
  );
  assert.match(
    migration,
    /create trigger profile_roles_provision_fighter_insert[\s\S]*?after insert on public\.profile_roles/i,
  );
  assert.match(
    roleTriggerFunction ?? "",
    /where r\.slug = 'fighter'[\s\S]*?if new\.role_id = fighter_role_id/i,
  );
  assert.doesNotMatch(
    registrationMethod,
    /\.from\(\s*"fighters"\s*\)\s*\.insert/i,
  );

  const state = makeState({
    id: "registration-profile",
    fullName: "A",
    status: "active",
    primaryRole: null,
    roles: new Set(),
  });
  state.profiles.get("registration-profile").roles.add("fighter");
  triggerRoleAssignment(state, "registration-profile", "fighter");

  assert.equal(state.fighters.size, 1);
});

test("seller and fan registrations cannot trigger fighter provisioning", () => {
  const start = registrationRepository.indexOf(
    "async completeRegistration(",
  );
  const end = registrationRepository.indexOf(
    "async completePendingRegistration(",
    start,
  );
  const registrationMethod = registrationRepository.slice(start, end);

  assert.match(
    registrationMethod,
    /assignFlexibleRole\(input\.role,\s*\{\s*makePrimary:\s*true\s*\}\)/,
  );
  assert.match(
    roleTriggerFunction ?? "",
    /if new\.role_id = fighter_role_id then/i,
  );
  for (const role of ["seller", "fan"]) {
    const state = makeState({
      id: `profile-${role}`,
      fullName: role,
      status: "active",
      primaryRole: role,
      roles: new Set([role]),
    });
    triggerRoleAssignment(state, `profile-${role}`, role);
    assert.equal(state.fighters.size, 0);
  }
});

test("the invariant guard fails migration if active Combattant profiles remain incomplete", () => {
  assert.match(
    migration,
    /if missing_fighter_count <> 0 then\s+raise exception/i,
  );
  assert.match(
    migration,
    /from public\.fighters f\s+where f\.profile_id = p\.id/i,
  );
});

test("provisioning functions are internal SECURITY DEFINER functions", () => {
  for (const functionSource of [
    ensureFunction,
    roleTriggerFunction,
    profileTriggerFunction,
  ]) {
    assert.match(functionSource ?? "", /security definer/i);
    assert.match(functionSource ?? "", /set search_path = ''/i);
  }
  assert.match(
    migration,
    /revoke all on function public\.ensure_fighter_for_profile\(uuid\)\s+from public, anon, authenticated, service_role/i,
  );
  assert.match(
    migration,
    /revoke all on function public\.provision_fighter_for_role_assignment\(\)\s+from public, anon, authenticated, service_role/i,
  );
  assert.match(
    migration,
    /revoke all on function public\.provision_fighter_for_profile_activation\(\)\s+from public, anon, authenticated, service_role/i,
  );
});

test("only profile identity and lifecycle values are explicitly inserted", () => {
  assert.match(
    ensureFunction ?? "",
    /insert into public\.fighters\(profile_id, full_name, status\)\s+values \(target_profile_id, fighter_full_name, 'active'\)/i,
  );
  assert.match(
    ensureFunction ?? "",
    /select p\.full_name[\s\S]*?from public\.profiles p/i,
  );
  assert.doesNotMatch(
    ensureFunction ?? "",
    /insert into public\.fighters\([^)]*(?:wins|losses|draws|elo_rating|nickname|weight_class|height_cm|current_weight_kg|biography)/i,
  );
});

test("the final fighter status default is allowed by the CHECK constraint", () => {
  assert.equal(fighterStatusDefault, "active");
  assert.ok(
    fighterStatusCheckAllowedValues.has(fighterStatusDefault),
    `status default ${fighterStatusDefault} must be permitted by the CHECK`,
  );
});

test("migration installs provisioning and default before the guarded backfill", () => {
  const order = [
    migration.indexOf("begin;"),
    migration.indexOf(
      "create or replace function public.ensure_fighter_for_profile",
    ),
    migration.indexOf(
      "create or replace function public.provision_fighter_for_role_assignment",
    ),
    migration.indexOf("create trigger profile_roles_provision_fighter_insert"),
    migration.indexOf(
      "revoke all on function public.ensure_fighter_for_profile(uuid)",
    ),
    migration.indexOf(
      "alter column status set default 'active'",
    ),
    migration.indexOf(
      "do $$",
      migration.indexOf("alter column status set default 'active'"),
    ),
    migration.lastIndexOf("commit;"),
  ];

  assert.ok(order.every((position) => position >= 0));
  assert.deepEqual(order, [...order].sort((left, right) => left - right));
  assert.doesNotMatch(
    migration,
    /\b(?:update\s+public\.fighters|delete\s+from\s+public\.fighters)\b/i,
  );
});
