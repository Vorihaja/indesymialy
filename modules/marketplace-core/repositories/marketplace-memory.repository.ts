import type { CartItem, CheckoutInput, DeliveryRecord, InventoryItem, MarketplaceOrder, MarketplaceProduct, MarketplaceTransaction, OrderStatus, ProductInput, RentalSelection, SellerCustomer, SellerStatistics, StockMovement } from "../types";

export interface MarketplaceStoreRepository { listProducts(): Promise<MarketplaceProduct[]>; findProduct(id: string): Promise<MarketplaceProduct | null>; createProduct(input: ProductInput): Promise<MarketplaceProduct>; updateProduct(id: string, input: ProductInput): Promise<MarketplaceProduct>; deleteProduct(id: string): Promise<void>; listCart(): Promise<CartItem[]>; setCartItem(product: MarketplaceProduct, quantity: number, mode: "sale" | "rental", rental?: RentalSelection): Promise<void>; removeCartItem(id: string): Promise<void>; clearCart(): Promise<void>; listOrders(): Promise<MarketplaceOrder[]>; findOrder(id: string): Promise<MarketplaceOrder | null>; createOrder(input: CheckoutInput): Promise<MarketplaceOrder>; updateOrderStatus(id: string, status: OrderStatus, reason?: string): Promise<void>; confirmPaymentPaid(paymentId: string, providerReference?: string, reason?: string): Promise<string>; deleteOrder(id: string): Promise<void>; listInventory(): Promise<InventoryItem[]>; adjustStock(productId: string, quantity: number, reason: string): Promise<void>; listDeliveries(): Promise<DeliveryRecord[]>; listTransactions(): Promise<MarketplaceTransaction[]>; sellerStatistics(): Promise<SellerStatistics>; sellerCustomers(): Promise<SellerCustomer[]>; }

const products: MarketplaceProduct[] = []; const cart: CartItem[] = []; const orders: MarketplaceOrder[] = []; const deliveries: DeliveryRecord[] = []; const transactions: MarketplaceTransaction[] = []; const inventory = new Map<string, InventoryItem>();
const now = () => new Date().toISOString();
export class MarketplaceMemoryRepository implements MarketplaceStoreRepository {
  listProducts() { return Promise.resolve([...products]); } findProduct(id: string) { return Promise.resolve(products.find((item) => item.id === id) ?? null); }
  createProduct(input: ProductInput) { const product: MarketplaceProduct = { ...input, id: crypto.randomUUID(), popularity: 0, createdAt: now(), updatedAt: now() }; products.unshift(product); inventory.set(product.id, { productId: product.id, title: product.title, available: product.stock, reserved: 0, lowStockThreshold: 3, movements: [] }); return Promise.resolve(product); }
  updateProduct(id: string, input: ProductInput) { const index = products.findIndex((item) => item.id === id); const current = products[index]; const product: MarketplaceProduct = { ...input, id, popularity: current?.popularity ?? 0, createdAt: current?.createdAt ?? now(), updatedAt: now() }; if (index >= 0) products[index] = product; else products.unshift(product); const item = inventory.get(id); inventory.set(id, { productId: id, title: product.title, available: product.stock, reserved: item?.reserved ?? 0, lowStockThreshold: item?.lowStockThreshold ?? 3, movements: item?.movements ?? [] }); return Promise.resolve(product); }
  deleteProduct(id: string) { const product = products.find((item) => item.id === id); if (product) { product.status = "archived"; product.updatedAt = now(); } for (let index = cart.length - 1; index >= 0; index--) { if (cart[index].productId === id) cart.splice(index, 1); } return Promise.resolve(); }
  listCart() { return Promise.resolve([...cart]); }
  setCartItem(product: MarketplaceProduct, quantity: number, mode: "sale" | "rental", rental?: RentalSelection) { const existing = cart.find((item) => item.productId === product.id && item.mode === mode); if (existing) { existing.quantity = Math.max(1, quantity); existing.rental = rental; } else cart.push({ id: crypto.randomUUID(), productId: product.id, product, quantity: Math.max(1, quantity), mode, rental }); return Promise.resolve(); }
  removeCartItem(id: string) { const index = cart.findIndex((item) => item.id === id); if (index >= 0) cart.splice(index, 1); return Promise.resolve(); } clearCart() { cart.splice(0); return Promise.resolve(); }
  async createOrder(input: CheckoutInput) { const lines = cart.map((item) => { const price = item.mode === "rental" ? (item.product.rentalPricePerDay ?? 0) * (item.rental?.days ?? 1) : (item.product.salePrice ?? 0); return { id: crypto.randomUUID(), productId: item.productId, title: item.product.title, quantity: item.quantity, unitPrice: price, mode: item.mode, rental: item.rental, total: price * item.quantity }; }); const subtotal = lines.reduce((sum, line) => sum + line.total, 0); const fees = input.fulfillment === "delivery" ? Math.round(subtotal * 0.05) : 0; const order: MarketplaceOrder = { id: crypto.randomUUID(), customerId: "current-customer", sellerId: lines[0] ? products.find((product) => product.id === lines[0].productId)?.sellerId ?? "unknown" : "unknown", lines, ...input, subtotal, fees, total: subtotal + fees, status: "pending", paymentStatus: "unpaid", statusHistory: [{ status: "pending", changedAt: now() }], createdAt: now(), updatedAt: now() }; orders.unshift(order); deliveries.unshift({ id: crypto.randomUUID(), orderId: order.id, method: order.fulfillment, address: order.address, status: "pending", updatedAt: now() }); transactions.unshift({ id: crypto.randomUUID(), orderId: order.id, sellerId: order.sellerId, amount: order.total, paymentMethod: order.paymentMethod, paymentStatus: order.paymentStatus, createdAt: now() }); await this.clearCart(); return order; }
  listOrders() { return Promise.resolve([...orders]); } findOrder(id: string) { return Promise.resolve(orders.find((item) => item.id === id) ?? null); } updateOrderStatus(id: string, status: OrderStatus, reason?: string) {
    const order = orders.find((item) => item.id === id);

    if (!order) {
      return Promise.reject(new Error("Commande introuvable."));
    }

    if (status === "refunded") {
      return Promise.reject(
        new Error(
          "Le remboursement utilise une autorité de paiement dédiée."
        )
      );
    }

    order.status = status;
    order.updatedAt = now();
    order.statusHistory.push({
      status,
      changedAt: now(),
      note: reason?.trim() || undefined,
    });

    return Promise.resolve();
  }

