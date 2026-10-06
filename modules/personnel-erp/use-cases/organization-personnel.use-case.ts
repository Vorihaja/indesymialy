import type {
  OrganizationPersonnelService,
} from "../services/organization-personnel.service";

export class OrganizationPersonnelUseCase {
  constructor(
    private readonly service:
      OrganizationPersonnelService,
  ) {}

  execute() {
    return this.service.getSnapshot();
  }
}
