import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) =>
  readFileSync(path, "utf8").replace(/\r\n?/g, "\n");

const navigation = read("modules/organizer-erp/config/navigation.ts");
const shell = read("modules/organizer-erp/features/OrganizerErpPrototype.tsx");
const feature = read("modules/organizer-erp/features/OrganizerOverviewFeature.tsx");
const dashboard = read("modules/organizer-erp/components/OverviewDashboard.tsx");
const hook = read("modules/organizer-operations/hooks/useOrganizerOperations.ts");
const factory = read("modules/organizer-operations/factories/organizer-operations.factory.ts");
const hybridRepository = read("modules/organizer-operations/repositories/organizer-operations-hybrid.repository.ts");
const persistentRepository = read("modules/organizer-operations/repositories/organizer-operations-supabase.repository.ts");
const service = read("modules/organizer-operations/services/organizer-operations.service.ts");
const useCase = read("modules/organizer-operations/use-cases/get-organizer-dashboard.use-case.ts");
const registry = read("modules/erp-dispatch-registry/registry.ts");

const overviewNavigation = navigation.match(
  /\{ id: 'overview',[^\n]+/,
)?.[0] ?? "";

const overviewBranch = shell.slice(
  shell.indexOf('activeModule.id ===\n      "overview"'),
  shell.indexOf('activeModule.id ===\n      "calendar"'),
);

test("Organizer Overview remains visible with the honest summary tab", () => {
  assert.match(overviewNavigation, /tab\('summary', 'Synth/);
  assert.doesNotMatch(overviewNavigation, /'alerts'|'activity'|'deadlines'/);
});

test("Organizer Overview registry contract remains implemented and explicit", () => {
  assert.match(
    registry,
    /makeEntry\("organizer", "overview", "implemented", "organizer-overview", "real-erp-supabase", "organization", \{ read: true \}\)/,
  );
});

test("Organizer shell dispatches Overview to the dedicated real feature", () => {
  assert.match(shell, /import \{\s*OrganizerOverviewFeature,\s*\} from "\.\/OrganizerOverviewFeature"/);
  assert.match(overviewBranch, /<OrganizerOverviewFeature/);
  assert.match(overviewBranch, /onNavigate=\{\s*selectModule\s*\}/);
});

test("Organizer Overview reuses the existing dashboard component", () => {
  assert.match(feature, /<OverviewDashboard/);
  assert.match(feature, /snapshot=\{dashboard\.data\}/);
});

test("Organizer Overview loads through canonical hooks", () => {
  assert.match(feature, /useOrganizerDashboard\(\)/);
  assert.match(feature, /useOrganizerSection\('fights'\)/);
  assert.match(hook, /organizerOperations\.dashboard\.execute\(\)/);
});

test("Organizer Overview follows use-case and service boundaries", () => {
  assert.match(factory, /new GetOrganizerDashboardUseCase/);
  assert.match(useCase, /service\.getDashboard\(\)/);
  assert.match(service, /repository\.getDashboard\(\)/);
});

test("Organizer Overview resolves through persistent repositories", () => {
  assert.match(factory, /OrganizerContextSupabaseRepository/);
  assert.match(factory, /OrganizerOperationsSupabaseRepository/);
  assert.match(factory, /OrganizerOperationsHybridRepository/);
  assert.match(hybridRepository, /persistentRepository\.getDashboard/);
  assert.match(persistentRepository, /from\("events"\)/);
});

test("Organizer Overview no longer reaches the generic RealModuleDataView fallback", () => {
  assert.doesNotMatch(overviewBranch, /RealModuleDataView/);
  assert.match(overviewBranch, /OrganizerOverviewFeature/);
});

test("Organizer Overview has no unsupported render path", () => {
  assert.doesNotMatch(overviewBranch, /unsupported|implementationStatus|Module en cours/i);
  assert.doesNotMatch(feature, /unsupported|Module en cours/i);
});

test("Organizer Overview runtime imports no mock or memory repository", () => {
  const runtime = `${feature}\n${dashboard}\n${hook}\n${factory}\n${hybridRepository}`;
  assert.doesNotMatch(runtime, /from ["'][^"']*(?:mock|fixture|demo)[^"']*["']/i);
  assert.doesNotMatch(runtime, /MemoryRepository|memory-repository/i);
});

test("Organizer Overview UI has no direct Supabase access or hard-coded business snapshot", () => {
  const ui = `${feature}\n${dashboard}`;
  assert.doesNotMatch(ui, /createSupabase|supabase\.(?:from|rpc)\s*\(/);
  assert.doesNotMatch(ui, /OrganizerDashboardSnapshot\s*=\s*\{|snapshot\s*=\s*\{\s*(?:events|metrics|alerts):/);
});

test("every visible Overview tab maps to the real composite dashboard", () => {
  assert.equal((overviewNavigation.match(/tab\('/g) ?? []).length, 1);
  assert.match(overviewNavigation, /tab\('summary'/);
  assert.match(dashboard, /snapshot\.metrics/);
  assert.match(dashboard, /snapshot\.events/);
  assert.match(dashboard, /snapshot\.activities/);
});
