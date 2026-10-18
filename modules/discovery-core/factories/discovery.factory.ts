import { createSupabaseBrowserClient } from "@/infrastructure/supabase/client";
import { EventSupabaseRepository } from "@/modules/event-core/repositories/event-supabase.repository";
import { DiscoverySupabaseRepository } from "../repositories/discovery-supabase.repository";
import { DiscoveryService } from "../services/discovery.service";
import { ExploreDiscoveryUseCase } from "../use-cases/explore-discovery.use-case";

let instance: ExploreDiscoveryUseCase | undefined;
export function createDiscoveryUseCase() {
  if (!instance) {
    const supabase = createSupabaseBrowserClient();
    const publicEvents = new EventSupabaseRepository(supabase);
    instance = new ExploreDiscoveryUseCase(
      new DiscoveryService(new DiscoverySupabaseRepository(supabase, publicEvents))
    );
  }
  return instance;
}
