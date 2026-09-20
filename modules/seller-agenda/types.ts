export type AgendaItemSource =
  | "manual"
  | "promotion"
  | "bundle"
  | "partnership"
  | "personnel_assignment"
  | "personnel_leave"
  | "personnel_document";

export type AgendaItemKind =
  | "task"
  | "appointment"
  | "operation"
  | "note";

export type AgendaItemPriority =
  | "low"
  | "normal"
  | "high"
  | "urgent";

export type AgendaManualStatus =
  | "planned"
  | "in_progress"
  | "done"
  | "cancelled"
  | "archived";

export interface SellerAgendaItem {
  id: string;
  source: AgendaItemSource;
  sourceId: string;
  title: string;
  description: string | null;
  kind: string;
  startsAt: string;
  endsAt: string | null;
  allDay: boolean;
  priority: AgendaItemPriority;
  status: string;
  location: string | null;
  editable: boolean;
  relatedModule: string | null;
  relatedTab: string | null;
}

export interface SellerAgendaSnapshot {
  organizationId: string;
  items: SellerAgendaItem[];
}

export interface SellerAgendaItemInput {
  id: string | null;
  title: string;
  description: string;
  kind: AgendaItemKind;
  startsAt: string;
  endsAt: string | null;
  allDay: boolean;
  priority: AgendaItemPriority;
  location: string;
  status: AgendaManualStatus;
}