import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/infrastructure/supabase/database.types";
import { createSupabaseBrowserClient } from "@/infrastructure/supabase/client";
import { normalizeBackendError } from "@/shared/errors/backend-error";
import { MarketplaceSupabaseRepository } from "./marketplace-supabase.repository";
import type { CartItem, CheckoutInput, DeliveryRecord, MarketplaceOrder, MarketplaceTransaction, OrderLine, OrderStatus, OrderStatusEntry, PaymentMethod, RentalSelection, SellerCustomer, SellerStatistics } from "../types";

type Row = Record<string, unknown>;
const rows = (value: unknown): Row[] => Array.isArray(value) ? value as Row[] : [];
const str = (value: unknown, fallback = "") => typeof value === "string" ? value : fallback;
const num = (value: unknown) => Number(value ?? 0);
const methods: Record<string, PaymentMethod> = {
  cash: { id: "cash", label: "Paiement Ã  la remise", type: "cash", enabled: true },
  mobile_money: { id: "mobile_money", label: "Mobile Money", type: "mobile_money", enabled: true },
  card: { id: "card", label: "Carte bancaire", type: "card", enabled: true },
  bank_transfer: { id: "bank_transfer", label: "Virement bancaire", type: "bank_transfer", enabled: true },
};

export class MarketplaceRuntimeRepository extends MarketplaceSupabaseRepository {
  private readonly runtime: SupabaseClient;
  constructor(client: SupabaseClient<Database>) { super(client); this.runtime = client as unknown as SupabaseClient; }

  override async listProducts(): Promise<import("../types").MarketplaceProduct[]> {
    return this.safe(async () => {
      const [base, extensions, images, categories, organizations] = await Promise.all([
        this.runtime.from("products").select("id,name,price,seller_id,stock"),
        this.runtime.from("marketplace_products").select("*"),
        this.runtime.from("marketplace_product_images").select("product_id,storage_path,sort_order"),
        this.runtime.from("marketplace_categories").select("id,name"),
        this.runtime.from("organizations").select("id,name"),
      ]);
      for (const result of [base, extensions, images, categories, organizations]) if (result.error) throw result.error;
      const extensionMap = new Map(rows(extensions.data).map(item => [str(item.product_id), item]));
      const categoryMap = new Map(rows(categories.data).map(item => [str(item.id), str(item.name)]));
      const sellerMap = new Map(rows(organizations.data).map(item => [str(item.id), str(item.name)]));
      const imageMap = new Map<string,string[]>();
      rows(images.data).sort((a,b) => num(a.sort_order)-num(b.sort_order)).forEach(item => { const id=str(item.product_id); imageMap.set(id,[...(imageMap.get(id) ?? []),str(item.storage_path)]); });
      return rows(base.data).flatMap(product => {
        const extension=extensionMap.get(str(product.id)); if(!extension) return [];
        const id=str(product.id); const listingType=str(extension.listing_type) as import("../types").MarketplaceProduct["type"];
        return [{ id, title:str(product.name), description:str(extension.description), type:listingType, category:categoryMap.get(str(extension.category_id)) ?? "", salePrice:listingType === "rental" ? null : num(product.price), rentalPricePerDay:extension.rental_price_per_day == null ? null : num(extension.rental_price_per_day), depositAmount:extension.deposit_amount == null ? null : num(extension.deposit_amount), stock:num(product.stock), condition:str(extension.condition,"new") as import("../types").MarketplaceProduct["condition"], images:imageMap.get(id) ?? [], sellerId:str(product.seller_id), sellerName:sellerMap.get(str(product.seller_id)) ?? "Vendeur", location:str(extension.location), status:str(extension.status,"draft") as import("../types").MarketplaceProduct["status"], popularity:num(extension.popularity), createdAt:str(extension.created_at), updatedAt:str(extension.updated_at) }];
      });
    });
  }

  override async findProduct(id: string) { return (await this.listProducts()).find(product => product.id === id) ?? null; }

