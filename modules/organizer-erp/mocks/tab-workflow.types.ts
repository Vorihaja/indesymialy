export type OrganizerTabSeed = {
  action: string;
  columns: string[];
  rows: string[][];
  stages: string[];
  activeStage?: number;
  rowActions: string[];
};
