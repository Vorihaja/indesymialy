import { createSupabaseBrowserClient } from "@/infrastructure/supabase/client";
import { CommunicationSupabaseRepository } from "../repositories/communication-supabase.repository";
import { CommunicationService } from "../services/communication.service";
import { ManageCommunicationUseCase } from "../use-cases/manage-communication.use-case";
import type { CommunicationRole } from "../types";

export function createCommunicationUseCase(
  role?: CommunicationRole,
): ManageCommunicationUseCase {
  const repository =
    new CommunicationSupabaseRepository(
      createSupabaseBrowserClient(),
      role,
    );

  return new ManageCommunicationUseCase(
    new CommunicationService(repository),
  );
}
