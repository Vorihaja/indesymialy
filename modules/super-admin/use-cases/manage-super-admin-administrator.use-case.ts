import {
  SuperAdminAdministratorsService,
} from "../services/super-admin-administrators.service";


export class ManageSuperAdminAdministratorUseCase {

  constructor(
    private readonly service:
      SuperAdminAdministratorsService,
  ) {}


  grant(
    profileId: string,
    reason: string,
  ) {

    return this.service.grant(
      profileId,
      reason,
    );
  }


  suspend(
    profileId: string,
    reason: string,
  ) {

    return this.service.suspend(
      profileId,
      reason,
    );
  }


  reactivate(
    profileId: string,
    reason: string,
  ) {

    return this.service.reactivate(
      profileId,
      reason,
    );
  }


  revoke(
    profileId: string,
    reason: string,
  ) {

    return this.service.revoke(
      profileId,
      reason,
    );
  }


  setPermissions(
    profileId: string,
    permissionCodes: string[],
    reason: string,
  ) {

    return this.service.setPermissions(
      profileId,
      permissionCodes,
      reason,
    );
  }
}