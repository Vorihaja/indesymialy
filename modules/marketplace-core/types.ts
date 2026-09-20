export type ListingType = "sale" | "rental" | "used";
export type ProductStatus = "draft" | "published" | "archived" | "inactive";
export type ProductLifecycleTarget = Exclude<ProductStatus, "draft">;
export type ProductCondition = "new" | "excellent" | "good" | "used";
export interface MarketplaceProduct { id: string; title: string; description: string; type: ListingType; category: string; categorySlug?: string; salePrice: number | null; rentalPricePerDay: number | null; depositAmount: number | null; stock: number; condition: ProductCondition; images: string[]; sellerId: string; sellerName: string; location: string; status: ProductStatus; popularity: number; createdAt: string; updatedAt: string; }
export type ProductInput = Omit<MarketplaceProduct, "id" | "popularity" | "createdAt" | "updatedAt">;

export interface MarketplaceSellerOrganization {
  id: string;
  name: string;
  type: string;
  ownerId: string;
}

export interface MarketplaceSellerContext {
  organization: MarketplaceSellerOrganization | null;
  candidates: MarketplaceSellerOrganization[];
  requiresSelection: boolean;
}
export interface ProductFilters { search: string; type: ListingType | "all"; category: string; condition: ProductCondition | "all"; location: string; sort: "recent" | "popular" | "price-asc" | "price-desc"; page: number; pageSize: number; }
export interface CatalogResult { items: MarketplaceProduct[]; total: number; page: number; pageCount: number; recommended: MarketplaceProduct[]; recent: MarketplaceProduct[]; popular: MarketplaceProduct[]; }
export interface RentalSelection { startDate: string; endDate: string; days: number; depositAmount: number; status: "pending" | "active" | "returned" | "cancelled"; }
export interface CartItem { id: string; productId: string; product: MarketplaceProduct; quantity: number; mode: "sale" | "rental"; rental?: RentalSelection; }
export interface CartSummary { subtotal: number; fees: number; total: number; itemCount: number; }
export type OrderStatus = "draft" | "pending" | "confirmed" | "prepared" | "shipped" | "ready_for_pickup" | "delivered" | "cancelled" | "refunded";
export type FulfillmentMethod = "delivery" | "pickup";
export type PaymentStatus = "unpaid" | "pending" | "paid" | "failed" | "refunded";
export interface PaymentMethod { id: string; label: string; type: "cash" | "mobile_money" | "card" | "bank_transfer"; enabled: boolean; }
export interface OrderLine { id: string; productId: string; title: string; quantity: number; unitPrice: number; mode: "sale" | "rental"; rental?: RentalSelection; total: number; }
export interface OrderStatusEntry { status: OrderStatus; changedAt: string; note?: string; }
export interface MarketplaceOrder { id: string; customerId: string; customerName: string; customerEmail: string; customerPhone: string; sellerId: string; lines: OrderLine[]; address: string; fulfillment: FulfillmentMethod; subtotal: number; fees: number; total: number; status: OrderStatus; paymentMethod: PaymentMethod; paymentStatus: PaymentStatus; paymentId?: string; statusHistory: OrderStatusEntry[]; createdAt: string; updatedAt: string; }
export type CheckoutInput = Pick<MarketplaceOrder, "customerName" | "customerEmail" | "customerPhone" | "address" | "fulfillment" | "paymentMethod">;
export interface StockMovement { id: string; productId: string; type: "in" | "out" | "reserve" | "release" | "adjustment"; quantity: number; reason: string; createdAt: string; }
export interface InventoryItem { productId: string; title: string; available: number; reserved: number; lowStockThreshold: number; movements: StockMovement[]; }
export interface DeliveryRecord { id: string; orderId: string; method: FulfillmentMethod; address: string; carrier?: string; trackingNumber?: string; status: "pending" | "prepared" | "in_transit" | "ready" | "completed" | "failed"; updatedAt: string; }
export interface MarketplaceTransaction { id: string; orderId: string; sellerId: string; amount: number; paymentMethod: PaymentMethod; paymentStatus: PaymentStatus; createdAt: string; }
export interface SellerStatistics { products: number; sales: number; rentals: number; orders: number; revenue: number; lowStock: number; customers: number; recentProducts: MarketplaceProduct[]; }
export interface SellerCustomer { id: string; name: string; email: string; orders: number; totalSpent: number; }
