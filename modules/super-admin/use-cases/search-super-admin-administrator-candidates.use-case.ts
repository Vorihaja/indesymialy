import {
  SuperAdminAdministratorsService,
} from "../services/super-admin-administrators.service";


export class SearchSuperAdminAdministratorCandidatesUseCase {

  constructor(
    private readonly service:
      SuperAdminAdministratorsService,
  ) {}


  execute(
    query: string,
  ) {

    return this.service.search(
      query,
    );
  }
}