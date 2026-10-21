import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");

const registry = read(
  "modules/erp-dispatch-registry/registry.ts"
);

const universal = read(
  "modules/universal-erp/components/UniversalErpPrototype.tsx"
);

const publicRoles = [
  ["fighter", "app/dashboard/combattant/marketplace/page.tsx"],
  ["organizer", "app/dashboard/organisateur/marketplace/page.tsx"],
  ["official", "app/dashboard/officiel/marketplace/page.tsx"],
  ["sponsor", "app/dashboard/sponsor/marketplace/page.tsx"],
  ["fan", "app/dashboard/fan/marketplace/page.tsx"],
  ["club", "app/dashboard/club/marketplace/page.tsx"],
  ["coach", "app/dashboard/coach/marketplace/page.tsx"],
  ["federation", "app/dashboard/federation/marketplace/page.tsx"],
  ["league", "app/dashboard/ligue/marketplace/page.tsx"],
];

const publicRegistryRoles = publicRoles.filter(
  ([role]) => role !== "organizer",
);

test("eight shell-enabled public roles share explicit public Marketplace authority", () => {
  for (const [role] of publicRegistryRoles) {
    const pattern = new RegExp(
      `makeEntry\\("${role}",\\s*"marketplace",\\s*"implemented",\\s*"marketplace-public",\\s*"marketplace-public",\\s*"public",\\s*\\{\\s*read:\\s*true\\s*\\}\\)`
    );

    assert.match(registry, pattern, role);
  }
});

test("Organizer Marketplace stays unavailable while its public bridge code is preserved", () => {
  assert.match(
    registry,
    /makeEntry\("organizer",\s*"marketplace",\s*"unavailable",\s*"unavailable",\s*"not-implemented",\s*"none",\s*\{\s*read:\s*false,\s*create:\s*false,\s*update:\s*false,\s*delete:\s*false\s*\}\)/,
  );

  assert.equal(
    fs.existsSync("app/dashboard/organisateur/marketplace/page.tsx"),
    true,
  );
});

test("Marketplace contracts contain no generic Marketplace handler", () => {
  const entries = registry
    .split(/\r?\n/)
    .filter(
      (line) =>
        line.includes("makeEntry(") &&
        line.includes('"marketplace"')
    );

  for (const line of entries) {
    assert.doesNotMatch(line, /marketplace-generic/);
    assert.doesNotMatch(line, /"generic-erp"/);
  }
});

test("public dashboard Marketplace routes bridge to Indesy Bazar", () => {
  for (const [role, path] of publicRoles) {
    assert.equal(fs.existsSync(path), true, `${role}: ${path}`);
    assert.match(read(path), /redirect\("\/marketplace"\)/);
  }
});

test("Universal ERP routes Marketplace to the correct ecosystem surface", () => {
  assert.match(universal, /MARKETPLACE_SURFACE_ROUTING/);

  assert.match(
    universal,
    /role === "admin"[\s\S]*router\.push\("\/dashboard\/admin\/marketplace"\)/
  );

  assert.match(
    universal,
    /role === "super-admin"[\s\S]*router\.push\("\/vh-teck\/marketplace"\)/
  );

  assert.match(
    universal,
    /role !== "seller"[\s\S]*router\.push\("\/marketplace"\)/
  );
});

test("seller retains dedicated Marketplace back-office", () => {
  assert.match(
    registry,
    /makeEntry\("seller",\s*"marketplace",\s*"implemented",\s*"seller-marketplace",\s*"seller-marketplace",\s*"public",\s*\{\s*read:\s*true,\s*create:\s*true,\s*update:\s*true,\s*delete:\s*true\s*\}\)/
  );

  assert.match(
    read("app/dashboard/vendeur/marketplace/page.tsx"),
    /SellerMarketplaceFeature/
  );
});

test("Admin Marketplace has explicit moderation authority", () => {
  assert.match(
    registry,
    /makeEntry\("admin",\s*"marketplace",\s*"implemented",\s*"admin-marketplace-moderation",\s*"admin-marketplace-moderation",\s*"platform",\s*\{\s*read:\s*true\s*\}\)/
  );

  const source = read(
    "modules/admin/features/AdminRouteFeature.tsx"
  );

  assert.match(source, /section === "marketplace"/);
  assert.match(source, /AdminModerationFeature/);
});

test("Super Admin Marketplace has explicit analytics authority", () => {
  assert.match(
    registry,
    /makeEntry\("super-admin",\s*"marketplace",\s*"implemented",\s*"super-admin-marketplace",\s*"super-admin-marketplace",\s*"platform",\s*\{\s*read:\s*true\s*\}\)/
  );

  assert.match(
    read("modules/super-admin/features/SuperAdminRouteFeature.tsx"),
    /SuperAdminMarketplaceFeature/
  );

  assert.match(
    read("modules/super-admin/repositories/super-admin-marketplace.repository.ts"),
    /super_admin_marketplace_analytics/
  );
});
