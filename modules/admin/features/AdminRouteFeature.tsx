import { notFound } from "next/navigation";
import type { AdminAccessLevel } from "@/modules/admin-core";
import { AdminUsersFeature } from "@/modules/admin-users";
import { AdminOrganizationsFeature } from "@/modules/admin-organizations";
import { AdminModerationFeature } from "@/modules/admin-moderation";
import { AdminReportsFeature } from "@/modules/admin-reports";
import { AdminAnalyticsFeature } from "@/modules/admin-analytics";
import { AdminSettingsFeature } from "@/modules/admin-settings";
import { AdminAuditLogFeature } from "@/modules/admin-audit-log";
import { AdminPlatformHealthFeature } from "@/modules/admin-platform-health";
import { FinanceFeature } from "@/modules/finance-erp";
import { RoleLiveFeature } from "@/modules/fight-live";
import { UniversalErpPrototype } from "@/modules/universal-erp";
export function AdminRouteFeature({ section, access }: { section: string; access: AdminAccessLevel }) { const base = `/dashboard/${access}`; if (section === "live") return <UniversalErpPrototype role={access} initialModule="live" routeContent={<RoleLiveFeature role={access} />} />; if (section === "finance") return <FinanceFeature role={access} />; if (section === "users" || section === "roles" || section === "role-requests" || section === "permissions") return <AdminUsersFeature domain={section} access={access} detailBasePath={section === "users" ? `${base}/users` : undefined} />; if (section === "events") return <AdminOrganizationsFeature domain="events" access={access} />; if (section === "organizations" || section === "clubs" || section === "fighters") return <AdminOrganizationsFeature domain={section} access={access} detailBasePath={`${base}/${section}`} />; if (section === "moderation" || section === "social" || section === "marketplace") return <AdminModerationFeature domain={section} access={access} />; if (section === "reports") return <AdminReportsFeature access={access} />; if (section === "analytics") return <AdminAnalyticsFeature access={access} />; if (section === "audit-log") return <AdminAuditLogFeature access={access} />; if (section === "platform-health") return <AdminPlatformHealthFeature access={access} />; if (section === "settings") return <AdminSettingsFeature access={access} />; notFound(); }
