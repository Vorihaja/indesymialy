import type {
  PublicIdentifierAvailability,
} from "../public-identifier.types";

import type {
  PublicIdentifierService,
} from "../services/public-identifier.service";


export class CheckPublicIdentifierAvailabilityUseCase {

  constructor(
    private readonly service:
      PublicIdentifierService,
  ) {}


  execute(
    identifier: string,
  ): Promise<PublicIdentifierAvailability> {

    return this.service.checkAvailability(
      identifier,
    );
  }
}