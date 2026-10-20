import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");

const fix = read(
  "supabase/migrations/20261020162000_fights_official_rls_recursion_fix_v1.sql",
);
const fightLiveAuthority = read(
  "supabase/migrations/20260925082825_complete_fight_live_authority.sql",
);
const initialPolicies = read(
  "supabase/migrations/202608130200_rls_policies.sql",
);
const careerRepository = read(
  "modules/erp-core/real-data/real-erp-supabase.repository.ts",
);

function policyBlock(source, name) {
  const start = source.indexOf(`create policy ${name}`);
  const end = source.indexOf(";", start);
  assert.ok(start >= 0, `${name} policy missing`);
  assert.ok(end > start, `${name} policy terminator missing`);
  return source.slice(start, end + 1);
}

function helperBlock() {
  const start = fix.indexOf(
    "create or replace function public.is_assigned_fight_official",
  );
  const end = fix.indexOf("$function$;", start);
  assert.ok(start >= 0 && end > start, "official helper definition missing");
  return fix.slice(start, end + "$function$;".length);
}

function assignmentAllows(userId, fightId, assignments) {
  return (
    userId !== null &&
    assignments.some(
      (assignment) =>
        assignment.userId === userId &&
        assignment.fightId === fightId &&
        ["assigned", "confirmed", "completed"].includes(
          assignment.status ?? "assigned",
        ),
    )
  );
}

function fightReadAllows(principal, fight, assignments) {
  if (principal.kind === "anon") {
    return (
      fight.eventVisibility === "public" &&
      fight.eventPublished &&
      !fight.eventArchived
    );
  }

  return (
    principal.userId === fight.participantUserId ||
    fight.organizerUserIds.includes(principal.userId) ||
    assignmentAllows(principal.userId, fight.id, assignments)
  );
}

function assignmentSelfReadAllows(userId, assignment) {
  return userId !== null && assignment.userId === userId;
}

function assignmentSelfConfirmAllows(userId, assignment, nextStatus) {
  return (
    assignmentSelfReadAllows(userId, assignment) &&
    ["confirmed", "declined"].includes(nextStatus)
  );
}

test("local policies reproduce the reported recursion graph", () => {
  const officialRead = policyBlock(
    fightLiveAuthority,
    "fights_assigned_official_read",
  );
  const organizerAssignments = policyBlock(
    initialPolicies,
    "fight_official_assignments_organizer_manage",
  );

  assert.match(officialRead, /from public\.fight_official_assignments foa/);
  assert.match(officialRead, /foa\.fight_id = fights\.id/);
  assert.match(officialRead, /foa\.user_id = auth\.uid\(\)/);
  assert.match(
    officialRead,
    /coalesce\(foa\.status,\s*'assigned'\)\s*in\s*\('assigned','confirmed','completed'\)/,
  );
  assert.match(organizerAssignments, /from public\.fights f/);
  assert.match(
    organizerAssignments,
    /public\.can_manage_event\(f\.event_id\)/,
  );
});

test("security-definer helper breaks assignment RLS recursion without widening access", () => {
  const helper = helperBlock();

  assert.match(helper, /returns boolean\s+language sql\s+stable/i);
  assert.match(helper, /security definer\s+set search_path = ''/i);
  assert.match(helper, /auth\.uid\(\) is not null/);
  assert.match(helper, /from public\.fight_official_assignments foa/);
  assert.match(helper, /foa\.fight_id = p_fight_id/);
  assert.match(helper, /foa\.user_id = auth\.uid\(\)/);
  assert.match(
    helper,
    /coalesce\(foa\.status,\s*'assigned'\)\s*in\s*\('assigned',\s*'confirmed',\s*'completed'\)/,
  );
  assert.doesNotMatch(helper, /public\.fights/);
  assert.doesNotMatch(helper, /\b(insert|update|delete|truncate)\b/i);
  assert.match(
    fix,
    /alter function public\.is_assigned_fight_official\(uuid\)\s+owner to postgres/i,
  );
  assert.match(
    fix,
    /revoke all on function public\.is_assigned_fight_official\(uuid\)\s+from public,\s*anon/i,
  );
  assert.match(
    fix,
    /grant execute on function public\.is_assigned_fight_official\(uuid\)\s+to authenticated,\s*service_role/i,
  );
});

test("official assignment statuses retain the exact read boundary", () => {
  const fightId = "fight-1";
  const assignments = [
    { userId: "assigned", fightId, status: "assigned" },
    { userId: "confirmed", fightId, status: "confirmed" },
    { userId: "completed", fightId, status: "completed" },
    { userId: "defaulted", fightId, status: null },
    { userId: "declined", fightId, status: "declined" },
    { userId: "cancelled", fightId, status: "cancelled" },
    { userId: "other-fight", fightId: "fight-2", status: "assigned" },
  ];

  for (const user of ["assigned", "confirmed", "completed", "defaulted"]) {
    assert.equal(assignmentAllows(user, fightId, assignments), true, user);
  }
  for (const user of ["declined", "cancelled", "unrelated", null]) {
    assert.equal(assignmentAllows(user, fightId, assignments), false, user);
  }
  assert.equal(assignmentAllows("other-fight", fightId, assignments), false);
});

