import {
  AccessControlRepository
} from "../repositories";


import type {
  RoleRequestFilter
} from "../types";



export class AccessControlService {



constructor(
 private readonly repository: AccessControlRepository
){}




async getRoleRequests(
 filter?:RoleRequestFilter
){


const requests =
await this.repository.getRoleRequests();



if(!filter){

return requests;

}



return requests.filter(
(request)=>{


if(
 filter.status &&
 request.status !== filter.status
){

return false;

}



if(
 filter.role &&
 request.requested_role !== filter.role
){

return false;

}



if(
 filter.user_id &&
 request.user_id !== filter.user_id
){

return false;

}



return true;


}
);


}






async getRoles(){


return this.repository.getRoles();


}





async getPermissions(){


return this.repository.getPermissions();


}



}