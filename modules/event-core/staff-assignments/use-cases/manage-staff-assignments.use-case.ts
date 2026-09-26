import {
  StaffAssignmentService,
} from "../services/staff-assignment.service";

export class ManageStaffAssignmentsUseCase {
  constructor(
    private readonly service: StaffAssignmentService,
  ) {}

  listActionable() {
    return this.service.listActionable();
  }

  confirm(
    assignmentId: string,
  ) {
    return this.service.respond(
      assignmentId,
      true,
    );
  }

  decline(
    assignmentId: string,
  ) {
    return this.service.respond(
      assignmentId,
      false,
    );
  }

  respond(
    assignmentId: string,
    accept: boolean,
  ) {
    return this.service.respond(
      assignmentId,
      accept,
    );
  }
}