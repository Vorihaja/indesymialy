import {
  SystemRoleRepository
} from "../repositories";


import type {
  SystemRole
} from "@/modules/access-control/types";




export class SystemRoleService {



constructor(
  private readonly repository:SystemRoleRepository
){}





async getUserSystemRoles(
 userId:string
):Promise<SystemRole[]> {


return this.repository.getUserSystemRoles(
 userId
);


}






async hasSystemRole(

 userId:string,

 roleCode:string

):Promise<boolean>{


return this.repository.hasSystemRole(

 userId,

 roleCode

);


}






async isAdmin(
 userId:string
):Promise<boolean>{


const roles =
await this.getUserSystemRoles(
 userId
);



return roles.some(
(role)=>
role.code === "admin"
||
role.code === "super_admin"
);


}







async isSuperAdmin(
 userId:string
):Promise<boolean>{


return this.hasSystemRole(

 userId,

 "super_admin"

);


}







async isModerator(
 userId:string
):Promise<boolean>{


return this.hasSystemRole(

 userId,

 "moderator"

);


}



}