export type MarketplaceCurrencySummary = {
  currency: string;
  orders: number;
  subtotal: number;
  total: number;
  averageOrder: number;
};

export type MarketplaceAmount = {
  currency: string;
  orders: number;
  revenue: number;
  units?: number;
};

export type MarketplaceProductPerformance = {
  productId: string;
  title: string;
  orders: number;
  units: number;
  amounts: MarketplaceAmount[];
};

export type MarketplaceCustomerPerformance = {
  customerId: string;
  name: string;
  orders: number;
  amounts: MarketplaceAmount[];
};

export type MarketplacePerformanceSnapshot = {
  organizationId: string;
  from: string;
  to: string;
  orders: number;
  paidOrders: number;
  customers: number;
  repeatCustomers: number;
  carts: number;
  convertedCarts: number;
  abandonedCarts: number;
  conversionRate: number;
  currencies: MarketplaceCurrencySummary[];
  products: MarketplaceProductPerformance[];
  customersRanking: MarketplaceCustomerPerformance[];
};

export type MarketplaceLedgerCurrency = {
  currency: string;
  revenue: number;
  expense: number;
  net: number;
};

export type MarketplaceLedgerEntry = {
  id: string;
  paymentId: string | null;
  entryType: "revenue" | "expense";
  amount: number;
  currency: string;
  occurredAt: string;
  description: string;
  reference: string | null;
  sourceId: string | null;
  orderId: string | null;
  paymentMethod: string | null;
  providerReference: string | null;
};

export type SellerMarketplaceSnapshot = {
  generatedAt: string;
  periodDays: number;

  performance: MarketplacePerformanceSnapshot;

  ledger: {
    organizationId: string;
    currencies: MarketplaceLedgerCurrency[];
    entries: MarketplaceLedgerEntry[];
  };
};