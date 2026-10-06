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

const repository =
  source(
    "modules/personnel-erp/repositories/organization-personnel.repository.ts",
  );

const hook =
  source(
    "modules/personnel-erp/hooks/useOrganizationPersonnel.ts",
  );

const component =
  source(
    "modules/personnel-erp/components/PersonnelWorkspace.tsx",
  );

const targetRoles = [
  "admin",
  "club",
  "coach",
  "federation",
  "league",
  "sponsor",
  "super-admin",
];

test(
  "seven organization roles use organization-personnel",
  () => {
    for (const role of targetRoles) {
      assert.match(
        registry,
        new RegExp(
          `makeEntry\\("${role}",\\s*"personnel",\\s*"implemented",\\s*"organization-personnel",\\s*"real-erp-supabase",\\s*"organization",\\s*\\{\\s*read:\\s*true,\\s*create:\\s*false,\\s*update:\\s*false,\\s*delete:\\s*false\\s*\\}\\)`,
        ),
      );
    }
  },
);

test(
  "runtime registry confirms organization-personnel",
  () => {
    assert.match(
      registry,
      /"organization-personnel"/,
    );
  },
);

test(
  "central verifier confirms organization-personnel",
  () => {
    assert.match(
      verifier,
      /'organization-personnel'/,
    );
  },
);

test(
  "central verifier carries explicit evidence",
  () => {
    assert.match(
      verifier,
      /'organization-personnel':\s*\[/,
    );

    assert.match(
      verifier,
      /organization-personnel\.repository\.ts/,
    );

    assert.match(
      verifier,
      /organization_members \/ profiles \/ organizations \/ active_organizations/,
    );
  },
);

test(
  "seller and organizer personnel remain specialized",
  () => {
    assert.match(
      registry,
      /makeEntry\("seller",\s*"personnel",\s*"implemented",\s*"seller-personnel",\s*"seller-personnel",\s*"organization"/,
    );

    assert.match(
      registry,
      /makeEntry\("organizer",\s*"personnel",\s*"implemented",\s*"organizer-personnel",\s*"event-team",\s*"event"/,
    );
  },
);

test(
  "fan personnel remains unavailable",
  () => {
    assert.match(
      registry,
      /makeEntry\("fan",\s*"personnel",\s*"unavailable",\s*"unavailable",\s*"not-implemented",\s*"none"/,
    );
  },
);

test(
  "workspace dispatch is explicit",
  () => {
    assert.match(
      workspace,
      /handlerKey === "organization-personnel"/,
    );

    assert.match(
      workspace,
      /<PersonnelWorkspace/,
    );
  },
);

test(
  "canonical read authorities are real",
  () => {
    assert.match(
      repository,
      /\.from\("organization_members"\)/,
    );

    assert.match(
      repository,
      /\.from\("profiles"\)/,
    );

    assert.match(
      repository,
      /\.from\("organizations"\)/,
    );

    assert.match(
      repository,
      /\.from\("active_organizations"\)/,
    );
  },
);

test(
  "uncertified mutations remain absent",
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
  },
);

test(
  "personnel runtime has no mock dependency",
  () => {
    assert.match(
      component,
      /useOrganizationPersonnel/,
    );

    assert.doesNotMatch(
      component,
      /from\s+["'][^"']*mocks?["']/,
    );

    assert.doesNotMatch(
      hook,
      /from\s+["'][^"']*mocks?["']/,
    );
  },
);

test(
  "verifier protections remain intact",
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

test(
  "initial hook load does not call refresh from the effect",
  () => {
    const effect =
      hook.match(
        /useEffect\([\s\S]*?\n\s*\);/,
      );

    assert.ok(
      effect,
    );

    assert.doesNotMatch(
      effect[0],
      /void refresh\(\)/,
    );

    assert.match(
      effect[0],
      /useCase[\s\S]*?\.execute\(\)/,
    );
  },
);
