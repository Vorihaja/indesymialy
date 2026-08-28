
import {
  WORKSPACE_DASHBOARD_PATHS,
  getWorkspaceDashboardPath,
} from "@/modules/workspace-registry";

export const ROLE_DASHBOARD_PATHS: Record<
  string,
  string
> = WORKSPACE_DASHBOARD_PATHS;

export function getRoleDashboardPath(
  roleSlug?: string | null,
) {
  return getWorkspaceDashboardPath(roleSlug);
}
