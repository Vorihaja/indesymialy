import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (file) => readFileSync(file, "utf8").replace(/\r\n?/g, "\n");
const migration = read(
  "supabase/migrations/20261010200000_organization_events_rls_hardening_v1.sql",
);
const eventPoliciesSource = read("supabase/migrations/202608130200_rls_policies.sql");
const registrationAuthority = read(
  "supabase/migrations/20260923122326_complete_event_registration_authority.sql",
);
const organizerFunctions = read("supabase/migrations/202608060200_organizer_functions.sql");
const eventCoorganization = read(
  "supabase/migrations/202608130230_event_geography_coorganization.sql",
);
const clubMembersAuthority = read(
  "supabase/migrations/20261002090000_club_members_authority_v1.sql",
);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parsePolicy(name, sql) {
  const target = /\bon\s+public\.([a-z_]+)\s+for\s+(select|insert|update|delete|all)\b/i.exec(sql);
  assert.ok(target, `policy ${name} must specify a table and command`);
  const roleMatch = /\bto\s+([a-z_,\s]+?)(?=\s+(?:using|with\s+check)\b)/i.exec(sql);
  assert.ok(roleMatch, `policy ${name} must specify roles`);

  return {
    name,
    table: target[1],
    command: target[2].toLowerCase(),
    roles: roleMatch[1].split(",").map((role) => role.trim().toLowerCase()),
    permissive: !/\bas\s+restrictive\b/i.test(sql),
    using: extractPredicate(sql, "using"),
    withCheck: extractPredicate(sql, "with check"),
    sql,
  };
}

function extractPoliciesForTable(source, table) {
  return [...source.matchAll(/create\s+policy\b[\s\S]*?;/gi)]
    .map((match) => {
      const name = /\bcreate\s+policy\s+"?([a-z_ ]+?)"?\s+on\s+public\./i.exec(match[0])?.[1];
      assert.ok(name, "policy declaration must have a name");
      return parsePolicy(name.trim(), match[0]);
    })
    .filter((policy) => policy.table === table);
}

function extractPredicate(sql, keyword) {
  const start = new RegExp(`\\b${keyword.replace(" ", "\\s+")}\\s*\\(`, "i").exec(sql);
  if (!start) return null;
  const open = sql.indexOf("(", start.index);
  let depth = 0;
  for (let index = open; index < sql.length; index += 1) {
    if (sql[index] === "(") depth += 1;
    if (sql[index] === ")") {
      depth -= 1;
      if (depth === 0) return sql.slice(open + 1, index).trim();
    }
  }
  throw new Error(`unbalanced ${keyword} predicate`);
}

function extractFunction(source, name) {
  const declaration = new RegExp(
    `create\\s+or\\s+replace\\s+function\\s+public\\.${escapeRegExp(name)}\\s*\\(`,
    "i",
  ).exec(source);
  assert.ok(declaration, `function ${name} must exist`);
  const sql = source.slice(declaration.index).match(/create\s+or\s+replace\s+function[\s\S]*?\$\$;/i)?.[0];
  assert.ok(sql, `function ${name} must have a complete definition`);
  return sql;
}

function normalizeSql(value) {
  return value?.toLowerCase().replace(/\s+/g, "").replace(/[()]/g, "") ?? null;
}

const memberPolicies = extractPoliciesForTable(migration, "organization_members");
const eventPolicies = [
  ...extractPoliciesForTable(eventPoliciesSource, "events"),
  ...extractPoliciesForTable(registrationAuthority, "events"),
];

const allPolicies = [...memberPolicies, ...eventPolicies];
const actions = ["select", "insert", "update", "delete"];
const tablePrivileges = {
  organization_members: {
    anon: new Set(),
    authenticated: new Set(["select", "insert", "update", "delete"]),
    service_role: new Set(actions),
  },
  events: {
    anon: new Set(["select"]),
    authenticated: new Set(actions),
    service_role: new Set(actions),
  },
};

const activeMemberFunction = extractFunction(migration, "is_organization_member");
const organizationManagerFunction = extractFunction(
  organizerFunctions,
  "can_manage_organization",
);
const eventManagerFunction = extractFunction(eventCoorganization, "can_manage_event");
const applicantFunction = extractFunction(
  registrationAuthority,
  "is_event_registration_applicant",
);

function isActiveOrganizationMember(userId, organizationId, memberships) {
  return Boolean(userId) && memberships.some((membership) =>
    membership.profileId === userId
    && membership.organizationId === organizationId
    && membership.status === "active",
  );
}

