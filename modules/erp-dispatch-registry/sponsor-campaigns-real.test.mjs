import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const repository = fs.readFileSync(
  "modules/erp-core/real-data/real-erp-supabase.repository.ts",
  "utf8",
);

const registry = fs.readFileSync(
  "modules/erp-dispatch-registry/registry.ts",
  "utf8",
);

const verifier = fs.readFileSync(
  "scripts/verify-erp-dispatch.js",
  "utf8",
);

function campaignMethod() {
  const match = repository.match(
    /private async sponsorCampaigns\([\s\S]*?\r?\n  private async sponsors\(query: RealErpQuery\)/,
  );

  assert.ok(
    match,
    "sponsorCampaigns method missing",
  );

  return match[0];
}

test(
  "sponsor campaigns registry is organization read-only",
  () => {
    assert.match(
      registry,
      /makeEntry\("sponsor",\s*"campaigns",\s*"implemented",\s*"sponsor-campaigns",\s*"real-erp-supabase",\s*"organization",\s*\{\s*read:\s*true\s*\}\),/,
    );

    assert.doesNotMatch(
      registry,
      /makeEntry\("sponsor",\s*"campaigns"[^\n]*create:\s*true/,
    );

    assert.doesNotMatch(
      registry,
      /makeEntry\("sponsor",\s*"campaigns"[^\n]*update:\s*true/,
    );

    assert.doesNotMatch(
      registry,
      /makeEntry\("sponsor",\s*"campaigns"[^\n]*delete:\s*true/,
    );
  },
);

test(
  "sponsor-campaigns is a confirmed handler",
  () => {
    assert.match(
      registry,
      /confirmedHandlerKeys[\s\S]*["']sponsor-campaigns["']/,
    );

    assert.match(
      verifier,
      /confirmedHandlerKeys[\s\S]*["']sponsor-campaigns["']/,
    );

    assert.match(
      verifier,
      /["']sponsor-campaigns["']\s*:\s*\[[\s\S]*?sponsorCampaigns/,
    );
  },
);

test(
  "campaigns has an exact role/module dispatch before sponsor deferred routing",
  () => {
    const dedicated =
      repository.indexOf(
        'query.moduleId === "campaigns"',
      );

    const deferred =
      repository.indexOf(
        '"portfolio"',
        dedicated,
      );

    assert.ok(
      dedicated >= 0,
    );

    assert.ok(
      deferred > dedicated,
    );

    assert.match(
      repository.slice(
        Math.max(
          0,
          dedicated - 100,
        ),
        dedicated + 250,
      ),
      /query\.role === "sponsor"[\s\S]*query\.moduleId === "campaigns"[\s\S]*sponsorCampaigns/,
    );
  },
);

test(
  "campaign handler scopes sponsor identity through organizations",
  () => {
    const method =
      campaignMethod();

    assert.match(
      method,
      /context\.activeOrganizationId/,
    );

    assert.match(
      method,
      /context\.organizationIds/,
    );

    assert.match(
      method,
      /\.from\("sponsors"\)[\s\S]*?\.in\(\s*"organization_id",\s*organizationIds/,
    );

    assert.match(
      method,
      /\.from\(\s*"event_sponsors",?\s*\)[\s\S]*?\.in\(\s*"sponsor_id",\s*sponsorIds/,
    );
  },
);

test(
  "all campaign children are agreement scoped",
  () => {
    const method =
      campaignMethod();

    assert.match(
      method,
      /sponsor_activations/,
    );

    assert.match(
      method,
      /sponsor_visibility_items/,
    );

    assert.match(
      method,
      /event_sponsor_deliverables/,
    );

    const filters = [
      ...method.matchAll(
        /\.in\(\s*"event_sponsor_id",\s*agreementIds/g,
      ),
    ];

    assert.equal(
      filters.length,
      3,
    );
  },
);

test(
  "four campaign tabs map to persistent sources",
  () => {
    const method =
      campaignMethod();

    assert.match(
      method,
      /query\.tab === "content"[\s\S]*sponsor_visibility_items/,
    );

    assert.match(
      method,
      /query\.tab ===[\s\S]*"validations"[\s\S]*event_sponsor_deliverables/,
    );

    assert.match(
      method,
      /sponsor_activations[\s\S]*query\.tab ===[\s\S]*"planning"/,
    );

    assert.match(
      method,
      /"approved"[\s\S]*"scheduled"[\s\S]*"live"/,
    );
  },
);

test(
  "sponsor campaigns is strictly read-only",
  () => {
    const method =
      campaignMethod();

    assert.doesNotMatch(
      method,
      /mutation\s*\(/,
    );

    assert.doesNotMatch(
      method,
      /\.insert\s*\(/,
    );

    assert.doesNotMatch(
      method,
      /\.update\s*\(/,
    );

    assert.doesNotMatch(
      method,
      /\.delete\s*\(/,
    );

    assert.doesNotMatch(
      method,
      /\.upsert\s*\(/,
    );

    assert.doesNotMatch(
      method,
      /organizerSponsor/,
    );
  },
);

test(
  "campaign projection does not invent sponsor_campaigns table",
  () => {
    assert.doesNotMatch(
      campaignMethod(),
      /\.from\("sponsor_campaigns"\)/,
    );
  },
);
