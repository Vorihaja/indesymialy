import type { ErpTabDefinition } from "@/modules/erp-navigation";

export type FighterModuleId =
  | 'overview'
  | 'profile'
  | 'career'
  | 'training'
  | 'fight-preparation'
  | 'competitions'
  | 'health'
  | 'team'
  | 'finance'
  | 'sponsors'
  | 'performance'
  | 'calendar'
  | 'marketplace'
  | 'settings'
  | 'fight-room';

export type FighterModule = {
  id: FighterModuleId;
  label: string;
  tabs: readonly ErpTabDefinition[];
  live?: boolean;
};
