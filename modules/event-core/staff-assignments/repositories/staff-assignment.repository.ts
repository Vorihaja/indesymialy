import type {
  StaffAssignmentRequest,
} from "../types";

export interface StaffAssignmentRepository {
  listActionable(): Promise<StaffAssignmentRequest[]>;

  respond(
    assignmentId: string,
    accept: boolean,
  ): Promise<void>;
}