import {
  normalizePublicIdentifier,
  type PublicIdentifierAvailability,
} from "../public-identifier.types";

import type {
  PublicIdentifierRepository,
} from "../repositories/public-identifier.repository";


export class PublicIdentifierService {

  constructor(
    private readonly repository:
      PublicIdentifierRepository,
  ) {}


  checkAvailability(
    identifier: string,
  ): Promise<PublicIdentifierAvailability> {

    const normalized =
      normalizePublicIdentifier(
        identifier,
      );


    return this.repository.checkAvailability(
      normalized,
    );
  }
}