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

test(
  "Fight Live does not restore the dead memory repository",
  () => {
    const memoryFile =
      path.join(
        projectRoot,
        "modules/fight-live/repositories/fight-live-" +
          "memory.repository.ts",
      );

    assert.equal(
      existsSync(memoryFile),
      false,
    );

    const factory =
      read(
        "modules/fight-live/factories/fight-live.factory.ts",
      );

    const supabaseRepository =
      read(
        "modules/fight-live/repositories/fight-live-supabase.repository.ts",
      );

    assert.match(
      factory,
      /supabase/i,
    );

    assert.doesNotMatch(
      factory,
      /FightLiveMemoryRepository/,
    );

    assert.match(
      supabaseRepository,
      /supabase/i,
    );
  },
);
