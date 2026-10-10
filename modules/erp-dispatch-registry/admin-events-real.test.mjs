import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const here =
  path.dirname(
    fileURLToPath(
      import.meta.url,
    ),
  );

const root =
  path.resolve(
    here,
    "../..",
  );

function source(file) {
  return fs.readFileSync(
    path.join(
      root,
      file,
    ),
    "utf8",
  );
}

const registry =
  source(
    "modules/erp-dispatch-registry/registry.ts",
  );

const verifier =
  source(
    "scripts/verify-erp-dispatch.js",
  );

const workspace =
  source(
    "modules/platform-workspaces/features/WorkspaceSectionPage.tsx",
  );

const adminPage =
  source(
    "app/dashboard/admin/events/page.tsx",
  );

const adminRoute =
  source(
    "modules/admin/features/AdminRouteFeature.tsx",
  );

const repository =
  source(
    "modules/admin-organizations/repositories/index.ts",
  );

const feature =
  source(
    "modules/admin-organizations/features/index.tsx",
  );

const permissions =
  source(
    "supabase/migrations/20260823115528_super_admin_control_center.sql",
  );

test(
  "admin events registry is explicit and read-only",
  () => {
    assert.match(
      registry,
      /makeEntry\("admin",\s*"events",\s*"implemented",\s*"admin-events",\s*"admin-organizations",\s*"event",\s*\{\s*read:\s*true,\s*create:\s*false,\s*update:\s*false,\s*delete:\s*false\s*\}\)/,
    );
  },
);

test(
  "runtime registry confirms admin-events",
  () => {
    assert.match(
      registry,
      /"admin-events"/,
    );
  },
);

test(
  "central verifier confirms admin event evidence",
  () => {
    assert.match(
      verifier,
      /'admin-events'/,
    );

    assert.match(
      verifier,
      /'admin-events':\s*\[/,
    );

    assert.match(
      verifier,
      /listEvents/,
    );

    assert.match(
      verifier,
      /admin\.events\.view/,
    );
  },
);

test(
  "workspace dispatches admin-events to admin-organizations",
  () => {
    const handler =
      workspace.match(
        /handlerKey === "admin-events"[\s\S]*?\n  \}/,
      );

    assert.ok(
      handler,
    );

    assert.match(
      handler[0],
      /AdminOrganizationsFeature/,
    );

    assert.match(
      handler[0],
      /domain="events"/,
    );

    assert.match(
      handler[0],
      /access="admin"/,
    );

    assert.doesNotMatch(
      handler[0],
      /EventPlatformFeature/,
    );
  },
);

test(
  "explicit admin events page uses read-only admin-organizations surface",
  () => {
    assert.match(
      adminPage,
      /AdminOrganizationsFeature/,
    );

    assert.match(
      adminPage,
      /domain="events"/,
    );

    assert.match(
      adminPage,
      /access="admin"/,
    );

    assert.doesNotMatch(
      adminPage,
      /EventPlatformFeature/,
    );

    assert.doesNotMatch(
      adminPage,
      /detailBasePath/,
    );
  },
);

test(
  "dynamic admin events branch has no detailBasePath",
  () => {
    const eventBranch =
      adminRoute.match(
        /if \(section === "events"\)[^;]+;/,
      );

    assert.ok(
      eventBranch,
    );

    assert.match(
      eventBranch[0],
      /AdminOrganizationsFeature/,
    );

    assert.match(
      eventBranch[0],
      /domain="events"/,
    );

    assert.doesNotMatch(
      eventBranch[0],
      /detailBasePath/,
    );
  },
);

test(
  "organizations clubs and fighters retain their detail routing",
  () => {
    assert.match(
      adminRoute,
      /section === "organizations" \|\| section === "clubs" \|\| section === "fighters"/,
    );

    assert.match(
      adminRoute,
      /detailBasePath=/,
    );
  },
);

test(
  "admin-organizations feature remains the deployed read feature",
  () => {
    assert.match(
      feature,
      /AdminOrganizationsFeature/,
    );

    assert.match(
      feature,
      /useAdminOrganizations\(domain\)/,
    );
  },
);

test(
  "listEvents reads persistent events",
  () => {
    assert.match(
      repository,
      /private async listEvents\(\): Promise<AdminDomainData>/,
    );

    assert.match(
      repository,
      /\.from\("events"\)/,
    );

    assert.match(
      repository,
      /id,title,organizer_id,region_id,event_type,status,visibility,starts_at,published_at,archived_at/,
    );
  },
);

test(
  "admin-organizations repository exposes no mutation transport",
  () => {
    assert.doesNotMatch(
      repository,
      /\.insert\(/,
    );

    assert.doesNotMatch(
      repository,
      /\.update\(/,
    );

    assert.doesNotMatch(
      repository,
      /\.delete\(/,
    );

    assert.doesNotMatch(
      repository,
      /\.upsert\(/,
    );

    assert.doesNotMatch(
      repository,
      /\.rpc\(/,
    );
  },
);

test(
  "admin events view permission exists",
  () => {
    assert.match(
      permissions,
      /'admin\.events\.view'/,
    );
  },
);

test(
  "fan event authority remains separate and preserved",
  () => {
    assert.match(
      registry,
      /makeEntry\("fan",\s*"events",\s*"implemented",\s*"fan-events",\s*"real-erp-supabase",\s*"event"/,
    );
  },
);

test(
  "central verifier guardrails remain intact",
  () => {
    assert.match(
      verifier,
      /entry\.status !== 'implemented' \|\| !confirmedHandlerKeys\.has\(entry\.handlerKey\)/,
    );

    assert.match(
      verifier,
      /implementedWithoutEvidence === 0/,
    );

    assert.match(
      verifier,
      /genericHandlerMarkedImplemented === 0/,
    );
  },
);