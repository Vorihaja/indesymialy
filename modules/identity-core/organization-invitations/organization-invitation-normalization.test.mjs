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
    fileURLToPath(import.meta.url),
  );

const root =
  resolve(
    here,
    "../../..",
  );

function read(relativePath) {
  return readFileSync(
    resolve(
      root,
      relativePath,
    ),
    "utf8",
  );
}

const migration = read(
  "supabase/migrations/20260926190000_organization_invitation_response_normalization.sql",
);

const repository = read(
  "modules/identity-core/organization-invitations/repositories/organization-invitation-supabase.repository.ts",
);

const service = read(
  "modules/identity-core/organization-invitations/services/organization-invitation.service.ts",
);

const useCase = read(
  "modules/identity-core/organization-invitations/use-cases/manage-organization-invitations.use-case.ts",
);

const requestSources = read(
  "modules/korana/requests/request-sources.ts",
);

test(
  "generic organization invitation response owns the complete decision transition",
  () => {
    assert.match(
      migration,
      /public\.respond_organization_invitation/,
    );

    assert.match(
      migration,
      /security definer/,
    );

    assert.match(
      migration,
      /set search_path = ''/,
    );

    assert.match(
      migration,
      /status <> 'pending'/,
    );

    assert.match(
      migration,
      /expires_at <= now\(\)/,
    );

    assert.match(
      migration,
      /invited_profile_id <> auth\.uid\(\)/,
    );

    assert.match(
      migration,
      /Invitation email does not match this profile/,
    );

    assert.match(
      migration,
      /public\.organization_members/,
    );

    assert.match(
      migration,
      /role = v_invitation\.member_role/,
    );

    assert.match(
      migration,
      /if not found then[\s\S]*insert into[\s\S]*public\.organization_members/,
    );
  },
);

test(
  "organization invitation listing supports profile and email targets without exposing expired requests",
  () => {
    assert.match(
      migration,
      /public\.list_my_organization_invitations/,
    );

    assert.match(
      migration,
      /invitation\.invited_profile_id = auth\.uid\(\)/,
    );

    assert.match(
      migration,
      /lower\(coalesce\(invitation\.invited_email, ''\)\)/,
    );

    assert.match(
      migration,
      /invitation\.status = 'pending'/,
    );

    assert.match(
      migration,
      /invitation\.expires_at > now\(\)/,
    );
  },
);

test(
  "seller response is now a compatibility wrapper over the generic authority",
  () => {
    const wrapperStart =
      migration.indexOf(
        "public.marketplace_respond_seller_personnel_invitation(",
      );

    assert.notEqual(
      wrapperStart,
      -1,
    );

    const wrapper =
      migration.slice(
        wrapperStart,
      );

    assert.match(
      wrapper,
      /public\.respond_organization_invitation/,
    );

    assert.doesNotMatch(
      wrapper,
      /insert into[\s\S]*public\.organization_members/,
    );
  },
);

test(
  "invitee direct status update policy is removed in favor of the canonical response RPC",
  () => {
    assert.match(
      migration,
      /drop policy if exists[\s\S]*organization_invitations_invitee_update/,
    );
  },
);

test(
  "identity organization invitation stack delegates without direct table mutation",
  () => {
    assert.match(
      repository,
      /list_my_organization_invitations/,
    );

    assert.match(
      repository,
      /respond_organization_invitation/,
    );

    assert.doesNotMatch(
      repository,
      /\.from\("organization_invitations"\)/,
    );

    assert.match(
      service,
      /repository\.listPending/,
    );

    assert.match(
      service,
      /repository\.respond/,
    );

    assert.match(
      useCase,
      /service\.listPending/,
    );

    assert.match(
      useCase,
      /service\.respond/,
    );
  },
);

test(
  "R5G exposes organization invitations once while preserving the canonical authority",
  () => {
    const arrayMatch =
      requestSources.match(
        /export\s+const\s+KORANA_REQUEST_SOURCES[\s\S]*?=\s*\[([\s\S]*?)\];/,
      );

    assert.ok(arrayMatch);

    const ids =
      Array.from(
        arrayMatch[1].matchAll(
          /id:\s*"([^"]+)"/g,
        ),
        (match) => match[1],
      );

    assert.deepEqual(
      ids,
      [
        "fight-proposals",
        "sponsor-offers",
        "official-assignments",
        "event-coorganization",
        "organization-invitations",
      ],
    );

    assert.match(
      requestSources,
      /authority: "organization_invitations"/,
    );

    assert.doesNotMatch(
      requestSources,
      /id: "seller-personnel-invitations"/,
    );
  },
);