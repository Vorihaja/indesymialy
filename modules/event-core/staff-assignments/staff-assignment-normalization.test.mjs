import assert from "node:assert/strict";
import {
  readFileSync,
} from "node:fs";
import {
  dirname,
  resolve,
} from "node:path";
import {
  fileURLToPath,
} from "node:url";
import test from "node:test";

const here =
  dirname(
    fileURLToPath(
      import.meta.url,
    ),
  );

const root =
  resolve(
    here,
    "../../..",
  );

function read(
  relativePath,
) {
  return readFileSync(
    resolve(
      root,
      relativePath,
    ),
    "utf8",
  );
}

const migration = read(
  "supabase/migrations/20260926210000_staff_assignment_response_normalization.sql",
);

const repository = read(
  "modules/event-core/staff-assignments/repositories/staff-assignment-supabase.repository.ts",
);

const service = read(
  "modules/event-core/staff-assignments/services/staff-assignment.service.ts",
);

const useCase = read(
  "modules/event-core/staff-assignments/use-cases/manage-staff-assignments.use-case.ts",
);

const requestSources = read(
  "modules/korana/requests/request-sources.ts",
);

test(
  "staff request listing exposes only profile-linked invited assignments",
  () => {
    assert.match(
      migration,
      /public\.list_my_staff_assignments/,
    );

    assert.match(
      migration,
      /assignment\.profile_id = auth\.uid\(\)/,
    );

    assert.match(
      migration,
      /assignment\.status = 'invited'/,
    );

    assert.doesNotMatch(
      migration,
      /staff_name = auth\.uid/,
    );
  },
);

test(
  "staff response locks the canonical row and verifies the linked recipient",
  () => {
    assert.match(
      migration,
      /public\.respond_staff_assignment/,
    );

    assert.match(
      migration,
      /for update/,
    );

    assert.match(
      migration,
      /v_assignment\.profile_id is null/,
    );

    assert.match(
      migration,
      /v_assignment\.profile_id <> auth\.uid\(\)/,
    );

    assert.match(
      migration,
      /v_assignment\.status <> 'invited'/,
    );
  },
);

test(
  "staff response owns confirm or decline and confirmation timestamp",
  () => {
    assert.match(
      migration,
      /when p_accept then 'confirmed'/,
    );

    assert.match(
      migration,
      /else 'declined'/,
    );

    assert.match(
      migration,
      /when p_accept then now\(\)/,
    );
  },
);

test(
  "staff recipient direct update is removed while read and organizer authority remain untouched",
  () => {
    assert.match(
      migration,
      /drop policy if exists[\s\S]*staff_assignments_self_confirm/,
    );

    assert.doesNotMatch(
      migration,
      /drop policy if exists[\s\S]*staff_assignments_self_read[\s\S]*on[\s\S]*public\.staff_assignments/,
    );

    assert.doesNotMatch(
      migration,
      /drop policy if exists[\s\S]*staff_assignments_organizer_manage[\s\S]*on[\s\S]*public\.staff_assignments/,
    );
  },
);

test(
  "staff assignment repository uses only canonical RPC contracts",
  () => {
    assert.match(
      repository,
      /list_my_staff_assignments/,
    );

    assert.match(
      repository,
      /respond_staff_assignment/,
    );

    assert.doesNotMatch(
      repository,
      /\.from\("staff_assignments"\)/,
    );

    assert.match(
      service,
      /repository\.listActionable/,
    );

    assert.match(
      service,
      /repository\.respond/,
    );

    assert.match(
      useCase,
      /service\.respond/,
    );
  },
);

test(
  "R5J exposes one profile-linked staff request source backed by the canonical authority",
  () => {
    const arrayMatch =
      requestSources.match(
        /export\s+const\s+KORANA_REQUEST_SOURCES[\s\S]*?=\s*\[([\s\S]*?)\];/,
      );

    assert.ok(
      arrayMatch,
    );

    const runtimeBody =
      arrayMatch[1];

    assert.match(
      runtimeBody,
      /id: "staff-assignments"/,
    );

    assert.match(
      runtimeBody,
      /authority: "staff_assignments"/,
    );

    assert.equal(
      (
        runtimeBody.match(
          /id: "staff-assignments"/g,
        ) ?? []
      ).length,
      1,
    );
  },
);