  confirmPaymentPaid(
    paymentId: string,
    providerReference?: string,
    reason?: string
  ): Promise<string> {
    void paymentId;
    void providerReference;
    void reason;

    return Promise.reject(
      new Error(
        "La confirmation atomique de paiement nécessite le runtime Supabase."
      )
    );
  }

  deleteOrder(id: string) { const index = orders.findIndex((item) => item.id === id); if (index >= 0) orders.splice(index, 1); return Promise.resolve(); }
  listInventory() { return Promise.resolve([...inventory.values()]); } async adjustStock(
    productId: string,
    quantity: number,
    reason: string,
  ) {
    if (!Number.isInteger(quantity) || quantity === 0) {
      throw new Error(
        "La variation de stock doit être un entier non nul.",
      );
    }

    const normalizedReason = reason.trim();

    if (!normalizedReason) {
      throw new Error(
        "La raison de l’ajustement du stock est obligatoire.",
      );
    }

    const item = inventory.get(productId);

    if (!item) {
      throw new Error(
        "Inventaire Marketplace introuvable.",
      );
    }

    const nextAvailable =
      item.available + quantity;

    if (nextAvailable < 0) {
      throw new Error(
        "L’ajustement rendrait le stock disponible négatif.",
      );
    }

    item.available =
      nextAvailable;

    const product =
      products.find(
        (candidate) =>
          candidate.id === productId,
      );

    if (product) {
      product.stock =
        nextAvailable;

      product.updatedAt =
        now();
    }

    const movement: StockMovement = {
      id: crypto.randomUUID(),
      productId,
      type:
        quantity > 0
          ? "in"
          : "out",
      quantity:
        Math.abs(quantity),
      reason:
        normalizedReason,
      createdAt:
        now(),
    };

    item.movements.unshift(
      movement,
    );
  }
  listDeliveries() { return Promise.resolve([...deliveries]); } listTransactions() { return Promise.resolve([...transactions]); }
  async sellerStatistics() { const sellerProducts = products; const sellerOrders = orders; const customerIds = new Set(sellerOrders.map((order) => order.customerId)); return { products: sellerProducts.length, sales: sellerOrders.flatMap((order) => order.lines).filter((line) => line.mode === "sale").length, rentals: sellerOrders.flatMap((order) => order.lines).filter((line) => line.mode === "rental").length, orders: sellerOrders.length, revenue: sellerOrders.filter((order) => order.status !== "cancelled").reduce((sum, order) => sum + order.total, 0), lowStock: [...inventory.values()].filter((item) => item.available <= item.lowStockThreshold).length, customers: customerIds.size, recentProducts: sellerProducts.slice(0, 5) }; }
  async sellerCustomers() { const map = new Map<string, SellerCustomer>(); orders.forEach((order) => { const current = map.get(order.customerId); map.set(order.customerId, { id: order.customerId, name: order.customerName, email: order.customerEmail, orders: (current?.orders ?? 0) + 1, totalSpent: (current?.totalSpent ?? 0) + order.total }); }); return [...map.values()]; }
}
export const marketplaceMemoryRepository = new MarketplaceMemoryRepository();
