import type { OfficialAvailabilitySupabaseRepository } from "../repositories/official-availability-supabase.repository";
import {
  type UpdateOfficialAvailabilityInput,
} from "../types";

function normalizedOptionalText(value: string | null) {
  const normalized = value?.trim() ?? "";
  return normalized || null;
}

export class OfficialAvailabilityService {
  constructor(
    private readonly repository: OfficialAvailabilitySupabaseRepository,
  ) {}

  list() {
    return this.repository.list();
  }

  update(input: UpdateOfficialAvailabilityInput) {
    if (!input.id) {
      throw new Error("Identifiant de disponibilité manquant.");
    }

    if (
      input.status !== "available" &&
      input.status !== "unavailable" &&
      input.status !== "tentative"
    ) {
      throw new Error("Statut de disponibilité invalide.");
    }

    if (
      input.availableFrom &&
      input.availableUntil &&
      Date.parse(input.availableUntil) <= Date.parse(input.availableFrom)
    ) {
      throw new Error("La fin de disponibilité doit suivre son début.");
    }

    return this.repository.update({
      ...input,
      notes: normalizedOptionalText(input.notes),
    });
  }
}
