import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const registry = readFileSync(
  "modules/erp-dispatch-registry/registry.ts",
  "utf8",
).replace(/\r\n?/g, "\n");

const repository = readFileSync(
  "modules/erp-core/real-data/real-erp-supabase.repository.ts",
  "utf8",
).replace(/\r\n?/g, "\n");

const verifier = readFileSync(
  "scripts/verify-erp-dispatch.js",
  "utf8",
).replace(/\r\n?/g, "\n");

function organizationBlock() {
  const start =
    repository.indexOf(
      "private async platformOrganizations(",
    );

  const end =
    repository.indexOf(
      "private async platformOverview(",
      start,
    );

  assert.ok(start >= 0);
  assert.ok(end > start);

  return repository.slice(
    start,
    end,
  );
}

test("Admin and Super Admin organizations use an explicit platform handler", () => {
  for (const role of [
    "super-admin",
    "admin",
  ]) {
    assert.match(
      registry,
      new RegExp(
        `makeEntry\\("${role}", "organizations", "implemented", "platform-organizations", "platform-erp", "platform", \\{ read: true \\}\\)`,
      ),
    );
  }

  assert.match(
    verifier,
    /'platform-organizations'/,
  );
});

test("Platform organizations use stable role/module dispatch", () => {
  assert.match(
    repository,
    /\["super-admin", "admin"\]\.includes\(\s*query\.role/,
  );

  assert.match(
    repository,
    /query\.moduleId === "organizations"/,
  );

  assert.match(
    repository,
    /return this\.platformOrganizations\(/,
  );
});

test("All five organization tabs have explicit semantics", () => {
  const block =
    organizationBlock();

  for (const tab of [
    "all",
    "federations",
    "leagues",
    "clubs",
    "partners",
  ]) {
    assert.match(
      block,
      new RegExp(
        `query\\.tab === "${tab}"`,
      ),
    );
  }
});

test("Platform organization directory uses organizations as canonical authority", () => {
  const block =
    organizationBlock();

  assert.match(
    block,
    /\.from\("organizations"\)/,
  );

  assert.match(
    block,
    /row\.is_verified/,
  );

  assert.match(
    block,
    /row\.status/,
  );

  assert.match(
    block,
    /row\.type/,
  );
});

test("Partners are not silently mixed with governance organizations", () => {
  const block =
    organizationBlock();

  assert.match(
    block,
    /"federation"/,
  );

  assert.match(
    block,
    /"league"/,
  );

  assert.match(
    block,
    /"ligue"/,
  );

  assert.match(
    block,
    /"club"/,
  );

  assert.match(
    block,
    /!?\[/,
  );
});

test("Platform organization ERP projection exposes no direct mutation", () => {
  const block =
    organizationBlock();

  assert.doesNotMatch(
    block,
    /\.insert\(/,
  );

  assert.doesNotMatch(
    block,
    /\.update\(/,
  );

  assert.doesNotMatch(
    block,
    /\.delete\(/,
  );

  assert.doesNotMatch(
    block,
    /mutation\(/,
  );

  assert.doesNotMatch(
    block,
    /workspaceRecords/,
  );

  assert.doesNotMatch(
    block,
    /erp_workspace_records/,
  );
});