function canManageOrganization(context, organizationId) {
  return context.platformAdmin
    || context.ownedOrganizations?.includes(organizationId)
    || (context.memberships ?? []).some((membership) =>
      membership.profileId === context.userId
      && membership.organizationId === organizationId
      && ["owner", "admin", "manager", "organizer"].includes(membership.role)
      && (membership.status ?? "active") === "active",
    );
}

function canManageEvent(context, event) {
  return context.platformAdmin
    || canManageOrganization(context, event.organizerId)
    || (context.coorganizers ?? []).some((coorganizer) =>
      coorganizer.eventId === event.id
      && coorganizer.status === "accepted"
      && canManageOrganization(context, coorganizer.organizationId),
    );
}

function allowsPolicy(policy, context) {
  const row = context.row ?? {};
  switch (policy.name) {
    case "organization_members_select_scoped":
      return row.profileId === context.userId
        || isActiveOrganizationMember(context.userId, row.organizationId, context.memberships ?? [])
        || canManageOrganization(context, row.organizationId);
    case "organization_members_insert_managers":
    case "organization_members_delete_managers":
      return canManageOrganization(context, row.organizationId);
    case "organization_members_update_managers":
      return canManageOrganization(context, row.organizationId)
        && canManageOrganization(context, (context.newRow ?? row).organizationId);
    case "events_public_published_read":
      return row.visibility === "public"
        && row.publishedAt !== null
        && row.publishedAt !== undefined
        && row.archivedAt === null;
    case "events_organizer_read":
    case "events_organizer_delete":
      return canManageEvent(context, row);
    case "events_organizer_insert":
      return Boolean(row.organizerId)
        && canManageOrganization(context, row.organizerId);
    case "events_organizer_update":
      return canManageEvent(context, row)
        && canManageOrganization(context, (context.newRow ?? row).organizerId);
    case "events_registration_applicant_read":
      return context.applicantEventIds?.includes(row.id) ?? false;
    default:
      throw new Error(`no evaluator for final policy ${policy.name}`);
  }
}

function policyApplies(policy, role, action) {
  return (policy.roles.includes(role) || policy.roles.includes("public"))
    && (policy.command === "all" || policy.command === action);
}

function effectiveAccess(table, role, action, context = {}) {
  if (role === "service_role") return true;
  if (!tablePrivileges[table][role]?.has(action)) return false;

  const applicable = allPolicies.filter((policy) =>
    policy.table === table && policyApplies(policy, role, action),
  );
  const permissive = applicable.filter((policy) => policy.permissive);
  const restrictive = applicable.filter((policy) => !policy.permissive);

  return permissive.some((policy) => allowsPolicy(policy, context))
    && restrictive.every((policy) => allowsPolicy(policy, context));
}

function assertPredicate(policy, kind, expected) {
  assert.equal(
    normalizeSql(policy[kind]),
    normalizeSql(expected),
    `${policy.name} ${kind} must match the modeled predicate`,
  );
}

function assertGrant(privilege, object, roles) {
  const grant = new RegExp(
    `grant\\s+${privilege}\\s+on\\s+${object}\\s+to\\s+${roles}\\s*;`,
    "i",
  );
  assert.match(migration, grant);
}

