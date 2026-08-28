export interface SuperAdminBusinessPeriod {
  from: string;
  to: string;
  previousFrom: string;
  previousTo: string;
}

export interface SuperAdminBusinessHeadline {
  primaryCurrency: string | null;

  businessVolume: number;
  businessVolumeGrowth: number | null;

  marketplaceGmv: number;
  ticketingRevenue: number;
  sponsorshipValue: number;

  marketplacePaidOrders: number;

  ticketTransactions: number;
  ticketUnits: number;

  paidSponsorContracts: number;

  activeSubscriptions: number;

  financialPayments: number;

  ticketSalesWithoutCurrency: number;
}

export interface SuperAdminBusinessBreakdown {
  label: string;

  value: number;

  amount?: number;

  currency?: string;

  id?: string;

  units?: number;

  contracts?: number;
}

export interface SuperAdminBusinessCurrency {
  currency: string;

  marketplace: number;

  ticketing: number;

  sponsorship: number;

  total: number;
}

export interface SuperAdminBusinessDailyPoint {
  date: string;

  marketplace: number;

  ticketing: number;

  sponsorship: number;

  total: number;
}

export interface SuperAdminBusinessAnalytics {
  period: SuperAdminBusinessPeriod;

  headline: SuperAdminBusinessHeadline;

  breakdowns: {
    sources: SuperAdminBusinessBreakdown[];

    currencies: SuperAdminBusinessCurrency[];

    subscriptionPlans: SuperAdminBusinessBreakdown[];

    financialSources: SuperAdminBusinessBreakdown[];

    financialStatuses: SuperAdminBusinessBreakdown[];

    topEvents: SuperAdminBusinessBreakdown[];

    topSponsors: SuperAdminBusinessBreakdown[];
  };

  dailySeries: SuperAdminBusinessDailyPoint[];
}
