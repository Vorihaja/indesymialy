import type { ErpTabDefinition } from "@/modules/erp-navigation";

export type OrganizerModuleId = 'overview' | 'events' | 'fight-center' | 'ticketing' | 'team' | 'operations' | 'partners' | 'finance' | 'performance' | 'personnel' | 'marketplace' | 'calendar' | 'settings' | 'control-room';

export type OrganizerModule = {
  id: OrganizerModuleId;
  label: string;
  tabs: readonly ErpTabDefinition[];
  live?: boolean;
};

export type OrganizerKpiMock = {
  label: string;
  value: string;
  detail: string;
  tone?: 'neutral' | 'danger' | 'info' | 'success';
};

export type OrganizerAlertMock = {
  label: string;
  detail: string;
  severity: 'critical' | 'warning' | 'info';
};

export type OrganizerModuleMock = {
  label: string;
  action: string;
  creationMode?: 'event';
  kpis: Array<{ label: string; value: string; detail: string; tone?: 'red' | 'blue' | 'green' | 'amber' }>;
  columns: string[];
  rows: string[][];
  progress?: Array<{ label: string; value: number; detail: string }>;
  focus?: { title: string; items: Array<{ label: string; value: string; status?: 'done' | 'warning' | 'pending' }> };
  ticketTypes?: {
    columns: string[];
    rows: string[][];
  };
  workflow?: {
    label: string;
    stages: string[];
    activeStage: number;
  };
  rowActions?: string[];
};
