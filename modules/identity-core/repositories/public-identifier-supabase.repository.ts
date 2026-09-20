import type {
  SupabaseClient,
} from "@supabase/supabase-js";

import type {
  Database,
} from "@/infrastructure/supabase/database.types";

import type {
  PublicIdentifierAvailability,
  PublicIdentifierAvailabilityReason,
} from "../public-identifier.types";

import type {
  PublicIdentifierRepository,
} from "./public-identifier.repository";


function asRecord(
  value: unknown,
): Record<string, unknown> {

  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {

    return {};
  }


  return value as Record<string, unknown>;
}


function availabilityReason(
  value: unknown,
): PublicIdentifierAvailabilityReason {

  switch (value) {

    case "required":
    case "not_canonical":
    case "invalid_format":
    case "reserved":
    case "taken":
    case "available":

      return value;


    default:

      throw new Error(
        "Réponse de disponibilité d’identifiant invalide.",
      );
  }
}


export class PublicIdentifierSupabaseRepository
implements PublicIdentifierRepository {

  constructor(
    private readonly supabase:
      SupabaseClient<Database>,
  ) {}


  async checkAvailability(
    identifier: string,
  ): Promise<PublicIdentifierAvailability> {

    const {
      data,
      error,
    } =
      await this.supabase.rpc(
        "korana_public_identifier_availability",
        {
          p_identifier:
            identifier,
        },
      );


    if (error) {

      throw new Error(
        error.message,
      );
    }


    const value =
      asRecord(
        data,
      );


    const reason =
      availabilityReason(
        value.reason,
      );


    const returnedIdentifier =
      typeof value.identifier ===
      "string"
        ? value.identifier
        : null;


    return {
      available:
        value.available ===
        true,

      identifier:
        returnedIdentifier,

      reason,
    };
  }
}