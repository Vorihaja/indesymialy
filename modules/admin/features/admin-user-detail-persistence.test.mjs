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
      /useAdminUsers\("users"\)/,
    );

    assert.match(
      source,
      /section === "users"/,
    );
  },
);

test(
  "persistent user detail does not expose unsupported mutations",
  () => {
    const userBlock =
      source.split(
        "function AdminOrganizationDetailFeature",
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
  "organization domains are excluded from memory-backed detail",
  () => {
    const memoryBlock =
      source.match(
        /const memoryDomains[\s\S]*?\]\);/,
      )?.[0] ?? "";

    for (const domain of [
      "organizations",
      "clubs",
      "fighters",
      "events",
      "users",
    ]) {
      assert.doesNotMatch(
        memoryBlock,
        new RegExp(`"${domain}"`),
      );
    }
  },
);

test(
  "remaining memory-backed details are explicitly isolated",
  () => {
    const memoryBlock =
      source.match(
        /const memoryDomains[\s\S]*?\]\);/,
      )?.[0] ?? "";

    for (const domain of [
      "moderation",
      "audit-log",
    ]) {
      assert.match(
        memoryBlock,
        new RegExp(`"${domain}"`),
      );
    }
  },
);