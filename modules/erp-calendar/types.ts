export type ErpCalendarRole =
  | "fighter"
  | "coach"
  | "club"
  | "organizer"
  | "referee"
  | "judge"
  | "federation"
  | "sponsor"
  | "seller"
  | "vendeur"
  | "fan"
  | (string & {});

export const ERP_CALENDAR_EVENT_TYPES = [
  "sport",
  "meeting",
  "deadline",
  "travel",
  "medical",
  "commercial",
  "personal",
] as const;

export type ErpCalendarEventType =
  (typeof ERP_CALENDAR_EVENT_TYPES)[number];

export type ErpCalendarStatus =
  | "confirmed"
  | "tentative"
  | "cancelled"
  | "planned"
  | "in_progress"
  | "delayed"
  | "completed"
  | (string & {});

export type ErpCalendarSource =
  | "manual"
  | "event"
  | "event_schedule"
  | "staff_assignment"
  | "weigh_in"
  | "seller_agenda"
  | "seller_personnel_assignment"
  | "seller_document_expiry"
  | "marketplace_promotion"
  | "sponsor_activation"
  | "event_operation"
  | "club_event"
  | "marketplace_bundle"
  | "marketplace_partnership"
  | "sponsor_pipeline"
  | "seller_personnel_leave"
  | (string & {});

export type ErpCalendarMetadata =
  Record<string, unknown>;

export type ErpCalendarItem = {
  id: string;

  calendarKey: string;
  sourceId: string;

  sourceTable: string;
  source: ErpCalendarSource;
  sourceLabel: string;
  relationKind: string;

  title: string;
  description: string | null;

  startsAt: string;
  endsAt: string;
  allDay: boolean;

  type: ErpCalendarEventType;
  status: ErpCalendarStatus;

  location: string | null;

  contextRole: string | null;

  editable: boolean;

  metadata: ErpCalendarMetadata;

  createdAt: string;
  updatedAt: string;
};

export type ErpCalendarEvent =
  ErpCalendarItem;

export type ErpCalendarCreateInput = {
  title: string;
  description?: string | null;

  startsAt: string;
  endsAt: string;

  allDay: boolean;

  type: ErpCalendarEventType;
  status: ErpCalendarStatus;

  location?: string | null;

  contextRole?: string | null;
};

export type ErpCalendarUpdateInput =
  ErpCalendarCreateInput & {
    id: string;
  };
