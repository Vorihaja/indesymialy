import type {
  PublicIdentifierAvailability,
} from "../public-identifier.types";


export interface PublicIdentifierRepository {

  checkAvailability(
    identifier: string,
  ): Promise<PublicIdentifierAvailability>;
}