import {
  createSupabaseBrowserClient,
} from "@/infrastructure/supabase/client";

import {
  createRealtimeObservabilityService,
} from "@/modules/realtime-observability/factories/realtime-observability.factory";

import {
  CommunicationRealtimeRepository,
} from "../repositories/communication-realtime.repository";

import {
  CommunicationRealtimeService,
} from "../services/communication-realtime.service";


export function createCommunicationRealtimeService():
  CommunicationRealtimeService {

  const supabase =
    createSupabaseBrowserClient();


  const observability =
    createRealtimeObservabilityService(
      supabase,
    );


  return new CommunicationRealtimeService(
    new CommunicationRealtimeRepository(
      supabase,
      observability,
    ),
  );
}