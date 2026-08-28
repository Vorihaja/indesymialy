import { SuperAdminService } from "../services/super-admin.service";

export class SuperAdminGovernanceUseCase {
  constructor(
    private readonly service: SuperAdminService,
  ) {}

  listAdministrators() {
    return this.service.listAdministrators();
  }

  listPermissionCatalog() {
    return this.service.listPermissionCatalog();
  }

  searchProfiles(query: string) {
    return this.service.searchProfiles(query);
  }

  listAccessLogs() {
    return this.service.listAccessLogs();
  }

  setAdminRole(
    profileId: string,
    enabled: boolean,
  ) {
    return this.service.setAdminRole(
      profileId,
      enabled,
    );
  }

  setAdminPermissions(
    profileId: string,
    permissions: string[],
  ) {
    return this.service.setAdminPermissions(
      profileId,
      permissions,
    );
  }
}
