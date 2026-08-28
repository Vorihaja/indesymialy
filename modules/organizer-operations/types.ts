export const ORGANIZER_SECTIONS = [
  "competitions",
  "fight-cards",
  "fights",
  "fighters",
  "clubs",
  "registrations",
  "categories",
  "weigh-in",
  "ticketing",
  "sponsors",
  "partners",
  "officials",
  "referees",
  "judges",
  "staff",
  "volunteers",
  "planning",
  "checklists",
  "budget",
  "event-marketplace",
  "communication",
  "results",
  "reports",
  "statistics",
  "settings",
] as const;

export type OrganizerSection =
  (typeof ORGANIZER_SECTIONS)[number];

export type OrganizerTone =
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "info";

export interface OrganizerMetric {
  id: string;
  label: string;
  value: string;
  detail: string;
  tone?: OrganizerTone;
  connected?: boolean;
  source?: string;
}

export interface OrganizerContext {
  profileId: string;
  organizationId: string;
  organizerRole: string;
  permissions: string[];
  activeEventId: string | null;
}

export type OrganizerOperationsErrorCode =
  | "UNAUTHENTICATED"
  | "ORGANIZATION_NOT_FOUND"
  | "EVENT_NOT_FOUND"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "FOREIGN_KEY_ERROR"
  | "UNIQUE_CONSTRAINT_ERROR"
  | "NETWORK_ERROR"
  | "STORAGE_NOT_IMPLEMENTED"
  | "UNKNOWN_ERROR";

export interface OrganizerAlert {
  id: string;
  title: string;
  detail: string;
  severity: "critical" | "warning" | "info";
  href: string;
}

export interface OrganizerActivity {
  id: string;
  label: string;
  detail: string;
  time: string;
  status: OrganizerTone;
}

export interface OrganizerChecklistCategory {
  id: string;
  label: string;
  completed: number;
  total: number;
  critical: number;
}

export interface OrganizerEventBrief {
  id: string;
  name: string;
  dateLabel: string;
  venue: string;
  status: "live" | "today" | "upcoming";
  readiness: number;
  fights: number;
  href?: string;
}

export interface OrganizerActiveEvent {
  id: string;
  name: string;
  venue: string;
  status: string;
  dateLabel: string;
  countdown: string;
}

export interface OrganizerReadinessDomain {
  id: string;
  label: string;
  value: number | null;
  detail: string;
  href: string;
  tone: OrganizerTone;
  connected: boolean;
}

export interface OrganizerOperationalStatus {
  id: string;
  label: string;
  value: string;
  detail: string;
  href: string;
  tone: OrganizerTone;
  connected: boolean;
}

export interface OrganizerQuickAction {
  id: string;
  label: string;
  detail: string;
  href: string;
  tone: "primary" | "neutral" | "danger";
}

export interface OrganizerDashboardSnapshot {
  generatedAt: string;

  eventName: string;
  eventCountdown: string;

  activeEvent: OrganizerActiveEvent | null;

  readiness: number;

  readinessDomains: OrganizerReadinessDomain[];

  operationalStatus: OrganizerOperationalStatus[];

  quickActions: OrganizerQuickAction[];

  metrics: OrganizerMetric[];

  events: OrganizerEventBrief[];

  alerts: OrganizerAlert[];

  checklist: OrganizerChecklistCategory[];

  activities: OrganizerActivity[];

  weather: {
    status: string;
    temperature: string;
    wind: string;
    confidence: string;
  };

  liveReady: boolean;

  context?: OrganizerContext;
}

export interface OrganizerWorkflowStep {
  id: string;
  label: string;
  owner: string;
  due: string;
  status: "done" | "active" | "blocked" | "planned";
}

export interface OrganizerOperationalRecord {
  id: string;
  title: string;
  detail: string;
  status: string;
  href?: string;
}

export interface OrganizerSectionSnapshot {
  section: OrganizerSection;
  eyebrow: string;
  title: string;
  description: string;

  readiness: number;

  metrics: OrganizerMetric[];

  workflow: OrganizerWorkflowStep[];

  alerts: OrganizerAlert[];

  primaryAction: string;

  capabilities: string[];

  records?: OrganizerOperationalRecord[];
}