
export type WorkspaceTechnicalRole =
  | "super_admin"
  | "admin"
  | "federation"
  | "league"
  | "club"
  | "coach"
  | "fighter"
  | "organizer"
  | "official"
  | "referee"
  | "judge"
  | "sponsor"
  | "seller"
  | "fan";

export type WorkspaceRouteRole =
  | "super-admin"
  | "admin"
  | "federation"
  | "league"
  | "club"
  | "coach"
  | "fighter"
  | "organizer"
  | "official"
  | "referee"
  | "judge"
  | "sponsor"
  | "seller"
  | "fan";

export type WorkspaceAccessKind =
  | "system"
  | "business";

export interface WorkspaceRegistryEntry {
  technicalRole: WorkspaceTechnicalRole;
  workspaceRole: WorkspaceRouteRole;
  label: string;
  basePath: string;
  description: string;
  accessKind: WorkspaceAccessKind;
  aliases: readonly string[];
}
