import {
  SuperAdminPermissionsService,
} from "../services/super-admin-permissions.service";


export class SaveSuperAdminPermissionGovernanceUseCase {

  constructor(
    private readonly service:
      SuperAdminPermissionsService,
  ) {}


  execute(
    profileId: string,
    permissionCodes: string[],
    reason: string,
  ) {

    return this.service.saveAdministratorPermissions(
      profileId,
      permissionCodes,
      reason,
    );
  }
}