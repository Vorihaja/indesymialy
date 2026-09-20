import type {
  RefereeAssignmentResponseInput,
} from "../types";
import type {
  RefereeAssignmentsSupabaseRepository,
} from "../repositories/referee-assignments-supabase.repository";

export class RefereeAssignmentsService {
  constructor(
    private readonly repository:
      RefereeAssignmentsSupabaseRepository,
  ) {}

  list() {
    return this.repository.list();
  }

  respond(
    input:
      RefereeAssignmentResponseInput,
  ) {
    if (!input.sourceId) {
      throw new Error(
        "Identifiant de désignation manquant.",
      );
    }

    if (
      input.status !== "confirmed" &&
      input.status !== "declined"
    ) {
      throw new Error(
        "Réponse de désignation invalide.",
      );
    }

    return this.repository.respond(
      input.source,
      input.sourceId,
      input.status,
    );
  }
}