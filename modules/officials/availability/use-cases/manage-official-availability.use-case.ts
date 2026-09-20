import type { OfficialAvailabilityService } from "../services/official-availability.service";
import type { UpdateOfficialAvailabilityInput } from "../types";

export class ManageOfficialAvailabilityUseCase {
  constructor(private readonly service: OfficialAvailabilityService) {}

  list() {
    return this.service.list();
  }

  update(input: UpdateOfficialAvailabilityInput) {
    return this.service.update(input);
  }
}