  override async createProduct(input: import("../types").ProductInput) {
    return this.safe(async () => {
      const categoryId = await this.categoryId(input.category);
      const base = await this.runtime.from("products").insert({ name:input.title, price:input.salePrice ?? input.rentalPricePerDay ?? 0, seller_id:input.sellerId, stock:input.stock }).select("id").single();
      if(base.error) throw base.error; const id=str((base.data as Row).id);
      const extension = await this.runtime.from("marketplace_products").insert({ product_id:id, category_id:categoryId || null, listing_type:input.type, description:input.description, rental_price_per_day:input.rentalPricePerDay, deposit_amount:input.depositAmount, condition:input.condition, location:input.location, status:input.status, published_at:input.status === "published" ? new Date().toISOString() : null }); if(extension.error) throw extension.error;
      const inventory = await this.runtime.from("marketplace_inventory").insert({ product_id:id, available:input.stock }); if(inventory.error) throw inventory.error;
      if(input.images.length){ const imageResult=await this.runtime.from("marketplace_product_images").insert(input.images.map((path,index)=>({product_id:id,storage_path:path,sort_order:index,is_primary:index===0}))); if(imageResult.error) throw imageResult.error; }
      return (await this.findProduct(id))!;
    });
  }

  override async updateProduct(id: string, input: import("../types").ProductInput) {
    return this.safe(async () => {
      const categoryId=await this.categoryId(input.category);
      const base=await this.runtime.from("products").update({name:input.title,price:input.salePrice ?? input.rentalPricePerDay ?? 0,stock:input.stock}).eq("id",id); if(base.error) throw base.error;
      const extension=await this.runtime.from("marketplace_products").update({category_id:categoryId || null,listing_type:input.type,description:input.description,rental_price_per_day:input.rentalPricePerDay,deposit_amount:input.depositAmount,condition:input.condition,location:input.location,status:input.status,published_at:input.status === "published" ? new Date().toISOString() : null,updated_at:new Date().toISOString()}).eq("product_id",id); if(extension.error) throw extension.error;
      return (await this.findProduct(id))!;
    });
  }
  override async listCart(): Promise<CartItem[]> {
    return this.safe(async () => {
      const userId = await this.user(false); if (!userId) return [];
      const cartId = await this.cartId(userId, false); if (!cartId) return [];
      const result = await this.runtime.from("marketplace_cart_items").select("*").eq("cart_id", cartId); if (result.error) throw result.error;
      const products = new Map((await this.listProducts()).map((product) => [product.id, product]));
      return rows(result.data).flatMap((item) => {
        const product = products.get(str(item.product_id)); if (!product) return [];
        return [{ id: str(item.id), productId: product.id, product, quantity: num(item.quantity), mode: str(item.mode) as CartItem["mode"], rental: item.mode === "rental" ? this.rental(item, product.depositAmount ?? 0) : undefined }];
      });
    });
  }

  override async setCartItem(product: CartItem["product"], quantity: number, mode: CartItem["mode"], rental?: RentalSelection): Promise<void> {
    await this.safe(async () => {
      const cartId = await this.cartId(await this.user(), true);
      const result = await this.runtime.from("marketplace_cart_items").upsert({ cart_id: cartId, product_id: product.id, quantity: Math.max(1, quantity), mode, rental_start: rental?.startDate || null, rental_end: rental?.endDate || null, updated_at: new Date().toISOString() }, { onConflict: "cart_id,product_id,mode" });
      if (result.error) throw result.error;
    });
  }

  override async removeCartItem(id: string): Promise<void> { await this.safe(async () => { const result = await this.runtime.from("marketplace_cart_items").delete().eq("id", id); if (result.error) throw result.error; }); }
  override async clearCart(): Promise<void> { await this.safe(async () => { const userId = await this.user(false); if (!userId) return; const cartId = await this.cartId(userId, false); if (!cartId) return; const result = await this.runtime.from("marketplace_cart_items").delete().eq("cart_id", cartId); if (result.error) throw result.error; }); }

