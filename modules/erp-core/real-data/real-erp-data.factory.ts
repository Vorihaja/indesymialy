import { createSupabaseBrowserClient } from "@/infrastructure/supabase/client";
import { RealErpSupabaseRepository } from "./real-erp-supabase.repository";
import { RealErpDataService } from "./real-erp-data.service";
import { LoadRealErpDataUseCase } from "./load-real-erp-data.use-case";

let instance: LoadRealErpDataUseCase | null = null;
export function createRealErpDataUseCase() {
  if (!instance) instance = new LoadRealErpDataUseCase(new RealErpDataService(new RealErpSupabaseRepository(createSupabaseBrowserClient())));
  return instance;
}
