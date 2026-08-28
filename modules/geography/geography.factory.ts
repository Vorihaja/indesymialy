import { createClient } from "@/lib/client";
import { GeographySupabaseRepository } from "./repositories/geography-supabase.repository";
import { GeographyService } from "./services/geography.service";
import { LoadGeographyUseCase } from "./use-cases/load-geography.use-case";
export function createLoadGeographyUseCase() { return new LoadGeographyUseCase(new GeographyService(new GeographySupabaseRepository(createClient()))); }
