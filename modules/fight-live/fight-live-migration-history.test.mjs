import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const md5 = (value) =>
  createHash("md5").update(value, "utf8").digest("hex");

const messaging =
  "supabase/migrations/20260923081708_complete_messaging_authority.sql";
const eventRegistration =
  "supabase/migrations/20260923122326_complete_event_registration_authority.sql";
const fight =
  "supabase/migrations/20260925082825_complete_fight_live_authority.sql";
const repair =
  "supabase/migrations/20260928171500_fight_live_utf8_literal_repair.sql";

const normalized = (path) =>
  readFileSync(path, "utf8").replace(/\r\n?/g, "\n");

const withoutFinalLf = (value) =>
  value.endsWith("\n") ? value.slice(0, -1) : value;

test("local migration versions reproduce deployed history", () => {
  assert.equal(existsSync(messaging), true);
  assert.equal(existsSync(eventRegistration), true);
  assert.equal(existsSync(fight), true);

  assert.equal(
    md5(withoutFinalLf(normalized(messaging))),
    "8ba5dc4a6993502152e946fdfa65f83f",
  );

  assert.equal(
    md5(withoutFinalLf(normalized(eventRegistration))),
    "f27ff247f80dd6775363c1facf96ae3c",
  );

  assert.equal(
    md5(normalized(fight)),
    "087725e1858d6481cef04cbe4ffe505c",
  );
});

test("forward migration restores correct Fight Live UTF-8 literals", () => {
  assert.equal(existsSync(repair), true);

  const sql = normalized(repair);

  for (const text of [
    "Incident signalé en direct",
    "Début du round",
    "Temps médical",
    "Événement chrono",
    "Résultat officiel du combat",
    "Combat terminé sans vainqueur",
    "Victoire officielle enregistrée",
    "Résultat officiel publié",
  ]) {
    assert.equal(sql.includes(text), true, text);
  }

  assert.equal(sql.includes("├"), false);

  assert.equal(
    (sql.match(
      /create\s+or\s+replace\s+function\s+public\.fight_live_record_action\s*\(/gi,
    ) ?? []).length,
    1,
  );

  assert.equal(
    (sql.match(
      /create\s+or\s+replace\s+function\s+public\.sync_timer_to_timeline\s*\(/gi,
    ) ?? []).length,
    2,
  );

  assert.equal(
    (sql.match(
      /create\s+or\s+replace\s+function\s+public\.fight_live_publish_result\s*\(/gi,
    ) ?? []).length,
    1,
  );
});