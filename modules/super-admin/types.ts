export type AnalyticsPeriodDays = 7 | 30 | 90 | 365;

export interface SuperAdminPeriod {
  from: string;
  to: string;
  previousFrom: string;
  previousTo: string;
}

export interface SuperAdminOverview {
  totalUsers: number;
  newUsers: number;
  newUsersGrowth: number | null;
  verifiedUsers: number;
  verifiedUserRate: number;
  fighters: number;
  newFighters: number;
  clubs: number;
  organizations: number;
  verifiedOrganizations: number;
  events: number;
  newEvents: number;
  newEventsGrowth: number | null;
  fights: number;
  ticketRevenue: number;
  ticketRevenueGrowth: number | null;
  ticketsSold: number;
  messages: number;
  messagesGrowth: number | null;
}

export interface SuperAdminSportMetrics {
  eventsCreated: number;
  eventsCompleted: number;
  eventsCancelled: number;
  averageReadiness: number;
  fightsCreated: number;
  fightsCompleted: number;
  fightCompletionRate: number;
}

export interface SuperAdminBusinessMetrics {
  ticketRevenue: number;
  ticketsSold: number;
  eventRevenue: number;
  eventExpenses: number;
  eventNet: number;
  sponsoringValue: number;
  activeSubscriptions: number;
  activeSubscriptionValue: number;
}

export interface SuperAdminCommunityMetrics {
  messages: number;
  conversationsCreated: number;
  socialPublishingAvailable: boolean;
}

export interface SuperAdminGovernanceMetrics {
  administrators: number;
}

export interface SuperAdminSystemMetrics {
  databaseSizeBytes: number;
  databaseConnections: number;
  databaseCacheHitRate: number | null;
}

export interface SuperAdminBreakdownItem {
  label: string;
  value: number;
  slug?: string;
  regionId?: string;
  disciplineId?: string;
}

export interface SuperAdminGrowthPoint {
  date: string;
  users: number;
  fighters: number;
  events: number;
}

export interface SuperAdminAnalyticsSnapshot {
  period: SuperAdminPeriod;
  overview: SuperAdminOverview;
  sport: SuperAdminSportMetrics;
  business: SuperAdminBusinessMetrics;
  community: SuperAdminCommunityMetrics;
  governance: SuperAdminGovernanceMetrics;
  system: SuperAdminSystemMetrics;
  breakdowns: {
    roles: SuperAdminBreakdownItem[];
    regions: SuperAdminBreakdownItem[];
    disciplines: SuperAdminBreakdownItem[];
  };
  growthSeries: SuperAdminGrowthPoint[];
}

export interface SuperAdminAdministrator {
  profileId: string;
  fullName: string;
  email: string;
  status: string | null;
  verified: boolean;
  adminSince: string | null;
  permissions: string[];
}

export interface SuperAdminPermission {
  id: string;
  code: string;
  description: string | null;
}

export interface SuperAdminProfileCandidate {
  profileId: string;
  fullName: string;
  email: string;
  status: string | null;
  verified: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

export interface SuperAdminAccessLog {
  id: string;
  actorProfileId: string;
  actorName: string | null;
  targetProfileId: string | null;
  targetName: string | null;
  action: string;
  details: Record<string, unknown>;
  createdAt: string;
}

export type SuperAdminAnalyticsSection =
  | "growth"
  | "users"
  | "sport"
  | "business"
  | "community"
  | "organizations"
  | "geography"
  | "performance"
  | "system";
