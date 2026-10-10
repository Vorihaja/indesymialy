import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const registry =
  fs.readFileSync(
    "modules/erp-dispatch-registry/registry.ts",
    "utf8",
  );

const verifier =
  fs.readFileSync(
    "scripts/verify-erp-dispatch.js",
    "utf8",
  );

const repository =
  fs.readFileSync(
    "modules/admin-users/repositories/index.ts",
    "utf8",
  );

const adminRoute =
  fs.readFileSync(
    "modules/admin/features/AdminRouteFeature.tsx",
    "utf8",
  );

const routeClassification =
  fs.readFileSync(
    "modules/auth/routing/route-classification.ts",
    "utf8",
  );

function listUsersSource() {
  const match =
    repository.match(
      /private\s+async\s+listUsers\s*\(\)\s*:\s*Promise<AdminDomainData>\s*\{([\s\S]*?)\n\s*\}\s*\n\s*private\s+async\s+listRoles/,
    );

  assert.ok(
    match,
    "listUsers must exist",
  );

  return match[1];
}

test(
  "admin users uses explicit platform read-only registry authority",
  () => {
    assert.match(
      registry,
      /makeEntry\("admin",\s*"users",\s*"implemented",\s*"admin-users",\s*"admin-users",\s*"platform",\s*\{\s*read:\s*true,\s*create:\s*false,\s*update:\s*false,\s*delete:\s*false\s*\}\),/,
    );
  },
);

test(
  "admin-users is a confirmed handler",
  () => {
    assert.match(
      registry,
      /["']admin-users["']/,
    );
  },
);

test(
  "super-admin users remains legacy and is not activated",
  () => {
    assert.match(
      registry,
      /makeEntry\("super-admin",\s*"users",\s*"implemented",\s*"generic-erp"/,
    );

    assert.doesNotMatch(
      registry,
      /makeEntry\("super-admin",\s*"users"[\s\S]{0,160}?"admin-users"/,
    );
  },
);

test(
  "central verifier carries admin-users evidence",
  () => {
    assert.match(
      verifier,
      /admin-users/,
    );
  },
);

test(
  "admin users route uses AdminUsersFeature",
  () => {
    assert.match(
      adminRoute,
      /section\s*===\s*"users"/,
    );

    assert.match(
      adminRoute,
      /AdminUsersFeature/,
    );
  },
);

test(
  "listUsers reads the persisted user authorities",
  () => {
    const source =
      listUsersSource();

    assert.match(
      source,
      /\.from\(\s*["']profiles["']\s*\)/,
    );

    assert.match(
      source,
      /\.from\(\s*["']profile_roles["']\s*\)/,
    );

    assert.match(
      source,
      /\.from\(\s*["']roles["']\s*\)/,
    );
  },
);

test(
  "listUsers has no mutation transport",
  () => {
    const source =
      listUsersSource();

    assert.doesNotMatch(
      source,
      /\.insert\(|\.update\(|\.delete\(|\.upsert\(|\.rpc\(|auth\.admin\./,
    );
  },
);

test(
  "listUsers exposes no mutation actions",
  () => {
    const source =
      listUsersSource();

    assert.match(
      source,
      /actions:\s*\[\s*\]/,
    );
  },
);

test(
  "dashboard super-admin stays legacy",
  () => {
    assert.match(
      routeClassification,
      /dashboard\/super-admin/,
    );

    assert.match(
      routeClassification,
      /legacy-super-admin/,
    );
  },
);

test(
  "vh-teck stays canonical super-admin surface",
  () => {
    assert.match(
      routeClassification,
      /vh-teck/,
    );

    assert.match(
      routeClassification,
      /super-admin-private/,
    );
  },
);

test(
  "admin users view permission exists",
  () => {
    const authority =
      fs.readdirSync(
        "supabase/migrations",
      )
        .filter(
          (file) =>
            file.endsWith(".sql"),
        )
        .map(
          (file) =>
            fs.readFileSync(
              `supabase/migrations/${file}`,
              "utf8",
            ),
        )
        .join("\n");

    assert.match(
      authority,
      /admin\.users\.view/,
    );
  },
);

test(
  "generic fallback is removed only from admin users",
  () => {
    assert.doesNotMatch(
      registry,
      /makeEntry\("admin",\s*"users"[\s\S]{0,160}?"generic-erp"/,
    );
  },
);