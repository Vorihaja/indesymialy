import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const read = (relativePath) => readFileSync(resolve(root, relativePath), "utf8");

const wizard = read("modules/organizer-erp/components/EventCreationWizard.tsx");
const repository = read(
  "modules/organizer-erp/real-data/organizer-event-workflow.repository.ts",
);
const v2Migration = read(
  "supabase/migrations/202608130230_event_geography_coorganization.sql",
);
const migration = read(
  "supabase/migrations/20260930104346_event_team_assignment_authority_normalization.sql",
);

const saveFunction = migration.match(
  /create or replace function public\.save_organizer_event_workflow\([\s\S]*?\$function\$;/,
)?.[0];

assert.ok(saveFunction, "effective save workflow must be present in the migration");

test("Team draft carries stable assignment identity and non-null decision state", () => {
  assert.match(wizard, /export type TeamAssignmentDraft = \{[\s\S]*assignmentId\?: string;[\s\S]*profileId\?: string;[\s\S]*name: string;[\s\S]*role: string;[\s\S]*status\?: string;/);
  assert.doesNotMatch(wizard, /status\?: string \| null/);
  assert.match(wizard, /team: TeamAssignmentDraft\[\];/);
});

test("editable Team load normalizes nullable profile and status fields", () => {
  assert.match(repository, /\.from\('staff_assignments'\)[\s\S]*?\.select\('id,profile_id,staff_name,role,status'\)/);
  assert.match(repository, /team: \(staffResult\.data \?\? \[\]\)\.map\(\(item\) => \(\{[\s\S]*assignmentId: item\.id,[\s\S]*profileId: item\.profile_id \?\? '',[\s\S]*status: item\.status \?\? 'invited',/);
});

test("editing a Team person clears profile identity while retaining assignment identity", () => {
  assert.match(wizard, /key=\{item\.assignmentId \?\? index\}/);
  assert.match(wizard, /onChange=\{\(name\) => onChange\(index, \{ name, profileId: undefined \}\)\}/);
  assert.doesNotMatch(wizard, /onChange\(index, \{ name, profileId: undefined, assignmentId: undefined \}\)/);
});

test("runtime remains on v2 and v2 delegates to the effective legacy authority", () => {
  assert.match(repository, /'save_organizer_event_workflow_v2'/);
  assert.match(v2Migration, /v_event_id := public\.save_organizer_event_workflow\(p_event_id,p_payload,p_status\);/);
});

test("Team synchronization updates stable rows and supports an unconsumed stale-client fallback", () => {
  assert.match(saveFunction, /v_item->>'assignmentId'/);
  assert.match(saveFunction, /where assignment\.id = v_staff_assignment_id[\s\S]*for update;/);
  assert.match(saveFunction, /if v_staff_assignment\.event_id <> v_event_id then[\s\S]*autre événement/);
  assert.match(saveFunction, /elsif v_payload_profile_id is not null then[\s\S]*assignment\.event_id = v_event_id[\s\S]*assignment\.profile_id = v_payload_profile_id[\s\S]*assignment\.role = v_staff_role[\s\S]*not \(assignment\.id = any\(v_kept_staff_assignment_ids\)\)/);
  assert.match(saveFunction, /delete from public\.staff_assignments[\s\S]*event_id = v_event_id[\s\S]*not \(id = any\(v_kept_staff_assignment_ids\)\)/);
});

test("unchanged recipient and role preserve every decision field", () => {
  assert.match(saveFunction, /when v_staff_recipient_changed or v_staff_role_changed then 'invited'[\s\S]*else status/);
  assert.match(saveFunction, /when v_staff_recipient_changed or v_staff_role_changed then null[\s\S]*else confirmed_at/);
  assert.match(saveFunction, /when v_staff_recipient_changed or v_staff_role_changed then 'unknown'[\s\S]*else availability_status/);
});

test("recipient or role changes reset decision state and new rows start invited", () => {
  assert.match(saveFunction, /v_staff_assignment\.profile_id is distinct from v_profile_id/);
  assert.match(saveFunction, /v_staff_assignment\.role is distinct from v_staff_role/);
  assert.match(saveFunction, /'invited',[\s\S]*'unknown'[\s\S]*returning id into v_staff_assignment_id/);
});

test("Team event invitations are removed without disturbing fighter creation or officials", () => {
  assert.doesNotMatch(saveFunction, /jsonb_build_object\('_type','team'\)/);
  assert.doesNotMatch(saveFunction, /v_mention, 'team'/);
  assert.match(saveFunction, /jsonb_build_object\('_type','fighter','_role','Combattant'\)/);
  assert.match(saveFunction, /v_mention, 'fighter', 'Combattant'/);
  assert.match(saveFunction, /public\.event_official_assignments/);
  assert.match(saveFunction, /v_kept_official_assignment_ids/);
});

test("event invitation response rejects Team authority and legacy actionable rows are cleaned", () => {
  assert.match(migration, /create or replace function public\.respond_event_invitation/);
  assert.match(migration, /v_invitation\.invitation_type = 'team'[\s\S]*Team invitations must be answered through the staff assignment/);
  assert.match(migration, /delete from public\.event_invitations[\s\S]*invitation_type = 'team'[\s\S]*status in \('pending', 'sent'\)/);
});

test("both SECURITY DEFINER functions retain hardened paths and least-privilege grants", () => {
  assert.equal((migration.match(/security definer\s+set search_path = ''/g) ?? []).length, 2);
  assert.match(migration, /revoke all on function public\.save_organizer_event_workflow\(uuid,jsonb,text\)[\s\S]*from public, anon;[\s\S]*grant execute[\s\S]*to authenticated;/);
  assert.match(migration, /revoke all on function public\.respond_event_invitation\(uuid, boolean\)[\s\S]*from public, anon;[\s\S]*grant execute[\s\S]*to authenticated;/);
});
