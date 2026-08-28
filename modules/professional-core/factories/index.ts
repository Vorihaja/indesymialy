import { createSupabaseBrowserClient } from "@/infrastructure/supabase/client";
import { ProfessionalSupabaseRepository } from "../repositories/professional-supabase.repository";
import { ProfessionalService } from "../services";
import { ManageProfessionalUseCase } from "../use-cases";

let instance: ManageProfessionalUseCase | undefined;
export function createProfessionalUseCase() {
  instance ??= new ManageProfessionalUseCase(
    new ProfessionalService(new ProfessionalSupabaseRepository(createSupabaseBrowserClient()))
  );
  return instance;
}
