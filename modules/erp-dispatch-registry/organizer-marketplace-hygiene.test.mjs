import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) =>
  readFileSync(path, "utf8").replace(/\r\n?/g, "\n");

const navigation = read("modules/organizer-erp/config/navigation.ts");
const sidebar = read("modules/organizer-erp/components/OrganizerSidebar.tsx");
const shell = read("modules/organizer-erp/features/OrganizerErpPrototype.tsx");
const overview = read("modules/organizer-erp/components/OverviewDashboard.tsx");
const registry = read("modules/erp-dispatch-registry/registry.ts");
const fighterNavigation = read("modules/fighter-erp/config/navigation.ts");

test("Organizer Marketplace is absent from navigation", () => {
  assert.doesNotMatch(navigation, /\{ id: 'marketplace'/);
});

test("Organizer shell and Overview expose no Marketplace CTA", () => {
  assert.doesNotMatch(shell, /activeModule\.id === ["']marketplace["']/);
  assert.doesNotMatch(overview, /onNavigate\(["']marketplace["']/);
  assert.match(sidebar, /organizerModules\.map/);
});

test("Organizer Marketplace registry entry is truthfully unavailable", () => {
  assert.match(
    registry,
    /makeEntry\("organizer", "marketplace", "unavailable", "unavailable", "not-implemented", "none", \{ read: false, create: false, update: false, delete: false \}\)/,
  );
});

test("Organizer Marketplace placeholder is unreachable from its shell navigation", () => {
  assert.doesNotMatch(navigation, /id: 'marketplace'/);
  assert.doesNotMatch(shell, /moduleId=["']marketplace["']/);
});

test("shared public Marketplace code and Organizer bridge remain preserved", () => {
  assert.equal(existsSync("modules/marketplace/features/CatalogFeature.tsx"), true);
  assert.equal(existsSync("modules/marketplace-core/repositories/marketplace-runtime.repository.ts"), true);
  assert.match(
    read("app/dashboard/organisateur/marketplace/page.tsx"),
    /redirect\("\/marketplace"\)/,
  );
});

test("Fighter Marketplace remains visible and implemented", () => {
  assert.match(fighterNavigation, /id: 'marketplace'/);
  assert.match(registry, /makeEntry\("fighter", "marketplace", "implemented", "marketplace-public"/);
});

test("Seller Marketplace remains its dedicated implemented back-office", () => {
  assert.match(registry, /makeEntry\("seller", "marketplace", "implemented", "seller-marketplace"/);
  assert.match(
    read("app/dashboard/vendeur/marketplace/page.tsx"),
    /SellerMarketplaceFeature/,
  );
});

test("Sponsor Marketplace remains implemented", () => {
  assert.match(registry, /makeEntry\("sponsor", "marketplace", "implemented", "marketplace-public"/);
  assert.match(read("app/dashboard/sponsor/marketplace/page.tsx"), /redirect\("\/marketplace"\)/);
});

test("Club Marketplace remains implemented", () => {
  assert.match(registry, /makeEntry\("club", "marketplace", "implemented", "marketplace-public"/);
  assert.match(read("app/dashboard/club/marketplace/page.tsx"), /redirect\("\/marketplace"\)/);
});
