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

const repository =
  source(
    "modules/erp-core/real-data/real-erp-supabase.repository.ts",
  );

const verifier =
  source(
    "scripts/verify-erp-dispatch.js",
  );

const policies =
  source(
    "supabase/migrations/202608130200_rls_policies.sql",
  );

test(
  "fan events uses explicit read-only handler",
  () => {
    assert.match(
      registry,
      /makeEntry\("fan",\s*"events",\s*"implemented",\s*"fan-events",\s*"real-erp-supabase",\s*"event",\s*\{\s*read:\s*true,\s*create:\s*false,\s*update:\s*false,\s*delete:\s*false\s*\}\)/,
    );
  },
);

test(
  "admin events remains generic and is not activated by this change",
  () => {
    assert.match(
      registry,
      /makeEntry\("admin",\s*"events",\s*"implemented",\s*"generic-erp",\s*"real-erp-supabase",\s*"event"/,
    );

    assert.doesNotMatch(
      registry,
      /makeEntry\("admin",\s*"events"[\s\S]{0,150}?"admin-events"/,
    );
  },
);

test(
  "fan events has an explicit runtime dispatch",
  () => {
    assert.match(
      repository,
      /query\.role === "fan"[\s\S]*?query\.moduleId === "events"[\s\S]*?return this\.fanPublicEvents\(query\);/,
    );
  },
);

test(
  "fan public event projection reads events only",
  () => {
    const method =
      repository.match(
        /private async fanPublicEvents\([\s\S]*?\n  \}\n\n  private async organizationMembers/,
      );

    assert.ok(
      method,
    );

    assert.match(
      method[0],
      /\.from\("events"\)/,
    );
  },
);

test(
  "fan public projection enforces public visibility",
  () => {
    const method =
      repository.match(
        /private async fanPublicEvents\([\s\S]*?\n  \}\n\n  private async organizationMembers/,
      );

    assert.ok(
      method,
    );

    assert.match(
      method[0],
      /\.eq\([\s\S]*?"visibility"[\s\S]*?"public"/,
    );
  },
);

test(
  "fan public projection requires published_at",
  () => {
    const method =
      repository.match(
        /private async fanPublicEvents\([\s\S]*?\n  \}\n\n  private async organizationMembers/,
      );

    assert.ok(
      method,
    );

    assert.match(
      method[0],
      /\.not\([\s\S]*?"published_at"[\s\S]*?"is"[\s\S]*?null/,
    );
  },
);

test(
  "fan public projection excludes archived events",
  () => {
    const method =
      repository.match(
        /private async fanPublicEvents\([\s\S]*?\n  \}\n\n  private async organizationMembers/,
      );

    assert.ok(
      method,
    );

    assert.match(
      method[0],
      /\.is\([\s\S]*?"archived_at"[\s\S]*?null/,
    );
  },
);

test(
  "fan event projection contains no mutation operation",
  () => {
    const method =
      repository.match(
        /private async fanPublicEvents\([\s\S]*?\n  \}\n\n  private async organizationMembers/,
      );

    assert.ok(
      method,
    );

    assert.doesNotMatch(
      method[0],
      /\.insert\(/,
    );

    assert.doesNotMatch(
      method[0],
      /\.update\(/,
    );

    assert.doesNotMatch(
      method[0],
      /\.delete\(/,
    );

    assert.doesNotMatch(
      method[0],
      /\.upsert\(/,
    );

    assert.doesNotMatch(
      method[0],
      /\.rpc\(/,
    );
  },
);

test(
  "database contains public published event policy",
  () => {
    assert.match(
      policies,
      /events_public_published_read/,
    );
  },
);

test(
  "runtime registry confirms fan-events",
  () => {
    assert.match(
      registry,
      /"fan-events"/,
    );
  },
);

test(
  "central verifier confirms fan-events evidence",
  () => {
    assert.match(
      verifier,
      /'fan-events'/,
    );

    assert.match(
      verifier,
      /'fan-events':\s*\[/,
    );

    assert.match(
      verifier,
      /fanPublicEvents/,
    );

    assert.match(
      verifier,
      /events_public_published_read/,
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
