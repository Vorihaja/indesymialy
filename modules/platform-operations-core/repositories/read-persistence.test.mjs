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
        const candidate = new URL(
          `${specifier}.ts`,
          context.parentURL,
        );

        if (existsSync(candidate)) {
          return nextResolve(candidate.href, context);
        }
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
] = await Promise.all([
  import("./operations-memory.repository.ts"),
  import("./operations-supabase.repository.ts"),
  import("../../professional-core/repositories/professional-memory.repository.ts"),
  import("../../professional-core/repositories/professional-supabase.repository.ts"),
  import("../../sport-development-core/repositories/sport-memory.repository.ts"),
  import("../../sport-development-core/repositories/sport-supabase.repository.ts"),
]);

const announcements = {
  domain: "platform-announcements",
  admin: true,
};

function operationsReadClient(result) {
  return {
    from(table) {
      assert.equal(table, "breaking_news");

      return {
        select() {
          return {
            order: async () => result,
          };
        },
      };
    },
  };
}

function professionalReadClient(result) {
  return {
    from(table) {
      assert.equal(table, "contracts");

      return {
        select: async () => result,
      };
    },
  };
}

function sportReadClient(result) {
  return {
    from(table) {
      assert.equal(table, "attendances");

      return {
        select() {
          return {
            order: async () => result,
          };
        },
      };
    },
  };
}

test(
  "une erreur de lecture distante ne retombe jamais sur les repositories mémoire",
  async () => {
    let operationsMemoryReads = 0;
    let professionalMemoryReads = 0;
    let sportMemoryReads = 0;

    const originalOperationsList =
      OperationsMemoryRepository.prototype.list;

    const originalProfessionalList =
      ProfessionalMemoryRepository.prototype.list;

    const originalSportList =
      SportMemoryRepository.prototype.list;

    OperationsMemoryRepository.prototype.list =
      async function (...args) {
        operationsMemoryReads += 1;
        return originalOperationsList.apply(this, args);
      };

    ProfessionalMemoryRepository.prototype.list =
      async function (...args) {
        professionalMemoryReads += 1;
        return originalProfessionalList.apply(this, args);
      };

    SportMemoryRepository.prototype.list =
      async function (...args) {
        sportMemoryReads += 1;
        return originalSportList.apply(this, args);
      };

    try {
      const offlineClient = {
        from() {
          throw new Error("offline");
        },
      };

      const operations =
        new OperationsSupabaseRepository(offlineClient);

      const professional =
        new ProfessionalSupabaseRepository(offlineClient);

      const sport =
        new SportSupabaseRepository(offlineClient);

      await assert.rejects(
        operations.list(announcements),
      );

      await assert.rejects(
        professional.list({
          domain: "contracts",
          role: "fighter",
        }),
      );

      await assert.rejects(
        sport.list({
          domain: "athlete-attendance",
          role: "coach",
        }),
      );

      assert.equal(operationsMemoryReads, 0);
      assert.equal(professionalMemoryReads, 0);
      assert.equal(sportMemoryReads, 0);
    } finally {
      OperationsMemoryRepository.prototype.list =
        originalOperationsList;

      ProfessionalMemoryRepository.prototype.list =
        originalProfessionalList;

      SportMemoryRepository.prototype.list =
        originalSportList;
    }
  },
);

test(
  "une lecture distante réussie retourne uniquement les données persistées",
  async () => {
    const operations =
      new OperationsSupabaseRepository(
        operationsReadClient({
          data: [
            {
              id: "announcement-db-1",
              text: "Annonce persistée",
              created_at: "2026-09-21T10:00:00.000Z",
            },
          ],
          error: null,
        }),
      );

    const professional =
      new ProfessionalSupabaseRepository(
        professionalReadClient({
          data: [
            {
              id: "contract-db-1",
              type: "fighter",
              status: "En cours",
              amount: 500000,
              start_date: "2026-09-01",
              end_date: "2027-09-01",
              beneficiary: "profile-db-1",
              ref: "CTR-DB-1",
              details: "Persisté",
              created_at: "2026-09-21T10:00:00.000Z",
            },
          ],
          error: null,
        }),
      );

    const sport =
      new SportSupabaseRepository(
        sportReadClient({
          data: [
            {
              id: "attendance-db-1",
              discipline: "MMA",
              session_date: "2026-09-21",
              session_time: "18:00",
              status: "present",
              check_in_at: "17:55",
              check_out_at: "19:30",
              notes: "Persisté",
              created_at: "2026-09-21T10:00:00.000Z",
            },
          ],
          error: null,
        }),
      );

    const operationRows =
      await operations.list(announcements);

    const professionalRows =
      await professional.list({
        domain: "contracts",
        role: "fighter",
      });

    const sportRows =
      await sport.list({
        domain: "athlete-attendance",
        role: "coach",
      });

    assert.deepEqual(
      operationRows.map((row) => row.id),
      ["announcement-db-1"],
    );

    assert.deepEqual(
      professionalRows.map((row) => row.id),
      ["contract-db-1"],
    );

    assert.deepEqual(
      sportRows.map((row) => row.id),
      ["attendance-db-1"],
    );

    assert.equal(
      operationRows.some(
        (row) => row.id === "announcement-1",
      ),
      false,
    );

    assert.equal(
      professionalRows.some(
        (row) => row.id === "con-1",
      ),
      false,
    );

    assert.equal(
      sportRows.some(
        (row) => row.id === "attendance-1",
      ),
      false,
    );
  },
);

test(
  "une source persistante vide reste vide",
  async () => {
    const operations =
      new OperationsSupabaseRepository(
        operationsReadClient({
          data: [],
          error: null,
        }),
      );

    const professional =
      new ProfessionalSupabaseRepository(
        professionalReadClient({
          data: [],
          error: null,
        }),
      );

    const sport =
      new SportSupabaseRepository(
        sportReadClient({
          data: [],
          error: null,
        }),
      );

    assert.deepEqual(
      await operations.list(announcements),
      [],
    );

    assert.deepEqual(
      await professional.list({
        domain: "contracts",
        role: "fighter",
      }),
      [],
    );

    assert.deepEqual(
      await sport.list({
        domain: "athlete-attendance",
        role: "coach",
      }),
      [],
    );
  },
);

test(
  "les lectures sans autorité persistante échouent explicitement",
  async () => {
    const forbiddenClient = {
      from() {
        assert.fail(
          "Supabase ne doit pas être appelé pour une lecture sans autorité.",
        );
      },
    };

    const operations =
      new OperationsSupabaseRepository(forbiddenClient);

    const professional =
      new ProfessionalSupabaseRepository(forbiddenClient);

    const sport =
      new SportSupabaseRepository(forbiddenClient);

    const reads = [
      operations.list({
        domain: "support",
        admin: false,
      }),

      operations.metrics(),

      operations.settings(),

      professional.list({
        domain: "licenses",
        role: "fighter",
      }),

      professional.finance("fighter"),

      professional.compliance("fighter"),

      sport.list({
        domain: "training",
        role: "coach",
      }),

      sport.metrics({
        domain: "training",
        role: "coach",
      }),

      sport.timeline({
        domain: "training",
        role: "coach",
      }),
    ];

    for (const read of reads) {
      await assert.rejects(
        read,
        (error) =>
          error?.code === "STORAGE_NOT_IMPLEMENTED",
      );
    }
  },
);