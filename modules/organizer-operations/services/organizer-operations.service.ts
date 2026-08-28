import type {
  OrganizerOperationsRepository,
} from "../repositories/organizer-operations.repository";

import type {
  OrganizerSection,
} from "../types";

export class OrganizerOperationsService {
  constructor(
    private readonly repository:
      OrganizerOperationsRepository,
  ) {}

  getDashboard() {
    return this.repository.getDashboard();
  }

  getSection(
    section: OrganizerSection,
  ) {
    return this.repository.getSection(
      section,
    );
  }

  setActiveEvent(
    eventId: string,
  ) {
    return this.repository.setActiveEvent(
      eventId,
    );
  }
}