export type ErpRecordStatus = "draft" | "active" | "archived";

export interface ErpRecord {
  id: string;
  title: string;
  category: string;
  status: ErpRecordStatus;
  description: string;
  updatedAt: string;
}

export type ErpRecordInput = Omit<ErpRecord, "id" | "updatedAt">;

export interface ErpModuleDefinition {
  key: string;
  label: string;
  entityLabel: string;
  entityLabelPlural: string;
  basePath: string;
  capabilities: readonly string[];
}

export interface ErpFilters {
  search: string;
  status: "all" | ErpRecordStatus;
}

export interface ErpStatistics {
  total: number;
  active: number;
  draft: number;
  archived: number;
}
