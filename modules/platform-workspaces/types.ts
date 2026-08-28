
import type {
  WorkspaceRouteRole,
} from "@/modules/workspace-registry";

export const WORKSPACE_SECTIONS = [
  "profile",
  "management",
  "statistics",
  "documents",
  "calendar",
  "settings",
  "notifications",
] as const;

export type WorkspaceSection =
  (typeof WORKSPACE_SECTIONS)[number];

export type WorkspaceRole =
  WorkspaceRouteRole;

export interface WorkspaceNavigationItem {
  href: string;
  label: string;
  section: string;
}

export interface WorkspaceDefinition {
  role: WorkspaceRole;
  label: string;
  basePath: string;
  description: string;
  navigation: WorkspaceNavigationItem[];
}

export interface WorkspaceSnapshot {
  title: string;
  value: string;
  detail: string;
}
