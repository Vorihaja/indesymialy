import type {
  StaffAssignmentRepository,
} from "../repositories/staff-assignment.repository";

export class StaffAssignmentService {
  constructor(
    private readonly repository: StaffAssignmentRepository,
  ) {}

  listActionable() {
    return this.repository.listActionable();
  }

  respond(
    assignmentId: string,
    accept: boolean,
  ) {
    const normalizedId =
      assignmentId.trim();

    if (!normalizedId) {
      throw new Error(
        "L’affectation est obligatoire.",
      );
    }

    return this.repository.respond(
      normalizedId,
      accept,
    );
  }
}