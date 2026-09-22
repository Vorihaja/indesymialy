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
  "admin reports has no memory repository",
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
  "admin reports explicitly rejects unavailable global authority",
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
      /lecture globale Admin des signalements/,
    );
  },
);

test(
  "admin reports does not perform partial RLS reads",
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
  "admin reports contains no fake report projection",
  () => {
    assert.doesNotMatch(
      repository,
      /report-mod-/,
    );

    assert.doesNotMatch(
      repository,
      /listReports/,
    );

    assert.doesNotMatch(
      repository,
      /structuredClone/,
    );
  },
);