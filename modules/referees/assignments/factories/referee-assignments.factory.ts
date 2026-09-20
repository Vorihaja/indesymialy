import {
  createSupabaseBrowserClient,
} from "@/infrastructure/supabase/client";

import {
  RefereeAssignmentsSupabaseRepository,
} from "../repositories/referee-assignments-supabase.repository";
import {
  RefereeAssignmentsService,
} from "../services/referee-assignments.service";
import {
  ManageRefereeAssignmentsUseCase,
} from "../use-cases/manage-referee-assignments.use-case";

export function createRefereeAssignmentsUseCase() {
  const supabase =
    createSupabaseBrowserClient();

  const repository =
    new RefereeAssignmentsSupabaseRepository(
      supabase,
    );

  const service =
    new RefereeAssignmentsService(
      repository,
    );

  return new ManageRefereeAssignmentsUseCase(
    service,
  );
}