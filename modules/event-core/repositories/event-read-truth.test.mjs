import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(
  new URL("./event-supabase.repository.ts", import.meta.url),
  "utf8",
);

test("Event business snapshot ne lit plus super.getSnapshot", () => {
  assert.doesNotMatch(
    source,
    /const\s+memory\s*=\s*await\s+super\.getSnapshot/,
  );

  assert.doesNotMatch(
    source,
    /\.\.\.memory/,
  );
});

test("Event business snapshot lit les autorités persistées manquantes", () => {
  for (const table of [
    "competitions",
    "event_registrations",
    "event_participants",
    "event_access_logs",
    "event_schedule_items",
    "event_reports",
  ]) {
    assert.ok(
      source.includes(".from('" + table + "')"),
      "Missing table read: " + table,
    );
  }
});

test("Event public snapshot reste séparé des données ERP privées", () => {
  assert.match(
    source,
    /if \(this\.mode === 'public'\)/,
  );

  assert.match(
    source,
    /registrations:\s*\[\]/,
  );

  assert.match(
    source,
    /accessLogs:\s*\[\]/,
  );
});


// C2-B2B-3B-TICKET-AUTHORITY

test("Event ticket validation uses persisted Supabase RPC", () => {
  assert.match(
    source,
    /\.rpc\(\s*['"]record_event_ticket_access['"]/,
  );

  assert.match(
    source,
    /p_ticket_id:\s*ticketId/,
  );

  assert.match(
    source,
    /p_result:\s*['"]accepted['"]/,
  );

  assert.match(
    source,
    /p_manual:\s*false/,
  );

  assert.doesNotMatch(
    source,
    /storageNotImplemented\(['"]validation billets événement['"]\)/,
  );
});

test("Event snapshot does not fabricate individual ticket state", () => {
  assert.doesNotMatch(
    source,
    /\.from\(['"]tickets['"]\)/,
  );

  assert.doesNotMatch(
    source,
    /paymentStatus:\s*['"]paid['"]/,
  );

  assert.doesNotMatch(
    source,
    /status:\s*['"]sold['"]\s+as const/,
  );

  const emptyTicketProjections =
    source.match(/tickets:\s*\[\]/g) ?? [];

  assert.ok(
    emptyTicketProjections.length >= 2,
    "public and business snapshots must expose no fabricated ticket rows",
  );
});

test("Event ticket types use persisted category and status", () => {
  assert.match(
    source,
    /category:\s*item\.category/,
  );

  assert.match(
    source,
    /active:\s*item\.status\s*===\s*['"]active['"]/,
  );

  assert.doesNotMatch(
    source,
    /reserved:\s*0/,
  );
});
