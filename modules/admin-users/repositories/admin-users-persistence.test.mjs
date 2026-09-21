import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(
  new URL("./index.ts", import.meta.url),
  "utf8",
);

test(
  "admin-users no longer instantiates AdminMemoryRepository",
  () => {
    assert.doesNotMatch(
      source,
      /AdminMemoryRepository/,
    );

    assert.doesNotMatch(
      source,
      /new\s+\w*MemoryRepository\s*\(/,
    );
  },
);

test(
  "users and roles are read from persisted Supabase tables",
  () => {
    for (const table of [
      "profiles",
      "profile_roles",
      "roles",
    ]) {
      assert.match(
        source,
        new RegExp(
          `\\.from\\(["']${table}["']\\)`,
        ),
      );
    }
  },
);

test(
  "role requests use their persisted authority",
  () => {
    assert.match(
      source,
      /\.from\(["']role_requests["']\)/,
    );

    assert.match(
      source,
      /decision_reason/,
    );

    assert.match(
      source,
      /submitted_at/,
    );
  },
);

test(
  "permissions use the canonical admin permission RPC",
  () => {
    assert.match(
      source,
      /\.rpc\(\s*["']get_my_admin_permissions["']/,
    );
  },
);

test(
  "repository exposes no fake admin records",
  () => {
    for (const fake of [
      "usr-001",
      "Mialy Rakoto",
      "Admin Opérations",
      "Vendeur Demo",
      "role-admin",
      "p-001",
    ]) {
      assert.equal(
        source.includes(fake),
        false,
        `fake admin value remains: ${fake}`,
      );
    }
  },
);

test(
  "repository does not silently convert Supabase failures to empty data",
  () => {
    assert.match(
      source,
      /profilesResult\.error/,
    );

    assert.match(
      source,
      /profileRolesResult\.error/,
    );

    assert.match(
      source,
      /requestsResult\.error/,
    );

    assert.match(
      source,
      /if\s*\(error\)/,
    );
  },
);