test("fight and assignment access matrix preserves all existing authorities", () => {
  const fight = {
    id: "private-fight",
    participantUserId: "fighter",
    organizerUserIds: ["organizer"],
    eventVisibility: "private",
    eventPublished: false,
    eventArchived: false,
  };
  const assignments = [
    { userId: "assigned", fightId: fight.id, status: "assigned" },
    { userId: "confirmed", fightId: fight.id, status: "confirmed" },
    { userId: "completed", fightId: fight.id, status: "completed" },
    { userId: "declined", fightId: fight.id, status: "declined" },
    { userId: "cancelled", fightId: fight.id, status: "cancelled" },
  ];
  const auth = (userId) => ({ kind: "authenticated", userId });

  assert.equal(fightReadAllows(auth("fighter"), fight, assignments), true);
  assert.equal(fightReadAllows(auth("outsider"), fight, assignments), false);
  assert.equal(fightReadAllows(auth("assigned"), fight, assignments), true);
  assert.equal(fightReadAllows(auth("confirmed"), fight, assignments), true);
  assert.equal(fightReadAllows(auth("completed"), fight, assignments), true);
  assert.equal(fightReadAllows(auth("declined"), fight, assignments), false);
  assert.equal(fightReadAllows(auth("cancelled"), fight, assignments), false);
  assert.equal(fightReadAllows(auth("organizer"), fight, assignments), true);
  assert.equal(fightReadAllows({ kind: "anon" }, fight, assignments), false);

  const publicFight = {
    ...fight,
    eventVisibility: "public",
    eventPublished: true,
  };
  assert.equal(fightReadAllows({ kind: "anon" }, publicFight, assignments), true);
  assert.equal(
    fightReadAllows(
      { kind: "anon" },
      { ...publicFight, eventArchived: true },
      assignments,
    ),
    false,
  );

  const ownAssignment = assignments[0];
  assert.equal(assignmentSelfReadAllows("assigned", ownAssignment), true);
  assert.equal(assignmentSelfReadAllows("outsider", ownAssignment), false);
  assert.equal(
    assignmentSelfConfirmAllows("assigned", ownAssignment, "confirmed"),
    true,
  );
  assert.equal(
    assignmentSelfConfirmAllows("assigned", ownAssignment, "declined"),
    true,
  );
  assert.equal(
    assignmentSelfConfirmAllows("assigned", ownAssignment, "cancelled"),
    false,
  );
  assert.equal(
    assignmentSelfConfirmAllows("outsider", ownAssignment, "confirmed"),
    false,
  );
});

test("only the recursive official-read policy is replaced", () => {
  assert.deepEqual(
    [...fix.matchAll(/drop policy if exists ([\w]+)/gi)].map((match) => match[1]),
    ["fights_assigned_official_read"],
  );
  const newOfficialRead = policyBlock(fix, "fights_assigned_official_read");
  assert.match(
    newOfficialRead,
    /on public\.fights\s+for select\s+to authenticated\s+using\s*\(public\.is_assigned_fight_official\(id\)\)/i,
  );
  assert.doesNotMatch(fix, /fights_participant_read|fights_organizer_manage|fights_public_safe_read/);
  assert.doesNotMatch(fix, /fight_official_assignments_(?:organizer_manage|self_read|self_confirm)/);
});

test("participant, organizer, public, and assignment policies remain intact", () => {
  const participant = policyBlock(
    fightLiveAuthority,
    "fights_participant_read",
  );
  const organizer = policyBlock(fightLiveAuthority, "fights_organizer_manage");
  const publicSafe = policyBlock(fightLiveAuthority, "fights_public_safe_read");
  const assignmentSelfRead = policyBlock(
    initialPolicies,
    "fight_official_assignments_self_read",
  );
  const assignmentSelfConfirm = policyBlock(
    initialPolicies,
    "fight_official_assignments_self_confirm",
  );
  const assignmentOrganizer = policyBlock(
    initialPolicies,
    "fight_official_assignments_organizer_manage",
  );

  assert.match(participant, /fi\.profile_id = auth\.uid\(\)/);
  assert.match(organizer, /for all to authenticated/);
  assert.match(organizer, /public\.can_manage_event\(event_id\)/);
  assert.match(publicSafe, /for select to anon/);
  assert.match(publicSafe, /e\.visibility = 'public'/);
  assert.match(publicSafe, /e\.published_at is not null/);
  assert.match(publicSafe, /e\.archived_at is null/);
  assert.match(assignmentSelfRead, /user_id = auth\.uid\(\)/);
  assert.match(assignmentSelfConfirm, /for update to authenticated/);
  assert.match(assignmentSelfConfirm, /status in \('confirmed','declined'\)/);
  assert.match(assignmentOrganizer, /public\.can_manage_event\(f\.event_id\)/);
});

test("Fighter Career retains the participant-scoped fights query", () => {
  const start = careerRepository.indexOf("private async fights(");
  const end = careerRepository.indexOf("private async ticketing(", start);
  assert.ok(start >= 0 && end > start, "fights query method missing");
  const method = careerRepository.slice(start, end);

  assert.match(method, /\.from\("fights"\)\.select\("\*"\)\.order\("fight_order"\)/);
  assert.match(
    method,
    /\.or\(`fighter_red_id\.eq\.\$\{context\.fighterId\},fighter_blue_id\.eq\.\$\{context\.fighterId\}`\)/,
  );
  assert.match(
    careerRepository,
    /query\.tab === "path"[\s\S]*?return this\.fights\(/,
  );
});

test("the post-fix RLS graph is acyclic", () => {
  const newOfficialRead = policyBlock(fix, "fights_assigned_official_read");
  const helper = helperBlock();

  assert.match(newOfficialRead, /is_assigned_fight_official/);
  assert.match(helper, /from public\.fight_official_assignments/);
  assert.doesNotMatch(helper, /public\.fights/);
  assert.doesNotMatch(fix, /fight_official_assignments_organizer_manage/);
});
