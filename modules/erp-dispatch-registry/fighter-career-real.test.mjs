import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) =>
  fs.readFileSync(
    path,
    "utf8",
  );

const registry =
  read(
    "modules/erp-dispatch-registry/registry.ts",
  );

const verifier =
  read(
    "scripts/verify-erp-dispatch.js",
  );

const repository =
  read(
    "modules/erp-core/real-data/real-erp-supabase.repository.ts",
  );

const types =
  read(
    "infrastructure/supabase/database.types.ts",
  );

const migration =
  read(
    "supabase/migrations/20261010195000_fighter_career_authority_v1.sql",
  );

function careerMethod() {
  const start =
    repository.indexOf(
      "private async fighterCareer",
    );

  const end =
    repository.indexOf(
      "private async fights",
      start,
    );

  assert.ok(
    start >= 0,
    "fighterCareer method missing",
  );

  assert.ok(
    end > start,
    "fighterCareer method boundary missing",
  );

  return repository.slice(
    start,
    end,
  );
}

test(
  "fighter career has an explicit confirmed read-only registry handler",
  () => {
    assert.match(
      registry,
      /"fighter-career"/,
    );

    assert.match(
      registry,
      /makeEntry\("fighter",\s*"career",\s*"implemented",\s*"fighter-career",\s*"fighter-career",\s*"fighter",\s*\{\s*read:\s*true\s*\}\)/,
    );

    assert.doesNotMatch(
      registry,
      /makeEntry\("fighter",\s*"career",\s*"implemented",\s*"generic-erp"/,
    );
  },
);

test(
  "central semantic verifier recognizes Fighter Career evidence",
  () => {
    assert.match(
      verifier,
      /'fighter-career'/,
    );

    assert.match(
      verifier,
      /'fighter-career':\s*\[[^\]]*fighterCareer[^\]]*fighter_career_contracts[^\]]*fighter personal career authority[^\]]*\]/,
    );
  },
);

test(
  "Fighter Career uses exact role and module dispatch",
  () => {
    assert.match(
      repository,
      /query\.role === "fighter"\s*&&\s*query\.moduleId === "career"[\s\S]*?return this\.fighterCareer\(/,
    );
  },
);

test(
  "all five Career tabs use explicit canonical authorities",
  () => {
    const method =
      careerMethod();

    assert.match(
      method,
      /query\.tab === "path"[\s\S]*?this\.fights/,
    );

    assert.match(
      method,
      /query\.tab === "record"[\s\S]*?fighter_career_stats/,
    );

    assert.match(
      method,
      /query\.tab === "rankings"[\s\S]*?elo_history[\s\S]*?\.eq\(\s*"fighter_id",\s*fighterId/,
    );

    assert.match(
      method,
      /query\.tab === "honors"[\s\S]*?fighter_career_stats/,
    );

    assert.match(
      method,
      /query\.tab === "contracts"[\s\S]*?fighter_career_contracts[\s\S]*?\.eq\(\s*"fighter_id",\s*fighterId/,
    );
  },
);

test(
  "Career never falls back to the generic contracts authority",
  () => {
    const method =
      careerMethod();

    // Intentionally whitespace/newline tolerant:
    // .from("table")
    // and
    // .from(
    //   "table",
    // )
    // are semantically identical.

    assert.doesNotMatch(
      method,
      /\.from\(\s*"contracts"\s*,?\s*\)/,
    );

    assert.match(
      method,
      /\.from\(\s*"fighter_career_contracts"\s*,?\s*\)/,
    );
  },
);

test(
  "Career projection is strictly read only",
  () => {
    const method =
      careerMethod();

    assert.doesNotMatch(
      method,
      /\bmutation\s*\(/,
    );

    assert.doesNotMatch(
      method,
      /\.(?:insert|update|delete|upsert)\s*\(/,
    );
  },
);

test(
  "elo_history is protected by RLS while public Discovery read remains available",
  () => {
    assert.match(
      migration,
      /alter table public\.elo_history\s+enable row level security/i,
    );

    assert.match(
      migration,
      /create policy elo_history_public_read[\s\S]*?for select[\s\S]*?to anon,\s*authenticated[\s\S]*?using\s*\(\s*true\s*\)/i,
    );

    assert.match(
      migration,
      /revoke all[\s\S]*?public\.elo_history[\s\S]*?from anon,\s*authenticated,\s*service_role/i,
    );

    assert.match(
      migration,
      /grant select[\s\S]*?public\.elo_history[\s\S]*?to anon,\s*authenticated/i,
    );

    assert.match(
      migration,
      /grant select,\s*insert,\s*update,\s*delete[\s\S]*?public\.elo_history[\s\S]*?to service_role/i,
    );
  },
);

test(
  "dedicated Fighter Career contracts are relational, personal and read only",
  () => {
    assert.match(
      migration,
      /create table if not exists public\.fighter_career_contracts/i,
    );

    assert.match(
      migration,
      /fighter_id uuid not null[\s\S]*?references public\.fighters\(id\)/i,
    );

    assert.match(
      migration,
      /alter table public\.fighter_career_contracts\s+enable row level security/i,
    );

    assert.match(
      migration,
      /create policy fighter_career_contracts_own_read[\s\S]*?f\.id = fighter_id[\s\S]*?f\.profile_id = auth\.uid\(\)/i,
    );

    assert.match(
      migration,
      /grant select[\s\S]*?public\.fighter_career_contracts[\s\S]*?to authenticated/i,
    );

    assert.match(
      migration,
      /revoke all[\s\S]*?public\.fighter_career_contracts[\s\S]*?from anon,\s*authenticated/i,
    );
  },
);

test(
  "Supabase types include the new canonical contract relation",
  () => {
    assert.match(
      types,
      /fighter_career_contracts:\s*\{/,
    );

    assert.match(
      types,
      /foreignKeyName:\s*"fighter_career_contracts_fighter_id_fkey"[\s\S]*?referencedRelation:\s*"fighters"/,
    );
  },
);

test(
  "stale and sponsorship contract authorities are not used by Fighter Career",
  () => {
    const method =
      careerMethod();

    assert.doesNotMatch(
      method,
      /\bfighter_contracts\b/,
    );

    assert.doesNotMatch(
      method,
      /\bsponsor_contracts\b/,
    );
  },
);