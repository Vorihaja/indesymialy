import { SuperAdminRepository } from "../repositories/super-admin.repository";

export class SuperAdminService {
  constructor(
    private readonly repository: SuperAdminRepository,
  ) {}

  getAnalytics(from: Date, to: Date) {
    return this.repository.getAnalytics(from, to);
  }

  listAdministrators() {
    return this.repository.listAdministrators();
  }

  listPermissionCatalog() {
    return this.repository.listPermissionCatalog();
  }

  searchProfiles(query: string) {
    return this.repository.searchProfiles(query);
  }

  listAccessLogs() {
    return this.repository.listAccessLogs();
  }

  setAdminRole(
    profileId: string,
    enabled: boolean,
  ) {
    return this.repository.setAdminRole(
      profileId,
      enabled,
    );
  }

  setAdminPermissions(
    profileId: string,
    permissions: string[],
  ) {
    return this.repository.setAdminPermissions(
      profileId,
      permissions,
    );
  }
}