  override async createOrder(input: CheckoutInput): Promise<MarketplaceOrder> {
    return this.safe(async () => {
      const cartId = await this.cartId(await this.user(), false); if (!cartId) throw new Error("Le panier est vide.");
      const result = await this.runtime.rpc("marketplace_checkout", { p_cart_id: cartId, p_customer_name: input.customerName, p_customer_email: input.customerEmail, p_customer_phone: input.customerPhone, p_fulfillment_method: input.fulfillment, p_delivery_address: input.address, p_payment_method: input.paymentMethod.type, p_idempotency_key: crypto.randomUUID() });
      if (result.error) throw result.error;
      const id = str(rows(result.data)[0]?.order_id); const order = id ? await this.findOrder(id) : null;
      if (!order) throw new Error("La commande n'a pas Ã©tÃ© crÃ©Ã©e."); return order;
    });
  }

  override async listOrders(): Promise<MarketplaceOrder[]> {
    return this.safe(async () => { const result = await this.runtime.from("marketplace_orders").select("*").order("created_at", { ascending: false }); if (result.error) throw result.error; return Promise.all(rows(result.data).map((order) => this.hydrateOrder(order))); });
  }

  override async findOrder(id: string): Promise<MarketplaceOrder | null> {
    return this.safe(async () => { const result = await this.runtime.from("marketplace_orders").select("*").eq("id", id).maybeSingle(); if (result.error) throw result.error; return result.data ? this.hydrateOrder(result.data as Row) : null; });
  }

