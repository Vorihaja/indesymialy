export interface SuperAdminMarketplacePeriod {
  from: string;
  to: string;
  previousFrom: string;
  previousTo: string;
}

export interface SuperAdminMarketplaceHeadline {
  primaryCurrency: string | null;

  gmv: number;
  gmvGrowth: number | null;

  orders: number;
  ordersGrowth: number | null;

  paidOrders: number;
  paymentSuccessRate: number;

  averageOrderValue: number;

  buyers: number;
  repeatBuyerRate: number;

  sellers: number;

  products: number;
  publishedProducts: number;
  productsAdded: number;

  lowStock: number;
  outOfStock: number;

  favorites: number;
  favoritesAdded: number;

  activeCarts: number;
}

export interface SuperAdminMarketplaceFunnel {
  cartsCreated: number;
  checkoutGroups: number;
  orders: number;
  paidOrders: number;
  checkoutRate: number;
}

export interface SuperAdminMarketplaceCommerce {
  saleUnits: number;
  rentalUnits: number;

  activeRentals: number;
  returnedRentals: number;

  availableUnits: number;
  reservedUnits: number;

  fees: number;

  deliveryCompletionRate: number;
}

export interface SuperAdminMarketplaceBreakdown {
  label: string;
  value: number;
  amount?: number;
  currency?: string;
  id?: string;
  orders?: number;
  units?: number;
}

export interface SuperAdminMarketplaceCurrency {
  currency: string;
  orders: number;
  gmv: number;
}

export interface SuperAdminMarketplaceDailyPoint {
  date: string;
  orders: number;
  paidOrders: number;
  gmv: number;
}

export interface SuperAdminMarketplaceAnalytics {
  period: SuperAdminMarketplacePeriod;

  headline: SuperAdminMarketplaceHeadline;

  funnel: SuperAdminMarketplaceFunnel;

  commerce: SuperAdminMarketplaceCommerce;

  breakdowns: {
    orderStatuses: SuperAdminMarketplaceBreakdown[];
    listingTypes: SuperAdminMarketplaceBreakdown[];
    categories: SuperAdminMarketplaceBreakdown[];
    paymentMethods: SuperAdminMarketplaceBreakdown[];
    paymentStatuses: SuperAdminMarketplaceBreakdown[];
    topSellers: SuperAdminMarketplaceBreakdown[];
    topProducts: SuperAdminMarketplaceBreakdown[];
    transactionTypes: SuperAdminMarketplaceBreakdown[];
    currencies: SuperAdminMarketplaceCurrency[];
  };

  dailySeries: SuperAdminMarketplaceDailyPoint[];
}
