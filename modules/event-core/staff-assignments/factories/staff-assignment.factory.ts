import {
  createSupabaseBrowserClient,
} from "@/infrastructure/supabase/client";

import {
  StaffAssignmentSupabaseRepository,
} from "../repositories/staff-assignment-supabase.repository";
import {
  StaffAssignmentService,
} from "../services/staff-assignment.service";
import {
  ManageStaffAssignmentsUseCase,
} from "../use-cases/manage-staff-assignments.use-case";

let instance:
  | ManageStaffAssignmentsUseCase
  | undefined;

export function createStaffAssignmentUseCase() {
  instance ??=
    new ManageStaffAssignmentsUseCase(
      new StaffAssignmentService(
        new StaffAssignmentSupabaseRepository(
          createSupabaseBrowserClient(),
        ),
      ),
    );

  return instance;
}