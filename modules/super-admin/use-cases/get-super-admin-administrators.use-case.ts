import {
  SuperAdminAdministratorsService,
} from "../services/super-admin-administrators.service";


export class GetSuperAdminAdministratorsUseCase {

  constructor(
    private readonly service:
      SuperAdminAdministratorsService,
  ) {}


  execute() {

    return this.service.load();
  }
}