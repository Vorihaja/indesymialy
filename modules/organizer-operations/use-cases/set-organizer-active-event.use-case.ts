import type {
  OrganizerOperationsService,
} from "../services/organizer-operations.service";

import {
  OrganizerOperationsError,
} from "../errors";

export class SetOrganizerActiveEventUseCase {
  constructor(
    private readonly service:
      OrganizerOperationsService,
  ) {}

  execute(
    eventId: string,
  ) {
    if (
      !eventId.trim()
    ) {
      throw new OrganizerOperationsError(
        "VALIDATION_ERROR",
        "Un événement doit être sélectionné.",
      );
    }

    return this.service.setActiveEvent(
      eventId,
    );
  }
}