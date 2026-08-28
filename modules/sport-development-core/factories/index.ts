import { createSupabaseBrowserClient } from "@/infrastructure/supabase/client";
import { SportSupabaseRepository } from "../repositories/sport-supabase.repository";
import { SportService } from "../services";
import { ManageSportUseCase } from "../use-cases";

let instance: ManageSportUseCase | undefined;
export function createSportUseCase() {
  instance ??= new ManageSportUseCase(
    new SportService(new SportSupabaseRepository(createSupabaseBrowserClient()))
  );
  return instance;
}
