import type { ErpTabDefinition } from "@/modules/erp-navigation";

export type UniversalRoleId =
  | 'super-admin'
  | 'admin'
  | 'federation'
  | 'league'
  | 'club'
  | 'coach'
  | 'official'
  | 'referee'
  | 'judge'
  | 'sponsor'
  | 'seller'
  | 'fan';

export type UniversalIconKey =
  | 'overview' | 'users' | 'organizations' | 'events' | 'sport' | 'finance'
  | 'security' | 'documents' | 'communication' | 'performance' | 'settings'
  | 'live' | 'training' | 'medical' | 'commerce' | 'contracts' | 'tickets' | 'calendar';

export type UniversalModule = {
  id: string;
  label: string;
  tabs: readonly ErpTabDefinition[];
  icon: UniversalIconKey;
  live?: boolean;
};

export type UniversalKpi = {
  label: string;
  value: string;
  detail: string;
  tone: 'red' | 'blue' | 'green' | 'amber';
};

export type UniversalRoleDefinition = {
  id: UniversalRoleId;
  label: string;
  guardRole: string;
  workspaceStatus: string;
  modules: UniversalModule[];
  overview: {
    kpis: UniversalKpi[];
    focusLabel: string;
    focusTitle: string;
    focusDetail: string;
    readiness: number;
    alerts: Array<{ label: string; detail: string; severity: 'critical' | 'warning' | 'info' }>;
    activity: Array<{ label: string; detail: string }>;
    quickActions: Array<{ label: string; moduleId: string; tab?: string }>;
  };
  live: {
    title: string;
    subtitle: string;
    metric: string;
    metricLabel: string;
    secondary: Array<{ label: string; value: string; tone?: 'red' | 'green' | 'blue' }>;
  };
};
