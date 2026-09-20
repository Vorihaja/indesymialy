import {
  createSupabaseBrowserClient,
} from "@/infrastructure/supabase/client";

import {
  PublicIdentifierSupabaseRepository,
} from "../repositories/public-identifier-supabase.repository";

import {
  PublicIdentifierService,
} from "../services/public-identifier.service";

import {
  CheckPublicIdentifierAvailabilityUseCase,
} from "../use-cases/check-public-identifier-availability.use-case";


let instance:
  CheckPublicIdentifierAvailabilityUseCase |
  undefined;


export function createPublicIdentifierAvailabilityUseCase() {

  if (!instance) {

    const repository =
      new PublicIdentifierSupabaseRepository(
        createSupabaseBrowserClient(),
      );


    const service =
      new PublicIdentifierService(
        repository,
      );


    instance =
      new CheckPublicIdentifierAvailabilityUseCase(
        service,
      );
  }


  return instance;
}