import {
  SuperAdminPermissionsRepository,
} from "../repositories/super-admin-permissions.repository";


export class SuperAdminPermissionsService {

  constructor(
    private readonly repository:
      SuperAdminPermissionsRepository,
  ) {}


  load() {

    return this.repository.load();
  }


  saveAdministratorPermissions(
    profileId: string,
    permissionCodes: string[],
    reason: string,
  ) {

    const normalizedReason =
      reason.trim();


    if (
      normalizedReason.length <
      3
    ) {

      throw new Error(
        "Un motif d’au moins 3 caractères est obligatoire.",
      );
    }


    const normalizedCodes =
      Array.from(
        new Set(
          permissionCodes
            .map(
              (
                code,
              ) =>
                code.trim(),
            )
            .filter(
              Boolean,
            ),
        ),
      ).sort();


    return this.repository.replaceAdministratorPermissions(
      profileId,
      normalizedCodes,
      normalizedReason,
    );
  }
}