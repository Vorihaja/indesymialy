
import {
  WORKSPACE_REGISTRY,
} from "@/modules/workspace-registry";

export const ERP_PREVIEW_ACCESS_ENABLED =
  process.env.NODE_ENV === "development" ||
  process.env.NEXT_PUBLIC_ERP_PREVIEW_ACCESS ===
    "true";

export const ERP_PREVIEW_ROLES =
  WORKSPACE_REGISTRY.map((entry) => ({
    slug: entry.technicalRole,
    label: entry.label,
    path: entry.basePath,
  }));
