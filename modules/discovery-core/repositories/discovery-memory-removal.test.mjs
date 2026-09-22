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
  "directory",
  "disciplines",
  "discovery",
  "galleries",
  "global-search",
  "media-library",
  "public-clubs",
  "public-events",
  "public-fighters",
  "rankings",
  "recommendations",
  "regions",
  "trending",
];

const legacyLayerFiles = [
  "repositories/index.ts",
  "services/index.ts",
  "use-cases/index.ts",
  "factories/index.ts",
];

test(
  "Discovery legacy memory subsystem is removed while persistent wiring is preserved",
  () => {
    const memoryFile =
      path.join(
        projectRoot,
        "modules/discovery-core/repositories/discovery-" +
          "memory.repository.ts",
      );

    assert.equal(
      existsSync(memoryFile),
      false,
    );

    for (
      const moduleName
      of legacyModules
    ) {
      for (
        const layerFile
        of legacyLayerFiles
      ) {
        assert.equal(
          existsSync(
            path.join(
              projectRoot,
              "modules",
              moduleName,
              layerFile,
            ),
          ),
          false,
          `${moduleName}/${layerFile} must remain removed`,
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
        "modules/discovery-core/index.ts",
      );

    assert.doesNotMatch(
      coreBarrel,
      /discovery-memory\.repository/,
    );

    assert.match(
      coreBarrel,
      /repositories\/discovery\.repository/,
    );

    assert.match(
      coreBarrel,
      /factories\/discovery\.factory/,
    );

    assert.match(
      coreBarrel,
      /hooks\/useDiscovery/,
    );

    const discoveryFactory =
      read(
        "modules/discovery-core/factories/discovery.factory.ts",
      );

    assert.match(
      discoveryFactory,
      /DiscoverySupabaseRepository/,
    );

    assert.match(
      discoveryFactory,
      /createSupabaseBrowserClient/,
    );

    assert.doesNotMatch(
      discoveryFactory,
      /DiscoveryMemoryRepository/,
    );

    const disciplineBarrel =
      read(
        "modules/disciplines/index.ts",
      );

    assert.match(
      disciplineBarrel,
      /types\/options/,
    );

    assert.match(
      disciplineBarrel,
      /hooks\/useDisciplineOptions/,
    );

    assert.match(
      disciplineBarrel,
      /components\/DisciplineSelect/,
    );

    const disciplineRepository =
      read(
        "modules/disciplines/repositories/discipline-options.repository.ts",
      );

    assert.match(
      disciplineRepository,
      /\.from\(["']disciplines["']\)/,
    );

    const disciplineFactory =
      read(
        "modules/disciplines/factories/discipline-options.factory.ts",
      );

    assert.match(
      disciplineFactory,
      /createSupabaseBrowserClient/,
    );
  },
);
