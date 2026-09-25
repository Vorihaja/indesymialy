import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root =
  process.cwd();

const read =
  (relativePath) =>
    fs.readFileSync(
      path.join(
        root,
        relativePath,
      ),
      "utf8",
    );

test(
  "public Marketplace routes do not depend on marketplace prototype or ERP mocks",
  () => {
    const routes = [
      "app/marketplace/page.tsx",
      "app/marketplace/layout.tsx",
      "app/marketplace/cart/page.tsx",
      "app/marketplace/checkout/page.tsx",
      "app/marketplace/favorites/page.tsx",
      "app/marketplace/orders/page.tsx",
      "app/marketplace/orders/[id]/page.tsx",
      "app/marketplace/products/[id]/page.tsx",
      "app/marketplace/rentals/page.tsx",
      "app/marketplace/search/page.tsx",
    ];

    for (const route of routes) {
      const source =
        read(route);

      assert.doesNotMatch(
        source,
        /marketplace-prototype|erp-marketplace\/mocks|\.\.\/mocks/,
        `prototype/mock reference detected in ${route}`,
      );
    }
  },
);

test(
  "Marketplace has a dedicated Indesy Bazar shell",
  () => {
    const layout =
      read(
        "app/marketplace/layout.tsx",
      );

    const shell =
      read(
        "modules/marketplace/components/MarketplaceShell.tsx",
      );

    assert.match(
      layout,
      /MarketplaceShell/,
    );

    assert.match(
      shell,
      /Indesy Bazar/,
    );

    for (const route of [
      "/marketplace",
      "/marketplace/favorites",
      "/marketplace/cart",
      "/marketplace/orders",
      "/marketplace/rentals",
    ]) {
      assert.ok(
        shell.includes(route),
        `missing Marketplace shell route ${route}`,
      );
    }
  },
);

test(
  "catalog is backed by persisted Marketplace authorities",
  () => {
    const runtime =
      read(
        "modules/marketplace-core/repositories/marketplace-runtime.repository.ts",
      );

    for (const authority of [
      'from("marketplace_products")',
      'from("marketplace_product_images")',
      'from("marketplace_cart_items")',
      'from("marketplace_carts")',
      'rpc("marketplace_checkout"',
      'from("marketplace_orders")',
    ]) {
      assert.ok(
        runtime.includes(authority),
        `missing persisted Marketplace authority ${authority}`,
      );
    }
  },
);

test(
  "public catalog visual source contains no demo product data",
  () => {
    const catalog =
      read(
        "modules/marketplace/features/CatalogFeature.tsx",
      );

    const card =
      read(
        "modules/marketplace/components/ProductCard.tsx",
      );

    const combined =
      `${catalog}\n${card}`;

    assert.doesNotMatch(
      combined,
      /rashguard-boeny|gants-mfn-pro|cage-location|\bMarketplaceStore\b|\bmarketProducts\b|\binitialMarketOrders\b/,
    );

    assert.match(
      catalog,
      /catalog\.result\.total/,
    );

    assert.match(
      catalog,
      /featured\.images\[0\]/,
    );
  },
);

test(
  "rental products use product detail instead of direct fake checkout",
  () => {
    const card =
      read(
        "modules/marketplace/components/ProductCard.tsx",
      );

    assert.match(
      card,
      /product\.type === "rental"/,
    );

    assert.match(
      card,
      /product\.type !== "rental"/,
    );

    assert.match(
      card,
      /Voir l&apos;offre/,
    );
  },
);

