import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8").replace(/\r\n?/g, "\n");

const navigation = read("modules/fighter-erp/config/navigation.ts");
const registry = read("modules/erp-dispatch-registry/registry.ts");
const prototype = read("modules/fighter-erp/features/FighterErpPrototype.tsx");
const catalogFeature = read("modules/marketplace/features/CatalogFeature.tsx");
const catalogHook = read("modules/marketplace/hooks/useCatalog.ts");
const catalogFactory = read("modules/marketplace/factories/index.ts");
const catalogService = read("modules/marketplace/services/index.ts");
const marketplaceService = read("modules/marketplace-core/services/marketplace.service.ts");
const runtimeRepository = read("modules/marketplace-core/repositories/marketplace-runtime.repository.ts");
const marketplacePolicies = read("supabase/migrations/202608130200_rls_policies.sql");
const sellabilityGuards = read("supabase/migrations/20260829015000_marketplace_product_sellability_guards.sql");

test("Fighter Marketplace remains visible with the public handler", () => {
  assert.match(navigation, /\{ id: 'marketplace', label: 'Marketplace', tabs: \[\] \}/);
  assert.match(
    registry,
    /makeEntry\("fighter", "marketplace", "implemented", "marketplace-public", "marketplace-public", "public", \{ read: true \}\)/,
  );
});

test("Fighter shell embeds the canonical public CatalogFeature", () => {
  assert.match(prototype, /import \{ CatalogFeature \} from "@\/modules\/marketplace"/);
  assert.match(prototype, /activeModule\.id === "marketplace"[\s\S]*?<CatalogFeature \/>/);
});

test("Fighter Marketplace bypasses the organization-scoped ERP product fallback", () => {
  assert.match(
    prototype,
    /activeModule\.id === "marketplace" \? \(\s*<CatalogFeature \/>\s*\) : \(\s*<RealModuleDataView/,
  );
});

test("canonical catalog architecture reaches the existing Marketplace runtime repository", () => {
  assert.match(catalogFeature, /useCatalog\(/);
  assert.match(catalogHook, /createCatalogUseCase\(\)/);
  assert.match(catalogFactory, /new BrowseCatalogUseCase\(new CatalogService\(new CatalogRepository\(\)\)\)/);
  assert.match(catalogService, /createMarketplaceRuntimeRepository\(\)/);
  assert.match(runtimeRepository, /class MarketplaceRuntimeRepository/);
  assert.match(runtimeRepository, /extends MarketplaceSupabaseRepository/);
});

test("public catalog filters out non-published products", () => {
  assert.match(marketplaceService, /item\.status === "published"/);
  assert.match(runtimeRepository, /status:str\(extension\.status,"draft"\)/);
  assert.match(runtimeRepository, /marketplace_products/);
  assert.match(
    marketplacePolicies,
    /marketplace_products_public_read[\s\S]*?using \(status='published'\)/,
  );
  assert.match(sellabilityGuards, /if v_status <> 'published'/);
  assert.match(sellabilityGuards, /marketplace_cart_items_sellability_guard/);
  assert.match(sellabilityGuards, /marketplace_order_lines_sellability_guard/);
});

test("catalog preserves real search, filters, detail, loading, error, and empty states", () => {
  assert.match(catalogFeature, /catalog\.loading/);
  assert.match(catalogFeature, /catalog\.error/);
  assert.match(catalogFeature, /catalog\.result\.items\.length/);
  assert.match(catalogFeature, /Aucun produit publié/);
  assert.match(catalogFeature, /Rechercher dans le catalogue/);
  assert.match(catalogFeature, /\/marketplace\/products\/\$\{featured\.id\}/);
});

test("Fighter Marketplace presentation contains no direct Supabase access", () => {
  const presentation = `${prototype}\n${catalogFeature}\n${catalogHook}`;
  assert.doesNotMatch(presentation, /createSupabase|supabase\.(?:from|rpc)\s*\(/);
});

test("Fighter Marketplace exposes no seller management surface", () => {
  const marketplaceBranch = prototype.slice(
    prototype.indexOf('activeModule.id === "marketplace"'),
  );

  assert.doesNotMatch(marketplaceBranch, /SellerMarketplaceFeature|seller inventory|seller analytics/i);
  assert.doesNotMatch(catalogFeature, /createProduct|updateProduct|deleteProduct|sellerStatistics/);
});

test("other role Marketplace registry contracts remain distinct", () => {
  for (const role of ["organizer", "official", "sponsor", "fan", "club", "coach", "federation", "league"]) {
    assert.match(
      registry,
      new RegExp(`makeEntry\\("${role}", "marketplace", "implemented", "marketplace-public"`),
    );
  }
  assert.match(registry, /makeEntry\("seller", "marketplace", "implemented", "seller-marketplace"/);
  assert.match(registry, /makeEntry\("admin", "marketplace", "implemented", "admin-marketplace-moderation"/);
});

test("Fighter Marketplace has no placeholder, unsupported path, or parallel authority", () => {
  const marketplaceBranch = prototype.slice(
    prototype.indexOf('activeModule.id === "marketplace"'),
  );

  assert.doesNotMatch(marketplaceBranch, /unsupported|Module en cours de développement/i);
  assert.doesNotMatch(prototype, /FighterMarketplaceRepository|fighterProductQuery|fighter_products/i);
});
