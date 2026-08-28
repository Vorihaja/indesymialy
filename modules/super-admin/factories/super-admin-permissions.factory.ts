import {
  createSupabaseBrowserClient,
} from "@/infrastructure/supabase/client";

import {
  SuperAdminPermissionsRepository,
} from "../repositories/super-admin-permissions.repository";

import {
  SuperAdminPermissionsService,
} from "../services/super-admin-permissions.service";

import {
  GetSuperAdminPermissionGovernanceUseCase,
} from "../use-cases/get-super-admin-permission-governance.use-case";

import {
  SaveSuperAdminPermissionGovernanceUseCase,
} from "../use-cases/save-super-admin-permission-governance.use-case";


let service:
  SuperAdminPermissionsService | null =
    null;


export function makeSuperAdminPermissionsService() {

  service ??=
    new SuperAdminPermissionsService(

      new SuperAdminPermissionsRepository(
        createSupabaseBrowserClient(),
      ),

    );


  return service;
}


export function makeGetSuperAdminPermissionGovernanceUseCase() {

  return new GetSuperAdminPermissionGovernanceUseCase(
    makeSuperAdminPermissionsService(),
  );
}


export function makeSaveSuperAdminPermissionGovernanceUseCase() {

  return new SaveSuperAdminPermissionGovernanceUseCase(
    makeSuperAdminPermissionsService(),
  );
}