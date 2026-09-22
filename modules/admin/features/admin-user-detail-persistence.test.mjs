import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(
  new URL(
    "./AdminDetailFeature.tsx",
    import.meta.url,
  ),
  "utf8",
);

test(
  "user detail delegates to persistent admin-users",
  () => {
    assert.match(
      source,
      /useAdminUsers/,
    );

    assert.match(
      source,
      /section ===\s*"users"/,
    );

    assert.match(
      source,
      /Utilisateur introuvable dans le stockage persistant/,
    );
  },
);

test(
  "organization details delegate to persistent admin-organizations",
  () => {
    assert.match(
      source,
      /useAdminOrganizations/,
    );

    for (const domain of [
      "organizations",
      "clubs",
      "fighters",
      "events",
    ]) {
      assert.match(
        source,
        new RegExp(
          `"${domain}"`,
        ),
      );
    }

    assert.match(
      source,
      /Ressource introuvable dans le stockage persistant/,
    );
  },
);

test(
  "no detail route depends on AdminMemoryRepository infrastructure",
  () => {
    assert.doesNotMatch(
      source,
      /useAdminDomain/,
    );

    assert.doesNotMatch(
      source,
      /AdminMemoryDetailFeature/,
    );

    assert.doesNotMatch(
      source,
      /memoryDomains/,
    );
  },
);

test(
  "audit log has no fake-memory detail authority",
  () => {
    assert.doesNotMatch(
      source,
      /"audit-log"/,
    );

    assert.doesNotMatch(
      source,
      /stockage provisoire/,
    );
  },
);

test(
  "fake provisional mutation controls were removed from detail view",
  () => {
    assert.doesNotMatch(
      source,
      /provisionalMutations/,
    );

    assert.doesNotMatch(
      source,
      />Mettre à jour</,
    );

    assert.doesNotMatch(
      source,
      />Suspendre</,
    );
  },
);