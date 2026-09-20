export type PerformanceCurrency = {
  currency: string;
  orders: number;
  subtotal: number;
  total: number;
  averageOrder: number;
};

export type PerformanceAmount = {
  currency: string;
  orders: number;
  revenue: number;
  units?: number;
};

export type PerformanceProduct = {
  productId: string;
  title: string;
  orders: number;
  units: number;
  amounts: PerformanceAmount[];
};

export type PerformanceCustomer = {
  customerId: string;
  name: string;
  orders: number;
  amounts: PerformanceAmount[];
};

export type PerformanceTrend = {
  day: string;
  currency: string;
  orders: number;
  revenue: number;
};

export type SellerPerformanceSnapshot = {
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
  currencies: PerformanceCurrency[];
  products: PerformanceProduct[];
  customersRanking: PerformanceCustomer[];
  trend: PerformanceTrend[];
};