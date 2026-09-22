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

test(
  "admin analytics no longer depends on AdminMemoryRepository",
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
  "admin analytics explicitly rejects unavailable generic authority",
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
      /lecture des Analytics administratives/,
    );
  },
);

test(
  "admin analytics does not perform partial client-side table aggregation",
  () => {
    assert.doesNotMatch(
      repository,
      /\.from\(/,
    );
  },
);

test(
  "admin analytics does not borrow a super admin rpc",
  () => {
    assert.doesNotMatch(
      repository,
      /\.rpc\(/,
    );

    assert.doesNotMatch(
      repository,
      /super_admin_analytics_snapshot\s*["'`]/,
    );

    assert.doesNotMatch(
      repository,
      /super_admin_business_analytics\s*["'`]/,
    );

    assert.doesNotMatch(
      repository,
      /super_admin_marketplace_analytics\s*["'`]/,
    );

    assert.doesNotMatch(
      repository,
      /super_admin_performance_analytics\s*["'`]/,
    );

    assert.doesNotMatch(
      repository,
      /super_admin_system_analytics\s*["'`]/,
    );
  },
);

test(
  "admin analytics contains no synthetic series generation",
  () => {
    assert.doesNotMatch(
      repository,
      /Math\.random/,
    );

    assert.doesNotMatch(
      repository,
      /index\s*\*\s*3/,
    );

    assert.doesNotMatch(
      repository,
      /Croissance utilisateurs/,
    );

    assert.doesNotMatch(
      repository,
      /Activité par rôle/,
    );

    assert.doesNotMatch(
      repository,
      /Revenus préparés/,
    );
  },
);

test(
  "admin analytics does not fabricate filter or export actions",
  () => {
    assert.doesNotMatch(
      repository,
      /["']Filtrer["']/,
    );

    assert.doesNotMatch(
      repository,
      /["']Exporter["']/,
    );
  },
);

test(
  "admin analytics documents the required permission-backed authority",
  () => {
    assert.match(
      repository,
      /admin\.analytics\.view/,
    );

    assert.match(
      repository,
      /is_super_admin\(\)/,
    );

    assert.match(
      repository,
      /VH-TECK/,
    );
  },
);