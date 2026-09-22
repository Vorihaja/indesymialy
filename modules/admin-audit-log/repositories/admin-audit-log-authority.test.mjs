import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const repository = fs.readFileSync(
  new URL(
    "./index.ts",
    import.meta.url,
  ),
  "utf8",
);

const component = fs.readFileSync(
  new URL(
    "../components/index.tsx",
    import.meta.url,
  ),
  "utf8",
);

const feature = fs.readFileSync(
  new URL(
    "../features/index.tsx",
    import.meta.url,
  ),
  "utf8",
);

const route = fs.readFileSync(
  new URL(
    "../../admin/features/AdminRouteFeature.tsx",
    import.meta.url,
  ),
  "utf8",
);

const detail = fs.readFileSync(
  new URL(
    "../../admin/features/AdminDetailFeature.tsx",
    import.meta.url,
  ),
  "utf8",
);

test(
  "admin audit log no longer depends on AdminMemoryRepository",
  () => {
    assert.doesNotMatch(
      repository,
      /AdminMemoryRepository/,
    );

    assert.doesNotMatch(
      repository,
      /getDomain\(/,
    );
  },
);

test(
  "generic admin audit log explicitly rejects unavailable global authority",
  () => {
    assert.match(
      repository,
      /storageNotImplemented/,
    );

    assert.match(
      repository,
      /Promise\.reject/,
    );

    assert.match(
      repository,
      /lecture globale du journal d'activité Admin/,
    );
  },
);

test(
  "generic audit log does not bypass RLS with a direct table read",
  () => {
    assert.doesNotMatch(
      repository,
      /\.from\(/,
    );

    assert.doesNotMatch(
      repository,
      /admin_access_logs\s*["'`]/,
    );
  },
);

test(
  "generic audit log does not borrow Super Admin access-log RPC",
  () => {
    assert.doesNotMatch(
      repository,
      /\.rpc\(/,
    );

    assert.doesNotMatch(
      repository,
      /super_admin_list_access_logs\s*["'`]/,
    );
  },
);

test(
  "audit log panel and feature cannot manufacture detail links",
  () => {
    assert.doesNotMatch(
      component,
      /detailBasePath/,
    );

    assert.doesNotMatch(
      feature,
      /detailBasePath/,
    );

    assert.match(
      route,
      /<AdminAuditLogFeature access=\{access\} \/>/,
    );

    assert.doesNotMatch(
      route,
      /detailBasePath=\{`\$\{base\}\/audit-log`\}/,
    );
  },
);

test(
  "audit log is removed from fake memory-backed Admin detail",
  () => {
    assert.doesNotMatch(
      detail,
      /"audit-log"/,
    );

    assert.doesNotMatch(
      detail,
      /AdminMemoryDetailFeature/,
    );

    assert.doesNotMatch(
      detail,
      /useAdminDomain/,
    );
  },
);

test(
  "audit repository does not fabricate legacy before-after status fields",
  () => {
    assert.doesNotMatch(
      repository,
      /audit-001/,
    );

    assert.doesNotMatch(
      repository,
      /\bbefore\b\s*:/,
    );

    assert.doesNotMatch(
      repository,
      /\bafter\b\s*:/,
    );

    assert.doesNotMatch(
      repository,
      /\bstatus\b\s*:/,
    );
  },
);