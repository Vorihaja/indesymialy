import type {
  OrganizationPersonnelSupabaseRepository,
} from "../repositories/organization-personnel.repository";

export class OrganizationPersonnelService {
  constructor(
    private readonly repository:
      OrganizationPersonnelSupabaseRepository,
  ) {}

  getSnapshot() {
    return this.repository.getSnapshot();
  }
}
