import assert from "node:assert/strict";
import {
  existsSync,
  readFileSync,
} from "node:fs";
import path from "node:path";
import {
  fileURLToPath,
} from "node:url";
import test from "node:test";

const projectRoot =
  fileURLToPath(
    new URL(
      "../../../",
      import.meta.url,
    ),
  );

const read = (relativePath) =>
  readFileSync(
    path.join(
      projectRoot,
      relativePath,
    ),
    "utf8",
  );

const legacyModules = [
  "account",
  "onboarding",
  "organizations",
  "profile-management",
  "role-requests",
  "security",
];

const legacyLayers = [
  "repositories/index.ts",
  "services/index.ts",
  "use-cases/index.ts",
  "factories/index.ts",
];

test(
  "Identity legacy memory subsystem stays removed while Supabase remains authoritative",
  () => {
    assert.equal(
      existsSync(
        path.join(
          projectRoot,
          "modules/identity-core/repositories/identity-" +
            "memory.repository.ts",
        ),
      ),
      false,
    );

    for (
      const moduleName
      of legacyModules
    ) {
      for (
        const layer
        of legacyLayers
      ) {
        assert.equal(
          existsSync(
            path.join(
              projectRoot,
              "modules",
              moduleName,
              layer,
            ),
          ),
          false,
          `${moduleName}/${layer} must remain removed`,
        );
      }

      const barrel =
        read(
          `modules/${moduleName}/index.ts`,
        );

      assert.doesNotMatch(
        barrel,
        /export\s*\*\s*from\s*["']\.\/repositories["']/,
      );

      assert.doesNotMatch(
        barrel,
        /export\s*\*\s*from\s*["']\.\/services["']/,
      );

      assert.doesNotMatch(
        barrel,
        /export\s*\*\s*from\s*["']\.\/use-cases["']/,
      );

      assert.doesNotMatch(
        barrel,
        /export\s*\*\s*from\s*["']\.\/factories["']/,
      );
    }

    const coreBarrel =
      read(
        "modules/identity-core/index.ts",
      );

    assert.doesNotMatch(
      coreBarrel,
      /identity-memory\.repository/,
    );

    assert.match(
      coreBarrel,
      /identity\.repository/,
    );

    assert.match(
      coreBarrel,
      /identity-supabase\.repository/,
    );

    assert.match(
      coreBarrel,
      /identity\.factory/,
    );

    const factory =
      read(
        "modules/identity-core/factories/identity.factory.ts",
      );

    assert.match(
      factory,
      /IdentitySupabaseRepository/,
    );

    assert.match(
      factory,
      /createSupabaseBrowserClient/,
    );

    assert.doesNotMatch(
      factory,
      /IdentityMemoryRepository/,
    );

    const mutationTest =
      read(
        "modules/platform-operations-core/repositories/mutation-persistence.test.mjs",
      );

    assert.doesNotMatch(
      mutationTest,
      /IdentityMemoryRepository/,
    );

    assert.doesNotMatch(
      mutationTest,
      /identity-memory\.repository/,
    );

    assert.match(
      mutationTest,
      /OperationsMemoryRepository/,
    );

    assert.match(
      mutationTest,
      /ProfessionalMemoryRepository/,
    );

    assert.match(
      mutationTest,
      /SportMemoryRepository/,
    );
  },
);
