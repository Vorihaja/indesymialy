import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const repository = fs.readFileSync(
  new URL("./admin.repository.ts", import.meta.url),
  "utf8",
);

const types = fs.readFileSync(
  new URL("../types.ts", import.meta.url),
  "utf8",
);

const activity = fs.readFileSync(
  new URL(
    "../components/dashboard/AdminActivityList.tsx",
    import.meta.url,
  ),
  "utf8",
);

const alerts = fs.readFileSync(
  new URL(
    "../components/dashboard/AdminAlertList.tsx",
    import.meta.url,
  ),
  "utf8",
);

test(
  "dashboard counts use persistent authorities",
  () => {
    for (const table of [
      "profiles",
      "fighters",
      "clubs",
      "events",
      "articles",
      "products",
      "role_requests",
    ]) {
      assert.match(
        repository,
        new RegExp(
          `\\.from\\(["']${table}["']\\)`,
        ),
      );
    }
  },
);

test(
  "pending requests count only pending persisted requests",
  () => {
    assert.match(
      repository,
      /\.eq\(\s*["']status["']\s*,\s*["']pending["']\s*,?\s*\)/,
    );

    assert.doesNotMatch(
      repository,
      /pendingRequests\s*:\s*0/,
    );
  },
);

test(
  "unknown active users is never represented as zero",
  () => {
    assert.match(
      types,
      /activeUsersToday:\s*number\s*\|\s*null/,
    );

    assert.match(
      repository,
      /activeUsersToday:\s*null/,
    );

    assert.doesNotMatch(
      repository,
      /activeUsersToday\s*:\s*0/,
    );
  },
);

test(
  "count failures cannot silently become zero",
  () => {
    assert.match(
      repository,
      /function requireCount/,
    );

    assert.match(
      repository,
      /result\.error/,
    );

    assert.match(
      repository,
      /result\.count === null/,
    );

    assert.doesNotMatch(
      repository,
      /\.count\s*\?\?\s*0/,
    );
  },
);

test(
  "activities and alerts distinguish unavailable from empty",
  () => {
    assert.match(
      types,
      /activities:\s*AdminActivity\[\]\s*\|\s*null/,
    );

    assert.match(
      types,
      /alerts:\s*AdminAlert\[\]\s*\|\s*null/,
    );

    assert.match(
      repository,
      /getRecentActivities\(\): Promise<AdminActivity\[\] \| null>/,
    );

    assert.match(
      repository,
      /getAlerts\(\): Promise<AdminAlert\[\] \| null>/,
    );

    assert.match(
      activity,
      /activities === null/,
    );

    assert.match(
      activity,
      /Source d’activité récente non implémentée/,
    );

    assert.match(
      alerts,
      /alerts === null/,
    );

    assert.match(
      alerts,
      /Source d’alertes système non implémentée/,
    );
  },
);

test(
  "dashboard repository contains no memory fallback",
  () => {
    assert.doesNotMatch(
      repository,
      /MemoryRepository/,
    );
  },
);