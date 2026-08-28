import {
  PermissionService
} from "../services/permission.service";


import {
  PermissionRepository
} from "../repositories";





export function makePermissionsService(): PermissionService {


  const repository =
    new PermissionRepository();


  return new PermissionService(
    repository
  );


}





// Instance prête à l'emploi
export const permissionService =
  makePermissionsService();