  override async updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
    await this.safe(async () => {
      const current = await this.findOrder(id); if (!current) throw new Error("Commande introuvable."); const actor = await this.user();
      const update = await this.runtime.from("marketplace_orders").update({ status, updated_at: new Date().toISOString() }).eq("id", id); if (update.error) throw update.error;
      const history = await this.runtime.from("marketplace_order_status_history").insert({ order_id: id, from_status: current.status, to_status: status, changed_by: actor }); if (history.error) throw history.error;
    });
  }

  override async deleteOrder(_id: string): Promise<void> { void _id; throw new Error("Une commande est immuable. Utilisez l'annulation ou le remboursement."); }

  override async adjustStock(productId: string, quantity: number, _reason?: string): Promise<void> { void _reason; await super.adjustStock(productId, quantity); }

  override async listDeliveries(): Promise<DeliveryRecord[]> {
    return this.safe(async () => { const result = await this.runtime.from("marketplace_deliveries").select("*").order("updated_at", { ascending: false }); if (result.error) throw result.error; return rows(result.data).map((item) => ({ id: str(item.id), orderId: str(item.order_id), method: str(item.method) as DeliveryRecord["method"], address: str(item.address), carrier: str(item.carrier) || undefined, trackingNumber: str(item.tracking_number) || undefined, status: str(item.status) as DeliveryRecord["status"], updatedAt: str(item.updated_at) })); });
  }

  override async listTransactions(): Promise<MarketplaceTransaction[]> {
    return this.safe(async () => { const result = await this.runtime.from("marketplace_transactions").select("*").order("created_at", { ascending: false }); if (result.error) throw result.error; return rows(result.data).map((item) => ({ id: str(item.id), orderId: str(item.order_id), sellerId: str(item.seller_organization_id), amount: num(item.amount), paymentMethod: methods.mobile_money, paymentStatus: str(item.status) === "completed" ? "paid" : "pending", createdAt: str(item.created_at) })); });
  }

  override async sellerStatistics(): Promise<SellerStatistics> {
    const [products, orders, inventory] = await Promise.all([this.listProducts(), this.listOrders(), this.listInventory()]); const paid = orders.filter((order) => order.paymentStatus === "paid");
    return { products: products.length, sales: paid.flatMap((order) => order.lines).filter((line) => line.mode === "sale").length, rentals: paid.flatMap((order) => order.lines).filter((line) => line.mode === "rental").length, orders: orders.length, revenue: paid.reduce((sum, order) => sum + order.total, 0), lowStock: inventory.filter((item) => item.available <= item.lowStockThreshold).length, customers: new Set(orders.map((order) => order.customerId)).size, recentProducts: products.slice(0, 5) };
  }

  override async sellerCustomers(): Promise<SellerCustomer[]> {
    const customers = new Map<string, SellerCustomer>(); (await this.listOrders()).forEach((order) => { const current = customers.get(order.customerId); customers.set(order.customerId, { id: order.customerId, name: order.customerName, email: order.customerEmail, orders: (current?.orders ?? 0) + 1, totalSpent: (current?.totalSpent ?? 0) + (order.paymentStatus === "paid" ? order.total : 0) }); }); return [...customers.values()];
  }

  private async hydrateOrder(order: Row): Promise<MarketplaceOrder> {
    const id = str(order.id); const [lineResult, historyResult, transactionResult] = await Promise.all([this.runtime.from("marketplace_order_lines").select("*").eq("order_id", id), this.runtime.from("marketplace_order_status_history").select("*").eq("order_id", id).order("created_at"), this.runtime.from("marketplace_transactions").select("id").eq("order_id", id).eq("transaction_type", "charge").order("created_at", { ascending: false }).limit(1).maybeSingle()]);
    if (lineResult.error) throw lineResult.error; if (historyResult.error) throw historyResult.error; if (transactionResult.error) throw transactionResult.error;
    let method = methods.cash; const transactionId = transactionResult.data ? str((transactionResult.data as Row).id) : "";
    if (transactionId) { const payment = await this.runtime.from("marketplace_payments").select("method").eq("transaction_id", transactionId).order("created_at", { ascending: false }).limit(1).maybeSingle(); if (payment.error) throw payment.error; if (payment.data) method = methods[str((payment.data as Row).method)] ?? method; }
    return { id, customerId: str(order.customer_id), customerName: str(order.customer_name), customerEmail: str(order.customer_email), customerPhone: str(order.customer_phone), sellerId: str(order.seller_organization_id), lines: rows(lineResult.data).map((line): OrderLine => ({ id: str(line.id), productId: str(line.product_id), title: str(line.product_title), quantity: num(line.quantity), unitPrice: num(line.unit_price), mode: str(line.mode) as OrderLine["mode"], rental: line.mode === "rental" ? this.rental(line) : undefined, total: num(line.line_total) })), address: str(order.delivery_address), fulfillment: str(order.fulfillment_method) as MarketplaceOrder["fulfillment"], subtotal: num(order.subtotal), fees: num(order.fees), total: num(order.total), status: str(order.status) as MarketplaceOrder["status"], paymentMethod: method, paymentStatus: str(order.payment_status) as MarketplaceOrder["paymentStatus"], statusHistory: rows(historyResult.data).map((entry): OrderStatusEntry => ({ status: str(entry.to_status) as OrderStatus, changedAt: str(entry.created_at), note: str(entry.note) || undefined })), createdAt: str(order.created_at), updatedAt: str(order.updated_at) };
  }

  private rental(row: Row, depositAmount = 0): RentalSelection { const startDate = str(row.rental_start); const endDate = str(row.rental_end); return { startDate, endDate, days: startDate && endDate ? Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1) : 1, depositAmount, status: "pending" }; }
  private async categoryId(name: string): Promise<string> { if(!name.trim()) return ""; const result=await this.runtime.from("marketplace_categories").select("id").ilike("name",name.trim()).maybeSingle(); if(result.error) throw result.error; return result.data ? str((result.data as Row).id) : ""; }
  private async user(required = true): Promise<string> { const result = await this.runtime.auth.getUser(); const id = result.data.user?.id ?? ""; if (required && (!id || result.error)) throw result.error ?? new Error("Connectez-vous pour utiliser la marketplace."); return id; }
  private async cartId(userId: string, create: boolean): Promise<string> { const current = await this.runtime.from("marketplace_carts").select("id").eq("customer_id", userId).eq("status", "active").maybeSingle(); if (current.error) throw current.error; if (current.data) return str((current.data as Row).id); if (!create) return ""; const inserted = await this.runtime.from("marketplace_carts").insert({ customer_id: userId }).select("id").single(); if (inserted.error) throw inserted.error; return str((inserted.data as Row).id); }
  private async safe<T>(operation: () => Promise<T>): Promise<T> { try { return await operation(); } catch (reason) { throw normalizeBackendError(reason); } }
}

export const createMarketplaceRuntimeRepository = () => new MarketplaceRuntimeRepository(createSupabaseBrowserClient());
