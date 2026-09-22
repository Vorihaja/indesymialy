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

const detail = fs.readFileSync(
  new URL(
    "../../admin/features/AdminDetailFeature.tsx",
    import.meta.url,
  ),
  "utf8",
);

test(
  "admin-organizations no longer depends on AdminMemoryRepository",
  () => {
    assert.doesNotMatch(
      repository,
      /AdminMemoryRepository/,
    );

    assert.match(
      repository,
      /from\("organizations"\)/,
    );

    assert.match(
      repository,
      /from\("clubs"\)/,
    );

    assert.match(
      repository,
      /from\("fighters"\)/,
    );

    assert.match(
      repository,
      /from\("events"\)/,
    );
  },
);

test(
  "organization projections use persisted relationship authorities",
  () => {
    assert.match(
      repository,
      /from\("organization_members"\)/,
    );

    assert.match(
      repository,
      /from\("profiles"\)/,
    );

    assert.match(
      repository,
      /from\("regions"\)/,
    );
  },
);

test(
  "fighters do not fabricate discipline",
  () => {
    assert.match(
      repository,
      /Aucune discipline n'est inventée/,
    );

    assert.match(
      repository,
      /"Catégorie"/,
    );
  },
);

test(
  "events use event_type instead of invented discipline",
  () => {
    assert.match(
      repository,
      /event_type/,
    );

    assert.match(
      repository,
      /aucune discipline ni vérification n'est inventée/,
    );
  },
);

test(
  "persistent admin projections expose no fake actions",
  () => {
    const actionMatches =
      repository.match(
        /actions:\s*\[\]/g,
      ) ?? [];

    assert.equal(
      actionMatches.length,
      4,
    );
  },
);

test(
  "historic fake records are absent from runtime repository",
  () => {
    assert.doesNotMatch(
      repository,
      /Fédération Nationale/,
    );

    assert.doesNotMatch(
      repository,
      /Club Antananarivo/,
    );

    assert.doesNotMatch(
      repository,
      /Mialy Rakoto/,
    );

    assert.doesNotMatch(
      repository,
      /Indesy Championship/,
    );
  },
);

test(
  "supabase failures are propagated instead of becoming empty data",
  () => {
    assert.match(
      repository,
      /function assertNoError/,
    );

    assert.match(
      repository,
      /throw new Error/,
    );

    assert.doesNotMatch(
      repository,
      /catch[\s\S]*return\s*\[\]/,
    );
  },
);

test(
  "organization club fighter and event details use persistent admin-organizations",
  () => {
    assert.match(
      detail,
      /useAdminOrganizations\(\s*domain\s*,?\s*\)/,
    );

    const memoryBlock =
      detail.match(
        /const memoryDomains[\s\S]*?\]\);/,
      )?.[0] ?? "";

    for (const domain of [
      "organizations",
      "clubs",
      "fighters",
      "events",
    ]) {
      assert.doesNotMatch(
        memoryBlock,
        new RegExp(`"${domain}"`),
      );
    }
  },
);

test(
  "persistent organization details expose no provisional mutations",
  () => {
    const persistentBlock =
      detail
        .split(
          "function AdminOrganizationDetailFeature",
        )[1]
        ?.split(
          "function AdminMemoryDetailFeature",
        )[0] ?? "";

    assert.doesNotMatch(
      persistentBlock,
      /provisionalMutations/,
    );

    assert.match(
      persistentBlock,
      /stockage persistant/,
    );
  },
);