test("final policy inventory models commands, roles, predicates and permissive OR behavior", () => {
  assert.deepEqual(
    memberPolicies.map(({ name, table, command, roles, permissive }) => ({
      name, table, command, roles, permissive,
    })),
    [
      { name: "organization_members_select_scoped", table: "organization_members", command: "select", roles: ["authenticated"], permissive: true },
      { name: "organization_members_insert_managers", table: "organization_members", command: "insert", roles: ["authenticated"], permissive: true },
      { name: "organization_members_update_managers", table: "organization_members", command: "update", roles: ["authenticated"], permissive: true },
      { name: "organization_members_delete_managers", table: "organization_members", command: "delete", roles: ["authenticated"], permissive: true },
    ],
  );
  assert.deepEqual(
    eventPolicies.map(({ name, table, command, roles, permissive }) => ({
      name, table, command, roles, permissive,
    })),
    [
      { name: "events_public_published_read", table: "events", command: "select", roles: ["anon", "authenticated"], permissive: true },
      { name: "events_organizer_read", table: "events", command: "select", roles: ["authenticated"], permissive: true },
      { name: "events_organizer_insert", table: "events", command: "insert", roles: ["authenticated"], permissive: true },
      { name: "events_organizer_update", table: "events", command: "update", roles: ["authenticated"], permissive: true },
      { name: "events_organizer_delete", table: "events", command: "delete", roles: ["authenticated"], permissive: true },
      { name: "events_registration_applicant_read", table: "events", command: "select", roles: ["authenticated"], permissive: true },
    ],
  );

  assertPredicate(
    memberPolicies[0],
    "using",
    "profile_id = auth.uid() or public.is_organization_member(organization_id) or public.can_manage_organization(organization_id)",
  );
  for (const policy of memberPolicies.slice(1)) {
    assertPredicate(policy, policy.command === "insert" ? "withCheck" : policy.command === "update" ? "using" : "using", "public.can_manage_organization(organization_id)");
    if (policy.command === "update") {
      assertPredicate(policy, "withCheck", "public.can_manage_organization(organization_id)");
    }
  }

  assertPredicate(
    eventPolicies[0],
    "using",
    "visibility = 'public' and published_at is not null and archived_at is null",
  );
  assertPredicate(eventPolicies[1], "using", "public.can_manage_event(id)");
  assertPredicate(
    eventPolicies[2],
    "withCheck",
    "organizer_id is not null and public.can_manage_organization(organizer_id)",
  );
  assertPredicate(eventPolicies[3], "using", "public.can_manage_event(id)");
  assertPredicate(
    eventPolicies[3],
    "withCheck",
    "organizer_id is not null and public.can_manage_organization(organizer_id)",
  );
  assertPredicate(eventPolicies[4], "using", "public.can_manage_event(id)");
  assertPredicate(
    eventPolicies[5],
    "using",
    "public.is_event_registration_applicant(events.id)",
  );

  assert.match(migration, /drop policy if exists "read members"/i);
  assert.match(migration, /drop policy if exists "write members"/i);
  assert.match(migration, /drop policy if exists "read events"/i);
  assert.match(migration, /drop policy if exists "write events"/i);
  assert.equal(allPolicies.some((policy) =>
    policy.using?.trim().toLowerCase() === "true"
    || policy.withCheck?.trim().toLowerCase() === "true",
  ), false);
});

test("organization_members effective policy matrix denies anonymous and cross-organization access", () => {
  const memberships = [
    { profileId: "active-user", organizationId: "org-a", status: "active" },
    { profileId: "inactive-user", organizationId: "org-a", status: "inactive" },
  ];
  const rosterRowA = { profileId: "another-user", organizationId: "org-a" };
  const rosterRowB = { profileId: "another-user", organizationId: "org-b" };

  for (const action of actions) {
    assert.equal(
      effectiveAccess("organization_members", "anon", action, { row: rosterRowA }),
      false,
      `anon ${action} must be denied`,
    );
  }
  assert.equal(
    effectiveAccess("organization_members", "authenticated", "select", {
      userId: "active-user",
      memberships,
      row: rosterRowA,
    }),
    true,
    "an active member can read their organization roster",
  );
  assert.equal(
    effectiveAccess("organization_members", "authenticated", "select", {
      userId: "inactive-user",
      memberships,
      row: rosterRowA,
    }),
    false,
    "INACTIVE_MEMBER_ROSTER_READ_DENIED: inactive membership alone cannot read the roster",
  );
  assert.equal(
    effectiveAccess("organization_members", "authenticated", "select", {
      userId: "inactive-user",
      memberships,
      row: { profileId: "inactive-user", organizationId: "org-a" },
    }),
    true,
    "the self-row exception remains scoped to the user's own membership record",
  );
  assert.equal(
    effectiveAccess("organization_members", "authenticated", "select", {
      userId: "active-user",
      memberships,
      row: rosterRowB,
    }),
    false,
    "membership in organization A does not expose organization B",
  );

  for (const action of ["insert", "update", "delete"]) {
    assert.equal(
      effectiveAccess("organization_members", "authenticated", action, {
        userId: "unauthorized",
        row: { organizationId: "org-b" },
        newRow: { organizationId: "org-b" },
      }),
      false,
      `unauthorized ${action} must be denied`,
    );
    assert.equal(
      effectiveAccess("organization_members", "authenticated", action, {
        userId: "org-owner",
        ownedOrganizations: ["org-b"],
        row: { organizationId: "org-b" },
        newRow: { organizationId: "org-b" },
      }),
      true,
      `authorized owner ${action} must remain allowed`,
    );
    assert.equal(
      effectiveAccess("organization_members", "authenticated", action, {
        userId: "active-manager",
        memberships: [{
          profileId: "active-manager",
          organizationId: "org-b",
          role: "manager",
          status: "active",
        }],
        row: { organizationId: "org-b" },
        newRow: { organizationId: "org-b" },
      }),
      true,
      `active authorized manager ${action} must remain allowed`,
    );
    assert.equal(
      effectiveAccess("organization_members", "authenticated", action, {
        userId: "inactive-manager",
        memberships: [{
          profileId: "inactive-manager",
          organizationId: "org-b",
          role: "manager",
          status: "inactive",
        }],
        row: { organizationId: "org-b" },
        newRow: { organizationId: "org-b" },
      }),
      false,
      `inactive manager without other authority cannot ${action}`,
    );
  }
  assert.equal(
    effectiveAccess("organization_members", "service_role", "delete", {}),
    true,
    "service role bypass/table authority is preserved",
  );
});

