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
  "admin platform health no longer depends on AdminMemoryRepository",
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
  "generic admin platform health explicitly rejects unavailable authority",
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
      /lecture de la santé globale de la plateforme pour Admin/,
    );
  },
);

test(
  "generic admin platform health does not bypass RLS with direct table reads",
  () => {
    assert.doesNotMatch(
      repository,
      /\.from\(/,
    );

    for (const table of [
      "platform_http_monitor_config",
      "platform_http_uptime_checks",
      "platform_http_uptime_incidents",
      "super_admin_system_snapshots",
      "super_admin_performance_snapshots",
      "auth_observability_events",
      "realtime_observability_events",
      "system_notifications",
    ]) {
      assert.doesNotMatch(
        repository,
        new RegExp(
          `["'\`]${table}["'\`]`,
        ),
      );
    }
  },
);

test(
  "generic admin platform health does not borrow Super Admin monitoring RPCs",
  () => {
    assert.doesNotMatch(
      repository,
      /\.rpc\(/,
    );

    for (const rpc of [
      "super_admin_system_analytics",
      "super_admin_system_snapshot_history",
      "super_admin_capture_system_snapshot",
      "super_admin_http_uptime_analytics",
      "super_admin_auth_observability",
      "super_admin_realtime_observability",
    ]) {
      assert.doesNotMatch(
        repository,
        new RegExp(
          `["'\`]${rpc}["'\`]`,
        ),
      );
    }
  },
);

test(
  "recording and pruning observability functions are not treated as read authority",
  () => {
    for (const rpc of [
      "record_auth_observability_event",
      "record_realtime_observability_event",
      "prune_auth_observability_events",
      "prune_realtime_observability_events",
    ]) {
      assert.doesNotMatch(
        repository,
        new RegExp(
          `["'\`]${rpc}["'\`]`,
        ),
      );
    }
  },
);

test(
  "admin platform health does not expose synthetic health rows",
  () => {
    for (const fakeSignal of [
      "h-ts",
      "h-build",
      "h-lint",
      "h-routes",
      "h-db",
      "h-store",
      "h-integrations",
      "Dernière validation réussie",
      "Build de production disponible",
      "Dette globale hors mission",
      "Inventaire chargé",
      "Repositories mémoire actifs",
    ]) {
      assert.doesNotMatch(
        repository,
        new RegExp(fakeSignal),
      );
    }
  },
);

test(
  "admin platform health does not fabricate refresh actions or healthy state",
  () => {
    assert.doesNotMatch(
      repository,
      /["']Rafraîchir["']/,
    );

    assert.doesNotMatch(
      repository,
      /\bstatus\s*:\s*["']healthy["']/,
    );
  },
);