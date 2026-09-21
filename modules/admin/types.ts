export interface AdminDashboardStats {

  totalUsers: number;

  totalFighters: number;

  totalClubs: number;

  totalEvents: number;

  totalArticles: number;

  totalProducts: number;

  activeUsersToday: number | null;

  pendingRequests: number;

}





export interface AdminActivity {

  id: string;

  type:
    | "user_registration"
    | "role_request"
    | "content_report"
    | "event_created"
    | "system_alert";

  title: string;

  description?: string;

  createdAt: string;

  userId?: string;

}





export interface AdminAlert {

  id: string;

  level:
    | "info"
    | "warning"
    | "critical";

  title: string;

  message: string;

  createdAt: string;

  resolved: boolean;

}





export interface AdminUserSummary {

  id: string;

  email: string;

  fullName?: string | null;

  roles: string[];

  status:
    | "active"
    | "blocked"
    | "pending";

  createdAt: string;

}





export interface AdminDashboardData {

  stats: AdminDashboardStats;

  activities: AdminActivity[] | null;

  alerts: AdminAlert[] | null;

}





export interface AdminPermissionCheck {

  userId: string;

  permission: string;

  allowed: boolean;

}