test("EVENT_SELECT_POLICY_UNION_EXPECTED with no dangerous permissive OR branch", () => {
  const publicEvent = {
    id: "public",
    visibility: "public",
    publishedAt: "2026-10-01T00:00:00Z",
    archivedAt: null,
    organizerId: "org-a",
  };
  const privateEvent = {
    id: "private",
    visibility: "private",
    publishedAt: "2026-10-01T00:00:00Z",
    archivedAt: null,
    organizerId: "org-a",
  };
  const unpublishedEvent = { ...publicEvent, id: "unpublished", publishedAt: null };
  const archivedEvent = { ...publicEvent, id: "archived", archivedAt: "2026-10-02T00:00:00Z" };

  for (const event of [publicEvent, privateEvent, unpublishedEvent, archivedEvent]) {
    assert.equal(
      effectiveAccess("events", "anon", "select", { row: event }),
      event === publicEvent,
      `anonymous visibility for ${event.id}`,
    );
  }
  for (const action of ["insert", "update", "delete"]) {
    assert.equal(effectiveAccess("events", "anon", action, { row: publicEvent }), false);
  }
  assert.equal(
    effectiveAccess("events", "authenticated", "select", { row: publicEvent }),
    true,
    "authenticated users retain public event reads",
  );
  assert.equal(
    effectiveAccess("events", "authenticated", "select", {
      userId: "outsider",
      row: privateEvent,
    }),
    false,
    "unauthorized users cannot read private events",
  );
  assert.equal(
    effectiveAccess("events", "authenticated", "select", {
      userId: "applicant",
      applicantEventIds: ["private"],
      row: privateEvent,
    }),
    true,
    "the applicant branch of the SELECT policy union remains effective",
  );
  assert.equal(
    effectiveAccess("events", "authenticated", "select", {
      userId: "manager",
      memberships: [{
        profileId: "manager",
        organizationId: "org-a",
        role: "organizer",
        status: "active",
      }],
      row: privateEvent,
    }),
    true,
    "the organizer branch of the SELECT policy union remains effective",
  );

  for (const action of ["insert", "update", "delete"]) {
    const unauthorizedRow = action === "insert"
      ? { ...privateEvent, organizerId: "org-b" }
      : privateEvent;
    assert.equal(
      effectiveAccess("events", "authenticated", action, {
        userId: "outsider",
        row: unauthorizedRow,
        newRow: unauthorizedRow,
      }),
      false,
      `unauthorized authenticated ${action} must be denied`,
    );

    assert.equal(
      effectiveAccess("events", "authenticated", action, {
        userId: "manager",
        memberships: [{
          profileId: "manager",
          organizationId: "org-a",
          role: "organizer",
          status: "active",
        }],
        row: privateEvent,
        newRow: privateEvent,
      }),
      true,
      `authorized organizer ${action} must remain allowed`,
    );
  }
  assert.equal(
    effectiveAccess("events", "service_role", "update", {}),
    true,
    "service role backend authority is preserved",
  );

  const authenticatedSelectPolicies = eventPolicies.filter((policy) =>
    policyApplies(policy, "authenticated", "select"),
  );
  assert.deepEqual(
    authenticatedSelectPolicies.map((policy) => policy.name),
    [
      "events_public_published_read",
      "events_organizer_read",
      "events_registration_applicant_read",
    ],
    "EVENT_SELECT_POLICY_UNION_EXPECTED",
  );
  assert.equal(authenticatedSelectPolicies.length, 3);
  assert.equal(
    authenticatedSelectPolicies.every((policy) => policy.permissive),
    true,
  );
  assert.equal(
    authenticatedSelectPolicies.some((policy) =>
      policy.using?.trim().toLowerCase() === "true"
      || normalizeSql(policy.using) === normalizeSql("true")
    ),
    false,
    "EVENT_SELECT_DANGEROUS_OR_BRANCH_PRESENT must be false",
  );
  assert.equal(authenticatedSelectPolicies.some((policy) =>
    policy.name !== "events_public_published_read"
      && policy.name !== "events_organizer_read"
      && policy.name !== "events_registration_applicant_read",
  ), false);
});

