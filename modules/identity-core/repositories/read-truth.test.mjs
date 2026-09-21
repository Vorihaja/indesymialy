import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";

const source = fs.readFileSync(
  new URL("./identity-supabase.repository.ts", import.meta.url),
  "utf8",
);

test("Identity Supabase ne dépend plus du repository mémoire", () => {
  assert.doesNotMatch(source, /IdentityMemoryRepository/);
  assert.doesNotMatch(source, /\bsuper\./);
});

test("Identity recharge le draft depuis onboarding_progress", () => {
  assert.match(
    source,
    /completed_at,accepted_terms_at,draft_data,updated_at/,
  );
  assert.match(source, /asPersistedOnboardingDraft/);
  assert.match(source, /onboardingComplete:\s*Boolean/);
});

test("Identity runtime ne contient plus les seeds mémoire historiques", () => {
  assert.doesNotMatch(
    source,
    /profile-current|organization-personal|city-antananarivo|session-mobile/,
  );
});
