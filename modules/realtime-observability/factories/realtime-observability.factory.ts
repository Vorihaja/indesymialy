import type {
  SupabaseClient,
} from "@supabase/supabase-js";

import type {
  Database,
} from "@/infrastructure/supabase/database.types";

import {
  RealtimeObservabilityRepository,
} from "../repositories/realtime-observability.repository";

import {
  RealtimeObservabilityService,
} from "../services/realtime-observability.service";


export function createRealtimeObservabilityService(
  supabase:
    SupabaseClient<Database>,
): RealtimeObservabilityService {

  return new RealtimeObservabilityService(
    new RealtimeObservabilityRepository(
      supabase,
    ),
  );
}