test(
  "public sale add-to-cart uses existing Marketplace use case",
  () => {
    const catalog =
      read(
        "modules/marketplace/features/CatalogFeature.tsx",
      );

    assert.match(
      catalog,
      /store\.useCase\.addToCart/,
    );

    assert.doesNotMatch(
      catalog,
      /Math\.random|Date\.now\(\).*order|setOrders/,
    );
  },
);
test("Marketplace secondary navigation follows the shared document scroll architecture", () => {
  const shell =
    read(
      "modules/marketplace/components/MarketplaceShell.tsx",
    );

  const layout =
    read(
      "app/marketplace/layout.tsx",
    );

  const globals =
    read(
      "app/globals.css",
    );

  assert.equal(
    layout.match(/<MarketplaceShell>/g)?.length,
    1,
    "Marketplace layout must own exactly one shared shell",
  );

  assert.equal(
    shell.match(/data-marketplace-secondary-nav=/g)?.length,
    1,
    "MarketplaceShell must own exactly one secondary navigation",
  );

  const catalog =
    read(
      "modules/marketplace/features/CatalogFeature.tsx",
    );

  const card =
    read(
      "modules/marketplace/components/ProductCard.tsx",
    );

  assert.match(
    shell,
    /className="[^"]*\bsticky\b/,
  );

  assert.match(
    shell,
    /top-\[var\(--platform-header-height\)\]/,
  );

  assert.match(
    shell,
    /z-\[calc\(var\(--ds-z-header\)-1\)\]/,
  );

  assert.doesNotMatch(
    shell,
    /(?<![\w-])(?:fixed|h-screen|overflow-y-(?:auto|scroll|hidden))(?![\w-])/,
    "MarketplaceShell must not create fixed or nested vertical scrolling",
  );

  assert.match(
    globals,
    /html\s*\{[^}]*overflow-y:\s*scroll;/s,
    "the document root must own public-page scrolling",
  );

  assert.match(
    globals,
    /body\s*\{[^}]*overflow-y:\s*visible;/s,
    "body must not become a competing sticky scrollport",
  );

  assert.match(
    catalog,
    /min-h-\[224px\]/,
  );

  assert.match(
    catalog,
    /sm:grid-cols-\[repeat\(auto-fill,minmax\(280px,320px\)\)\]/,
  );

  assert.match(
    card,
    /aspect-\[4\/3\]/,
  );

  assert.match(
    card,
    /sm:aspect-\[16\/11\]/,
  );
});

test("available offer cards are compact full-bleed overlays backed by real product fields", () => {
  const card =
    read(
      "modules/marketplace/components/ProductCard.tsx",
    );

  for (const persistedField of [
    /product\.images\[0\]/,
    /product\.title/,
    /product\.sellerName/,
    /product\.salePrice/,
    /product\.rentalPricePerDay/,
  ]) {
    assert.match(
      card,
      persistedField,
      `missing persisted card field ${persistedField}`,
    );
  }

  assert.match(
    card,
    /data-marketplace-offer-card="overlay"/,
  );

  assert.match(
    card,
    /data-marketplace-card-gradient="true"/,
  );

  assert.match(
    card,
    /bg-gradient-to-t from-black via-black\/75 to-black\/5/,
  );

  assert.match(
    card,
    /aria-pressed=\{favorite\}/,
    "favorite persistence state must remain visible",
  );

  assert.match(
    card,
    /onClick=\{onFavorite\}/,
  );

  assert.match(
    card,
    /href=\{detailHref\}/,
    "card image, title, or CTA must retain detail navigation",
  );

  assert.match(
    card,
    /onClick=\{onAdd\}/,
    "real add-to-cart callback must remain reachable",
  );

  assert.doesNotMatch(
    card,
    /flex flex-1 flex-col p-3|product\.description/,
    "a separate long metadata panel must not be reintroduced",
  );
});

test("all public Marketplace pages inherit the shared shell without duplicate secondary navigation", () => {
  const routes = [
    "app/marketplace/page.tsx",
    "app/marketplace/products/[id]/page.tsx",
    "app/marketplace/favorites/page.tsx",
    "app/marketplace/cart/page.tsx",
    "app/marketplace/checkout/page.tsx",
    "app/marketplace/orders/page.tsx",
    "app/marketplace/rentals/page.tsx",
  ];

  for (const route of routes) {
    const source = read(route);

    assert.doesNotMatch(
      source,
      /MarketplaceShell|data-marketplace-secondary-nav|Navigation Indesy Bazar/,
      `duplicate Marketplace secondary navigation detected in ${route}`,
    );
  }
});
test("Marketplace product detail stays compact and uses sale-specific price wording", () => {
  const detail =
    read(
      "modules/marketplace/features/ProductDetailFeature.tsx",
    );

  assert.match(
    detail,
    /max-h-\[420px\]/,
  );

  assert.match(
    detail,
    /object-contain/,
  );

  assert.match(
    detail,
    /lg:grid-cols-\[minmax\(0,1fr\)_420px\]/,
  );

  assert.match(
    detail,
    /product\.type === "rental" \? "Total estimé" : "Prix de vente"/,
  );
});
