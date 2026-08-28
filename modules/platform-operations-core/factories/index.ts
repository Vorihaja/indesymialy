import { createSupabaseBrowserClient } from "@/infrastructure/supabase/client";
import { OperationsSupabaseRepository } from "../repositories/operations-supabase.repository";
import { OperationsService } from "../services";
import { ManageOperationsUseCase } from "../use-cases";

let instance: ManageOperationsUseCase | undefined;
export function createOperationsUseCase() {
  instance ??= new ManageOperationsUseCase(
    new OperationsService(new OperationsSupabaseRepository(createSupabaseBrowserClient()))
  );
  return instance;
}
