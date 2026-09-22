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
  "Organizer Operations does not restore the dead memory repository",
  () => {
    const memoryFile =
      path.join(
        projectRoot,
        "modules/organizer-operations/repositories/organizer-operations-" +
          "memory.repository.ts",
      );

    assert.equal(
      existsSync(memoryFile),
      false,
    );

    const factory =
      read(
        "modules/organizer-operations/factories/organizer-operations.factory.ts",
      );

    const supabaseRepository =
      read(
        "modules/organizer-operations/repositories/organizer-operations-supabase.repository.ts",
      );

    const contextRepository =
      read(
        "modules/organizer-operations/repositories/organizer-context-supabase.repository.ts",
      );

    assert.match(
      factory,
      /supabase/i,
    );

    assert.doesNotMatch(
      factory,
      /OrganizerOperationsMemoryRepository/,
    );

    assert.match(
      supabaseRepository,
      /supabase/i,
    );

    assert.match(
      contextRepository,
      /supabase/i,
    );
  },
);
