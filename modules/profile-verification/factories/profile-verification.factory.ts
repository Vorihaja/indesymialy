import { createSupabaseBrowserClient } from "@/infrastructure/supabase/client";
import { ProfileVerificationSupabaseRepository } from "../repositories/profile-verification-supabase.repository";
import { ProfileVerificationService } from "../services/profile-verification.service";
import { ManageProfileVerificationUseCase } from "../use-cases/manage-profile-verification.use-case";

let instance: ManageProfileVerificationUseCase | undefined;
export function createProfileVerificationUseCase() {
  instance ??= new ManageProfileVerificationUseCase(new ProfileVerificationService(new ProfileVerificationSupabaseRepository(createSupabaseBrowserClient())));
  return instance;
}
