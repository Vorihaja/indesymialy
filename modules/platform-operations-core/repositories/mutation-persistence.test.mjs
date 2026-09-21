import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import test from "node:test";

registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (
        error?.code === "ERR_MODULE_NOT_FOUND" &&
        specifier.startsWith(".") &&
        !specifier.endsWith(".ts")
      ) {
        const candidate = new URL(`${specifier}.ts`, context.parentURL);
        if (existsSync(candidate)) return nextResolve(candidate.href, context);
      }
      throw error;
    }
  },
});

const [
  { OperationsMemoryRepository },
  { OperationsSupabaseRepository },
  { ProfessionalMemoryRepository },
  { ProfessionalSupabaseRepository },
  { SportMemoryRepository },
  { SportSupabaseRepository },
  { IdentityMemoryRepository },
] = await Promise.all([
  import("./operations-memory.repository.ts"),
  import("./operations-supabase.repository.ts"),
  import("../../professional-core/repositories/professional-memory.repository.ts"),
  import("../../professional-core/repositories/professional-supabase.repository.ts"),
  import("../../sport-development-core/repositories/sport-memory.repository.ts"),
  import("../../sport-development-core/repositories/sport-supabase.repository.ts"),
  import("../../identity-core/repositories/identity-memory.repository.ts"),
]);

const announcements = { domain: "platform-announcements", admin: true };
const announcementInput = {
  title: "Maintenance confirmée",
  summary: "Résumé",
  content: "Contenu",
};

function announcementClient(result) {
  return {
    from(table) {
      assert.equal(table, "breaking_news");
      return {
        insert(payload) {
          assert.deepEqual(payload, { text: announcementInput.title });
          return {
            select() {
              return { single: async () => result };
            },
          };
        },
      };
    },
  };
}

test("une erreur Supabase rejette la mutation sans appeler le repository mémoire", async () => {
  let memoryCreateCalls = 0;
  const originalCreate = OperationsMemoryRepository.prototype.create;
  OperationsMemoryRepository.prototype.create = async function (...args) {
    memoryCreateCalls += 1;
    return originalCreate.apply(this, args);
  };

  try {
    const repository = new OperationsSupabaseRepository(
      announcementClient({
        data: null,
        error: { code: "42501", message: "permission denied" },
      }),
    );

    await assert.rejects(
      repository.create(announcements, announcementInput),
      (error) => error?.code === "FORBIDDEN",
    );
    assert.equal(memoryCreateCalls, 0);
  } finally {
    OperationsMemoryRepository.prototype.create = originalCreate;
  }
});

test("une mutation Supabase confirmée conserve son résultat", async () => {
  const repository = new OperationsSupabaseRepository(
    announcementClient({
      data: {
        id: "announcement-db-1",
        text: announcementInput.title,
        created_at: "2026-09-21T10:00:00.000Z",
      },
      error: null,
    }),
  );

  const created = await repository.create(announcements, announcementInput);

  assert.equal(created.id, "announcement-db-1");
  assert.equal(created.title, announcementInput.title);
  assert.equal(created.domain, "platform-announcements");
});

test("les mutations sans autorité distante échouent explicitement", async () => {
  const unavailableClient = { from: () => assert.fail("Supabase ne doit pas être appelé") };
  const operations = new OperationsSupabaseRepository(unavailableClient);
  const professional = new ProfessionalSupabaseRepository(unavailableClient);
  const sport = new SportSupabaseRepository(unavailableClient);

  const mutations = [
    operations.create(
      { domain: "support", admin: false },
      { title: "Support", summary: "Résumé", content: "Contenu" },
    ),
    operations.update("operation-1", { title: "Mise à jour" }),
    operations.remove("operation-1"),
    professional.create("contracts", { title: "Contrat", subtitle: "Privé" }),
    professional.update("contract-1", { title: "Mise à jour" }),
    professional.remove("contract-1"),
    sport.create(
      { domain: "training", role: "coach" },
      { title: "Séance", subtitle: "Privée" },
    ),
    sport.update("training-1", { title: "Mise à jour" }),
    sport.remove("training-1"),
  ];

  for (const mutation of mutations) {
    await assert.rejects(mutation, (error) => error?.code === "STORAGE_NOT_IMPLEMENTED");
  }
});

test("les repositories mémoire restent des doubles de test explicites", async () => {
  const operations = new OperationsMemoryRepository();
  const professional = new ProfessionalMemoryRepository();
  const sport = new SportMemoryRepository();
  const identity = new IdentityMemoryRepository();

  assert.equal(
    (await operations.create(
      { domain: "support", admin: false },
      { title: "Test", summary: "Test", content: "Test" },
    )).domain,
    "support",
  );
  assert.equal(
    (await professional.create("contracts", { title: "Test", subtitle: "Test" })).domain,
    "contracts",
  );
  assert.equal(
    (await sport.create(
      { domain: "training", role: "coach" },
      { title: "Test", subtitle: "Test" },
    )).domain,
    "training",
  );
  const snapshot = await identity.snapshot();
  assert.equal((await identity.saveDraft(snapshot.draft)).profile.id, snapshot.draft.profile.id);
});

test("les fallbacks de lecture reportés à C2-B restent inchangés", async () => {
  const offlineClient = { from: () => { throw new Error("offline"); } };
  const operations = new OperationsSupabaseRepository(offlineClient);
  const professional = new ProfessionalSupabaseRepository(offlineClient);
  const sport = new SportSupabaseRepository(offlineClient);

  assert.ok((await operations.list(announcements)).length > 0);
  assert.ok((await professional.list({ domain: "contracts", role: "fighter" })).length > 0);
  assert.ok((await sport.list({ domain: "athlete-attendance", role: "coach" })).length > 0);
});
