import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("favorites use authenticated persisted authority and reload the full favorite set", () => {
  const repository = read("modules/marketplace/repositories/index.ts");
  const hook = read("modules/marketplace/hooks/useCatalog.ts");
  const feature = read("modules/marketplace/features/FavoritesFeature.tsx");
  assert.match(repository, /from\("marketplace_favorites"/);
  assert.match(repository, /auth\.getUser\(\)/);
  assert.match(repository, /throw userError \?\?/);
  assert.match(repository, /favoriteProducts\(\)/);
  assert.match(hook, /useCase\.favoriteProducts\(\)/);
  assert.match(hook, /await refresh\(\)/);
  assert.match(feature, /data\.favoriteItems\.map/);
  assert.match(feature, /!auth\.authenticated/);
});

test("cart reads and mutates persisted rows, increments repeated adds, and propagates failures", () => {
  const runtime = read("modules/marketplace-core/repositories/marketplace-runtime.repository.ts");
  const service = read("modules/marketplace-core/services/marketplace.service.ts");
  const hook = read("modules/cart/hooks/index.ts");
  assert.match(runtime, /from\("marketplace_cart_items"\)\.select/);
  assert.match(runtime, /nextQuantity\s*=\s*num[\s\S]*\+ quantity/);
  assert.match(runtime, /quantity > product\.stock/);
  assert.match(runtime, /removeCartItem[\s\S]*await this\.user\(\)/);
  assert.match(service, /repository\.addCartItem/);
  assert.match(hook, /await operation\(\)[\s\S]*await refresh\(\)/);
  assert.match(hook, /setError\(explain\(cause\)\)/);
});

test("cart subtotal is derived from canonical persisted product pricing", () => {
  const service = read("modules/cart/services/index.ts");
  assert.match(service, /item\.product\.rentalPricePerDay/);
  assert.match(service, /item\.product\.salePrice/);
  assert.match(service, /\*item\.quantity/);
});

test("checkout uses the real RPC with a stable idempotency key and truthful pending state", () => {
  const runtime = read("modules/marketplace-core/repositories/marketplace-runtime.repository.ts");
  const form = read("modules/orders/components/CheckoutForm.tsx");
  const feature = read("modules/orders/features/CheckoutFeature.tsx");
  const route = read("app/marketplace/checkout/page.tsx");
  assert.match(runtime, /rpc\("marketplace_checkout"/);
  assert.match(runtime, /p_idempotency_key: input\.idempotencyKey/);
  assert.doesNotMatch(runtime, /p_idempotency_key:\s*crypto\.randomUUID/);
  assert.match(form, /useState\(\(\) => crypto\.randomUUID\(\)\)/);
  assert.match(form, /if \(submittingRef\.current\) return/);
  assert.match(form, /Aucun paiement n(?:'|&apos;)est confirmé/);
  assert.match(feature, /router\.push\(`\/marketplace\/orders\/\$\{order\.id\}`\)/);
  assert.match(route, /CheckoutFeature/);
});

test("public orders are explicitly buyer-scoped and hydrate persisted lines, history, payment, and delivery", () => {
  const runtime = read("modules/marketplace-core/repositories/marketplace-runtime.repository.ts");
  const repository = read("modules/orders/repositories/index.ts");
  const feature = read("modules/orders/features/OrdersFeature.tsx");
  assert.match(runtime, /listBuyerOrders[\s\S]*eq\("customer_id", userId\)/);
  assert.match(runtime, /findBuyerOrder[\s\S]*eq\("customer_id", userId\)/);
  for (const authority of ["marketplace_order_lines", "marketplace_order_status_history", "marketplace_payments", "marketplace_deliveries"]) {
    assert.ok(runtime.includes(`from("${authority}")`), `missing ${authority} hydration`);
  }
  assert.match(repository, /this\.seller[\s\S]*listBuyerOrders/);
  assert.match(repository, /this\.seller[\s\S]*findBuyerOrder/);
  assert.match(feature, /order\.delivery\.status/);
  assert.match(feature, /order\.statusHistory\.map/);
});

test("database boundary blocks anonymous buyer mutation and buyer payment self-approval", () => {
  const rls = read("supabase/migrations/202608130200_rls_policies.sql");
  const checkout = read("supabase/migrations/202608130100_marketplace_runtime.sql");
  const lifecycle = read("supabase/migrations/20260829133000_marketplace_atomic_order_status_transition.sql");
  assert.match(rls, /marketplace_favorites_owner[\s\S]*to authenticated/);
  assert.match(rls, /marketplace_carts_owner[\s\S]*to authenticated/);
  assert.match(rls, /marketplace_cart_items_owner[\s\S]*to authenticated/);
  assert.match(rls, /marketplace_orders_customer_read[\s\S]*auth\.uid\(\)/);
  assert.match(rls, /marketplace_orders_seller_update[\s\S]*seller/);
  assert.match(checkout, /revoke all on function public\.marketplace_checkout[\s\S]*from public/);
  assert.match(checkout, /grant execute on function public\.marketplace_checkout[\s\S]*to authenticated/);
  assert.match(lifecycle, /marketplace_confirm_payment_paid[\s\S]*seller/);
  assert.match(lifecycle, /marketplace_transition_order_status[\s\S]*seller/);
  const buyerCheckout = read("modules/orders/features/CheckoutFeature.tsx");
  const ordersFeature = read("modules/orders/features/OrdersFeature.tsx");
  assert.doesNotMatch(buyerCheckout, /confirmPaymentPaid|payment successful|paiement réussi/i);
  assert.match(ordersFeature, /seller\s*&&[\s\S]*paymentCanBeConfirmed/);
  assert.match(ordersFeature, /seller\s*&&\s*\([\s\S]*Actions commande/);
});

test("buyer flow contains no prototype, fake order, mock payment, or storage fallback", () => {
  const files = [
    "modules/marketplace/features/FavoritesFeature.tsx",
    "modules/cart/features/CartFeature.tsx",
    "modules/orders/features/CheckoutFeature.tsx",
    "modules/orders/features/OrdersFeature.tsx",
    "modules/marketplace-core/repositories/marketplace-runtime.repository.ts",
  ];
  const source = files.map(read).join("\n");
  assert.doesNotMatch(source, /marketplace-prototype|storageNotImplemented|mock order|fake payment/i);
  assert.doesNotMatch(source, /localStorage|sessionStorage/);
});
