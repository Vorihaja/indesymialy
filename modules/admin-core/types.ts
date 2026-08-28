export type AdminAccessLevel = "admin" | "super-admin";
export type RecordStatus = "active" | "pending" | "suspended" | "blocked" | "archived";
export type ModerationDecision = "warn" | "hide" | "remove" | "restore" | "suspend_author";

export interface AdminMetric { id: string; label: string; value: number; trend: number; detail: string; }
export interface AdminTrendPoint { label: string; value: number; }
export interface AdminAlert { id: string; severity: "info" | "warning" | "critical"; title: string; detail: string; }
export interface AdminDashboardSnapshot { metrics: AdminMetric[]; trends: AdminTrendPoint[]; alerts: AdminAlert[]; quickActions: Array<{ label: string; href: string }>; }

export interface AdminUserRecord { id: string; name: string; email: string; status: RecordStatus; businessRoles: string[]; systemRoles: Array<"admin" | "super_admin">; organizations: string[]; publishedContent: number; linkedReports: number; createdAt: string; history: string[]; }
export interface AdminRoleRecord { id: string; label: string; kind: "business" | "system"; status: RecordStatus; permissions: string[]; }
export interface AdminRoleRequest { id: string; userName: string; requestedRole: string; status: "pending" | "approved" | "refused" | "suspended"; requestedAt: string; decisions: string[]; }
export interface AdminPermissionRecord { id: string; code: string; description: string; roles: string[]; }
export interface AdminOrganizationRecord { id: string; name: string; kind: "organization" | "club"; owner: string; members: number; status: RecordStatus; organizationId?: string; integrityAlerts: string[]; }
export interface AdminSportRecord { id: string; name: string; kind: "fighter" | "event"; region: string; discipline: string; status: RecordStatus; verified: boolean; recentActivity: string; reports: number; }
export interface AdminModerationRecord { id: string; source: "social" | "marketplace"; targetType: "post" | "discussion" | "comment" | "media" | "profile" | "product" | "seller" | "order"; targetLabel: string; reason: string; author: string; status: "open" | "reviewing" | "resolved"; createdAt: string; history: string[]; }
export interface AdminReportRecord { id: string; category: string; source: "social" | "marketplace" | "platform"; reporter: string; target: string; priority: "low" | "medium" | "high"; status: "open" | "reviewing" | "closed"; createdAt: string; }
export interface AdminAnalyticsSnapshot { metrics: AdminMetric[]; series: Array<{ id: string; label: string; dimension: "time" | "role" | "region" | "discipline"; points: AdminTrendPoint[] }>; }
export interface AdminSettingRecord { id: string; group: "identity" | "maintenance" | "registrations" | "moderation" | "marketplace" | "notifications" | "limits" | "regional" | "security" | "features"; label: string; value: string | boolean | number; critical: boolean; }
export interface AdminAuditEntry { id: string; actor: string; action: string; target: string; occurredAt: string; before: string; after: string; reason: string; status: "success" | "failed"; metadata: Record<string, string>; }
export interface AdminHealthCheck { id: string; area: "typescript" | "build" | "lint" | "modules" | "routes" | "supabase" | "storage" | "errors" | "tasks" | "debt" | "integrations"; label: string; status: "healthy" | "warning" | "critical" | "unknown"; detail: string; checkedAt: string; }
export type AdminDomain = "dashboard" | "users" | "roles" | "role-requests" | "permissions" | "organizations" | "clubs" | "fighters" | "events" | "moderation" | "social" | "marketplace" | "reports" | "analytics" | "audit-log" | "platform-health" | "settings";

export interface AdminDomainData { title: string; description: string; metrics: AdminMetric[]; columns: string[]; rows: Array<{ id: string; cells: string[]; status?: string }>; actions: string[]; }
