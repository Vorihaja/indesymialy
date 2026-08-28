import {
  createSupabaseBrowserClient,
} from "@/infrastructure/supabase/client";

import {
  SuperAdminAdministratorsRepository,
} from "../repositories/super-admin-administrators.repository";

import {
  SuperAdminAdministratorsService,
} from "../services/super-admin-administrators.service";

import {
  GetSuperAdminAdministratorsUseCase,
} from "../use-cases/get-super-admin-administrators.use-case";

import {
  ManageSuperAdminAdministratorUseCase,
} from "../use-cases/manage-super-admin-administrator.use-case";

import {
  SearchSuperAdminAdministratorCandidatesUseCase,
} from "../use-cases/search-super-admin-administrator-candidates.use-case";


let service:
  SuperAdminAdministratorsService | null =
    null;


export function makeSuperAdminAdministratorsService() {

  service ??=
    new SuperAdminAdministratorsService(

      new SuperAdminAdministratorsRepository(
        createSupabaseBrowserClient(),
      ),

    );


  return service;
}


export function makeGetSuperAdminAdministratorsUseCase() {

  return new GetSuperAdminAdministratorsUseCase(
    makeSuperAdminAdministratorsService(),
  );
}


export function makeSearchSuperAdminAdministratorCandidatesUseCase() {

  return new SearchSuperAdminAdministratorCandidatesUseCase(
    makeSuperAdminAdministratorsService(),
  );
}


export function makeManageSuperAdminAdministratorUseCase() {

  return new ManageSuperAdminAdministratorUseCase(
    makeSuperAdminAdministratorsService(),
  );
}