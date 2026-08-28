import type {
  OrganizerContext,
  OrganizerDashboardSnapshot,
  OrganizerSection,
  OrganizerSectionSnapshot,
} from "../types";

export interface OrganizerOperationsRepository {
  getDashboard():
    Promise<OrganizerDashboardSnapshot>;

  getSection(
    section: OrganizerSection,
  ): Promise<OrganizerSectionSnapshot>;

  setActiveEvent(
    eventId: string,
  ): Promise<OrganizerDashboardSnapshot>;
}

export interface OrganizerContextRepository {
  resolve():
    Promise<OrganizerContext>;

  setActiveEventId(
    eventId: string,
  ): Promise<void>;
}

export interface OrganizerOperationsPersistentRepository {
  getDashboard(
    context: OrganizerContext,
  ): Promise<OrganizerDashboardSnapshot>;

  getSection(
    context: OrganizerContext,
    section: OrganizerSection,
  ): Promise<
    Partial<OrganizerSectionSnapshot>
  >;
}