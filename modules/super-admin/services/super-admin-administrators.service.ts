import {
  SuperAdminAdministratorsRepository,
} from "../repositories/super-admin-administrators.repository";


export class SuperAdminAdministratorsService {

  constructor(
    private readonly repository:
      SuperAdminAdministratorsRepository,
  ) {}


  load() {

    return this.repository.load();
  }


  search(
    query: string,
  ) {

    const normalized =
      query.trim();


    if (
      normalized.length <
      2
    ) {

      return Promise.resolve(
        [],
      );
    }


    return this.repository.search(
      normalized,
    );
  }


  grant(
    profileId: string,
    reason: string,
  ) {

    return this.repository.grant(
      profileId,
      reason,
    );
  }


  suspend(
    profileId: string,
    reason: string,
  ) {

    return this.repository.suspend(
      profileId,
      reason,
    );
  }


  reactivate(
    profileId: string,
    reason: string,
  ) {

    return this.repository.reactivate(
      profileId,
      reason,
    );
  }


  revoke(
    profileId: string,
    reason: string,
  ) {

    return this.repository.revoke(
      profileId,
      reason,
    );
  }


  setPermissions(
    profileId: string,
    permissionCodes: string[],
    reason: string,
  ) {

    return this.repository.setPermissions(
      profileId,
      permissionCodes,
      reason,
    );
  }
}