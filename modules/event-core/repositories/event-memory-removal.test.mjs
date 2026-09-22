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
  "competitions",
  "event-access-control",
  "event-checklists",
  "event-participants",
  "event-registration",
  "event-reports",
  "event-results",
  "event-sponsors",
  "event-staff",
  "events",
  "fight-card",
  "ticketing",
];

const legacyLayers = [
  "repositories/index.ts",
  "services/index.ts",
  "use-cases/index.ts",
  "factories/index.ts",
];

test(
  "Event legacy memory subsystem stays removed while Supabase authority remains",
  () => {
    assert.equal(
      existsSync(
        path.join(
          projectRoot,
          "modules/event-core/repositories/event-" +
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
        "modules/event-core/index.ts",
      );

    assert.doesNotMatch(
      coreBarrel,
      /event-memory\.repository/,
    );

    assert.match(
      coreBarrel,
      /event-platform\.repository/,
    );

    assert.match(
      coreBarrel,
      /event-supabase\.repository/,
    );

    assert.match(
      coreBarrel,
      /event-platform\.factory/,
    );

    const factory =
      read(
        "modules/event-core/factories/event-platform.factory.ts",
      );

    assert.match(
      factory,
      /EventSupabaseRepository/,
    );

    assert.match(
      factory,
      /createSupabaseBrowserClient/,
    );

    assert.doesNotMatch(
      factory,
      /EventMemoryRepository/,
    );

    const repository =
      read(
        "modules/event-core/repositories/event-supabase.repository.ts",
      );

    assert.match(
      repository,
      /\.from\s*\(["'][A-Za-z0-9_]+["']\)/,
    );
  },
);
