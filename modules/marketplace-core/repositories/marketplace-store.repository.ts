import type {
  CartItem,
  CheckoutInput,
  DeliveryRecord,
  InventoryItem,
  MarketplaceOrder,
  MarketplaceProduct,
  MarketplaceTransaction,
  OrderStatus,
  ProductInput,
  RentalSelection,
  SellerCustomer,
  SellerStatistics,
} from "../types";

export interface MarketplaceStoreRepository {
  listProducts(): Promise<MarketplaceProduct[]>;

  findProduct(
    id: string,
  ): Promise<MarketplaceProduct | null>;

  createProduct(
    input: ProductInput,
  ): Promise<MarketplaceProduct>;

  updateProduct(
    id: string,
    input: ProductInput,
  ): Promise<MarketplaceProduct>;

  deleteProduct(
    id: string,
  ): Promise<void>;

  listCart(): Promise<CartItem[]>;

  setCartItem(
    product: MarketplaceProduct,
    quantity: number,
    mode: "sale" | "rental",
    rental?: RentalSelection,
  ): Promise<void>;

  removeCartItem(
    id: string,
  ): Promise<void>;

  clearCart(): Promise<void>;

  listOrders(): Promise<MarketplaceOrder[]>;

  findOrder(
    id: string,
  ): Promise<MarketplaceOrder | null>;

  createOrder(
    input: CheckoutInput,
  ): Promise<MarketplaceOrder>;

  updateOrderStatus(
    id: string,
    status: OrderStatus,
    reason?: string,
  ): Promise<void>;

  confirmPaymentPaid(
    paymentId: string,
    providerReference?: string,
    reason?: string,
  ): Promise<string>;

  deleteOrder(
    id: string,
  ): Promise<void>;

  listInventory(): Promise<InventoryItem[]>;

  adjustStock(
    productId: string,
    quantity: number,
    reason: string,
  ): Promise<void>;

  listDeliveries(): Promise<DeliveryRecord[]>;

  listTransactions(): Promise<MarketplaceTransaction[]>;

  sellerStatistics(): Promise<SellerStatistics>;

  sellerCustomers(): Promise<SellerCustomer[]>;
}
