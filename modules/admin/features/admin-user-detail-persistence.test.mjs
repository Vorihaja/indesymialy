import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(
  new URL("./AdminDetailFeature.tsx", import.meta.url),
  "utf8",
);

test(
  "user detail delegates to persistent admin-users",
  () => {
    assert.match(
      source,
      /useAdminUsers\("users"\)/,
    );

    assert.match(
      source,
      /section === "users"/,
    );
  },
);

test(
  "users are excluded from memory-backed detail domains",
  () => {
    const memoryBlock =
      source.match(
        /const memoryDomains[\s\S]*?\]\);/,
      )?.[0] ?? "";

    assert.doesNotMatch(
      memoryBlock,
      /"users"/,
    );
  },
);

test(
  "persistent user detail does not expose unsupported mutations",
  () => {
    const userBlock =
      source.split(
        "function AdminMemoryDetailFeature",
      )[0];

    assert.doesNotMatch(
      userBlock,
      /provisionalMutations\s*\/>/,
    );

    assert.match(
      source,
      /Utilisateur introuvable dans le stockage persistant/,
    );
  },
);

test(
  "memory-backed domains remain isolated for later phases",
  () => {
    for (const domain of [
      "organizations",
      "clubs",
      "fighters",
      "events",
      "moderation",
      "audit-log",
    ]) {
      assert.match(
        source,
        new RegExp(`"${domain}"`),
      );
    }
  },
);