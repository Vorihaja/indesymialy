import {
  AccessControlService
} from "../services";


import type {
  RoleRequestFilter
} from "../types";



export class GetRoleRequestsUseCase {


constructor(
 private readonly service: AccessControlService
){}





async execute(
 filter?: RoleRequestFilter
){


return this.service.getRoleRequests(
 filter
);


}


}