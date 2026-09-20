import { createSupabaseBrowserClient } from "@/infrastructure/supabase/client";

import { OfficialAvailabilitySupabaseRepository } from "../repositories/official-availability-supabase.repository";
import { OfficialAvailabilityService } from "../services/official-availability.service";
import { ManageOfficialAvailabilityUseCase } from "../use-cases/manage-official-availability.use-case";

export function createOfficialAvailabilityUseCase() {
  const repository = new OfficialAvailabilitySupabaseRepository(
    createSupabaseBrowserClient(),
  );
  const service = new OfficialAvailabilityService(repository);

  return new ManageOfficialAvailabilityUseCase(service);
}
