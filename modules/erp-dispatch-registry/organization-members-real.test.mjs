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

const repository =
  source(
    "modules/erp-core/real-data/real-erp-supabase.repository.ts",
  );

test(
  "federation members uses explicit read-only organization-members",
  () => {
    assert.match(
      registry,
      /makeEntry\("federation",\s*"members",\s*"implemented",\s*"organization-members",\s*"real-erp-supabase",\s*"organization",\s*\{\s*read:\s*true,\s*create:\s*false,\s*update:\s*false,\s*delete:\s*false\s*\}\)/,
    );
  },
);

test(
  "league members uses explicit read-only organization-members",
  () => {
    assert.match(
      registry,
      /makeEntry\("league",\s*"members",\s*"implemented",\s*"organization-members",\s*"real-erp-supabase",\s*"organization",\s*\{\s*read:\s*true,\s*create:\s*false,\s*update:\s*false,\s*delete:\s*false\s*\}\)/,
    );
  },
);

test(
  "runtime registry confirms organization-members",
  () => {
    assert.match(
      registry,
      /"organization-members"/,
    );
  },
);

test(
  "central verifier confirms organization-members",
  () => {
    assert.match(
      verifier,
      /'organization-members'/,
    );
  },
);

test(
  "central verifier contains explicit evidence",
  () => {
    assert.match(
      verifier,
      /'organization-members':\s*\[/,
    );

    assert.match(
      verifier,
      /organizationMembers/,
    );

    assert.match(
      verifier,
      /organization_members \/ profiles/,
    );
  },
);

test(
  "runtime dispatch explicitly targets federation and league members",
  () => {
    assert.match(
      repository,
      /\["federation", "league"\]\.includes\(query\.role\)[\s\S]*?query\.moduleId === "members"[\s\S]*?return this\.organizationMembers\(query, context\);/,
    );
  },
);

test(
  "organizationMembers uses scoped membership authority",
  () => {
    const method =
      repository.match(
        /private async organizationMembers\([\s\S]*?\n  \}\n\n  private async people/,
      );

    assert.ok(
      method,
    );

    assert.match(
      method[0],
      /\.from\("organization_members"\)/,
    );

    assert.match(
      method[0],
      /\.in\([\s\S]*?"organization_id"[\s\S]*?context\.organizationIds/,
    );
  },
);

test(
  "profile lookup is restricted to membership profile ids",
  () => {
    const method =
      repository.match(
        /private async organizationMembers\([\s\S]*?\n  \}\n\n  private async people/,
      );

    assert.ok(
      method,
    );

    assert.match(
      method[0],
      /profileIds/,
    );

    assert.match(
      method[0],
      /\.from\("profiles"\)/,
    );

    assert.match(
      method[0],
      /\.in\([\s\S]*?"id"[\s\S]*?profileIds/,
    );

    assert.doesNotMatch(
      method[0],
      /email/,
    );
  },
);

test(
  "organization members projection contains no mutations",
  () => {
    const method =
      repository.match(
        /private async organizationMembers\([\s\S]*?\n  \}\n\n  private async people/,
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
      /mutation\(/,
    );
  },
);

test(
  "club members specialized handler remains preserved",
  () => {
    assert.match(
      registry,
      /"club-members"/,
    );

    assert.match(
      verifier,
      /'club-members'/,
    );

    assert.match(
      repository,
      /private async clubMembers\(/,
    );
  },
);

test(
  "organization personnel handler remains preserved",
  () => {
    assert.match(
      registry,
      /"organization-personnel"/,
    );

    assert.match(
      verifier,
      /'organization-personnel'/,
    );
  },
);

test(
  "verifier protection rules remain intact",
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
