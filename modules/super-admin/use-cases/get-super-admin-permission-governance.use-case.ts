import {
  SuperAdminPermissionsService,
} from "../services/super-admin-permissions.service";


export class GetSuperAdminPermissionGovernanceUseCase {

  constructor(
    private readonly service:
      SuperAdminPermissionsService,
  ) {}


  execute() {

    return this.service.load();
  }
}