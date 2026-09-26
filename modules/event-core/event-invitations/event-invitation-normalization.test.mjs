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
  "supabase/migrations/20260926200000_event_invitation_response_normalization.sql",
);

const repository = read(
  "modules/event-core/event-invitations/repositories/event-invitation-supabase.repository.ts",
);

const service = read(
  "modules/event-core/event-invitations/services/event-invitation.service.ts",
);

const useCase = read(
  "modules/event-core/event-invitations/use-cases/manage-event-invitations.use-case.ts",
);

const requestSources = read(
  "modules/korana/requests/request-sources.ts",
);

test(
  "event invitation listing is recipient scoped and supports both legacy open statuses",
  () => {
    assert.match(
      migration,
      /public\.list_my_event_invitations/,
    );

    assert.match(
      migration,
      /invitation\.invitee_profile_id = auth\.uid\(\)/,
    );

    assert.match(
      migration,
      /invitation\.status in \('pending', 'sent'\)/,
    );

    assert.match(
      migration,
      /security definer/,
    );

    assert.match(
      migration,
      /set search_path = ''/,
    );
  },
);

test(
  "event invitation response locks the authority row and verifies the recipient",
  () => {
    assert.match(
      migration,
      /public\.respond_event_invitation/,
    );

    assert.match(
      migration,
      /for update/,
    );

    assert.match(
      migration,
      /v_invitation\.invitee_profile_id <> auth\.uid\(\)/,
    );

    assert.match(
      migration,
      /v_invitation\.status not in \('pending', 'sent'\)/,
    );
  },
);

test(
  "event invitation response owns accepted or declined plus responded_at",
  () => {
    assert.match(
      migration,
      /when p_accept then 'accepted'/,
    );

    assert.match(
      migration,
      /else 'declined'/,
    );

    assert.match(
      migration,
      /responded_at = now\(\)/,
    );
  },
);

test(
  "event invitation repository accesses the authority only through canonical RPCs",
  () => {
    assert.match(
      repository,
      /list_my_event_invitations/,
    );

    assert.match(
      repository,
      /respond_event_invitation/,
    );

    assert.doesNotMatch(
      repository,
      /\.from\("event_invitations"\)/,
    );
  },
);

test(
  "event invitation service and use case preserve layered delegation",
  () => {
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
      /service\.listActionable/,
    );

    assert.match(
      useCase,
      /service\.respond/,
    );
  },
);

test(
  "R5I exposes one event-invitation request source backed by the canonical authority",
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
      /id: "event-invitations"/,
    );

    assert.match(
      runtimeBody,
      /authority: "event_invitations"/,
    );

    assert.equal(
      (
        runtimeBody.match(
          /id: "event-invitations"/g,
        ) ?? []
      ).length,
      1,
    );
  },
);