test("authorization helper definition, search path, and EXECUTE ACL are safe", () => {
  assert.match(activeMemberFunction, /security\s+definer/i);
  assert.match(activeMemberFunction, /set\s+search_path\s*=\s*''/i);
  assert.match(activeMemberFunction, /public\.organization_members/i);
  assert.match(activeMemberFunction, /auth\.uid\(\)/i);
  assert.match(activeMemberFunction, /om\.organization_id\s*=\s*target_organization_id/i);
  assert.match(activeMemberFunction, /om\.profile_id\s*=\s*auth\.uid\(\)/i);
  assert.match(activeMemberFunction, /om\.status\s*=\s*'active'/i);
  assert.doesNotMatch(activeMemberFunction, /coalesce\s*\(\s*om\.status/i);

  for (const [name, definition] of [
    ["can_manage_organization", organizationManagerFunction],
    ["can_manage_event", eventManagerFunction],
    ["is_organization_member", activeMemberFunction],
  ]) {
    assert.match(definition, /security\s+definer/i, `${name} stays SECURITY DEFINER`);
    assert.match(definition, /set\s+search_path\s*=\s*''/i, `${name} has empty search_path`);
    assert.match(migration, new RegExp(`revoke all\\s+on function public\\.${name}\\([^)]+\\)\\s+from public, anon;`, "i"));
    assert.match(migration, new RegExp(`grant execute\\s+on function public\\.${name}\\([^)]+\\)\\s+to authenticated, service_role;`, "i"));
  }
  assert.match(applicantFunction, /security\s+definer/i);
  assert.match(applicantFunction, /set\s+search_path\s*=\s*''/i);
  assert.match(organizationManagerFunction, /public\.is_platform_admin\(\)/i);
  assert.match(organizationManagerFunction, /o\.owner_id\s*=\s*auth\.uid\(\)/i);
  assert.match(organizationManagerFunction, /coalesce\s*\(\s*om\.status\s*,\s*'active'\s*\)\s*=\s*'active'/i);
  assert.match(eventManagerFunction, /public\.can_manage_organization\(e\.organizer_id\)/i);
  assert.match(eventManagerFunction, /eco\.event_id\s*=\s*e\.id/i);
  assert.match(eventManagerFunction, /eco\.status\s*=\s*'accepted'/i);
  assert.match(eventManagerFunction, /public\.can_manage_organization\(eco\.organization_id\)/i);
  assert.match(applicantFunction, /er\.event_id\s*=\s*p_event_id/i);
  assert.match(applicantFunction, /er\.applicant_profile_id\s*=\s*auth\.uid\(\)/i);
  assert.match(applicantFunction, /o\.owner_id\s*=\s*auth\.uid\(\)/i);
  assert.match(applicantFunction, /coalesce\s*\(\s*om\.status\s*,\s*'active'\s*\)\s*=\s*'active'/i);
  assert.match(clubMembersAuthority, /public\.is_organization_member\(\s*organization_id\s*\)/i);
  assert.match(clubMembersAuthority, /public\.can_manage_club_membership\(\s*organization_id\s*\)/i);
});

test("grants remove client excess privileges and retain service-role access", () => {
  assert.match(migration, /revoke all privileges\s+on table public\.organization_members\s+from public, anon, authenticated;/i);
  assert.match(migration, /revoke all privileges\s+on table public\.events\s+from public, anon, authenticated;/i);
  assertGrant("select, insert, update, delete", "table public.organization_members", "authenticated");
  assertGrant("select", "table public.events", "anon, authenticated");
  assertGrant("insert, update, delete", "table public.events", "authenticated");
  assertGrant("all privileges", "table public.organization_members, public.events", "service_role");
  assert.match(migration, /begin;/i);
  assert.match(migration, /commit;\s*$/i);
});
