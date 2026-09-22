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
  "admin settings no longer depends on AdminMemoryRepository",
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
  "admin settings explicitly rejects unavailable global authority",
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
      /lecture de la configuration globale Admin/,
    );
  },
);

test(
  "admin settings does not invent a direct table authority",
  () => {
    assert.doesNotMatch(
      repository,
      /\.from\(/,
    );

    for (const table of [
      "account_preferences",
      "conversation_user_preferences",
      "event_access_settings",
      "korana_feed_preferences",
      "notification_preferences",
      "organizer_preferences",
      "platform_reference_values",
      "platform_http_monitor_config",
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
  "admin settings does not borrow Super Admin configuration RPCs",
  () => {
    assert.doesNotMatch(
      repository,
      /\.rpc\(/,
    );

    assert.doesNotMatch(
      repository,
      /super_admin_kpi_target_configuration\s*["'`]/,
    );

    assert.doesNotMatch(
      repository,
      /super_admin_save_kpi_targets\s*["'`]/,
    );
  },
);

test(
  "admin settings does not expose synthetic setting values",
  () => {
    for (const fakeSignal of [
      "Mode maintenance",
      "Inscriptions ouvertes",
      "Modération automatique",
      "Marketplace activée",
      "Limite média",
      "Réseau social",
    ]) {
      assert.doesNotMatch(
        repository,
        new RegExp(fakeSignal),
      );
    }
  },
);

test(
  "admin settings does not fabricate mutation actions",
  () => {
    assert.doesNotMatch(
      repository,
      /updateSetting/,
    );

    assert.doesNotMatch(
      repository,
      /["']Modifier["']/,
    );
  },
);