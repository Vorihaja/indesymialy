import { createSupabaseBrowserClient } from "@/infrastructure/supabase/client";
import { CommunicationSupabaseRepository } from "../repositories/communication-supabase.repository";
import { CommunicationService } from "../services/communication.service";
import { ManageCommunicationUseCase } from "../use-cases/manage-communication.use-case";
const repository = new CommunicationSupabaseRepository(createSupabaseBrowserClient());
export function createCommunicationUseCase(): ManageCommunicationUseCase { return new ManageCommunicationUseCase(new CommunicationService(repository)); }
