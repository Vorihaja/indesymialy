import { createSupabaseBrowserClient } from "@/infrastructure/supabase/client";

import { HomeSeasonSupabaseRepository } from "../repositories/home-season-supabase.repository";
import { HomeSeasonService } from "../services/home-season.service";
import { GetHomeSeasonUseCase } from "../use-cases/get-home-season.use-case";

export function createHomeSeasonUseCase() {
  const repository = new HomeSeasonSupabaseRepository(
    createSupabaseBrowserClient(),
  );

  return new GetHomeSeasonUseCase(new HomeSeasonService(repository));
}
