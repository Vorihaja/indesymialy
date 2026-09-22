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
  "admin moderation has no memory repository",
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
  "admin moderation explicitly rejects unavailable global authority",
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
      /lecture globale Admin de la file de modération/,
    );

    assert.match(
      repository,
      /lecture globale Admin des signalements Korana/,
    );

    assert.match(
      repository,
      /lecture globale Admin de la modération Marketplace/,
    );
  },
);

test(
  "admin moderation does not perform partial RLS table reads",
  () => {
    assert.doesNotMatch(
      repository,
      /\.from\(/,
    );

    assert.doesNotMatch(
      repository,
      /\.rpc\(/,
    );
  },
);

test(
  "moderation route does not expose fake-memory detail links",
  () => {
    assert.match(
      route,
      /<AdminModerationFeature domain=\{section\} access=\{access\} \/>/,
    );

    assert.doesNotMatch(
      route,
      /detailBasePath=\{section === "moderation"/,
    );
  },
);

test(
  "moderation is excluded from AdminDetailFeature memory authority",
  () => {
    const memoryBlock =
      detail.match(
        /const memoryDomains[\s\S]*?\]\);/,
      )?.[0] ?? "";

    assert.doesNotMatch(
      memoryBlock,
      /"moderation"/,
    );
  },
);