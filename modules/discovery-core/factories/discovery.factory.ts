import { createSupabaseBrowserClient } from "@/infrastructure/supabase/client";
import { DiscoverySupabaseRepository } from "../repositories/discovery-supabase.repository";
import { DiscoveryService } from "../services/discovery.service";
import { ExploreDiscoveryUseCase } from "../use-cases/explore-discovery.use-case";

let instance: ExploreDiscoveryUseCase | undefined;
export function createDiscoveryUseCase() {
  instance ??= new ExploreDiscoveryUseCase(
    new DiscoveryService(new DiscoverySupabaseRepository(createSupabaseBrowserClient()))
  );
  return instance;
}
