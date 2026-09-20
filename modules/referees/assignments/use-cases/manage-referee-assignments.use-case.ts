import type {
  RefereeAssignmentResponseInput,
} from "../types";
import type {
  RefereeAssignmentsService,
} from "../services/referee-assignments.service";

export class ManageRefereeAssignmentsUseCase {
  constructor(
    private readonly service:
      RefereeAssignmentsService,
  ) {}

  list() {
    return this.service.list();
  }

  respond(
    input:
      RefereeAssignmentResponseInput,
  ) {
    return this.service.respond(input);
  }
}