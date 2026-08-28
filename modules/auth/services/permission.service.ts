import {
  PermissionRepository
} from "../repositories";


import {
  supabase
} from "@/lib/supabase";


import type {
  Permission
} from "@/modules/access-control/types";




export class PermissionService {



  constructor(
    private readonly repository: PermissionRepository
  ) {}







  async getUserPermissions(
    userId:string
  ):Promise<Permission[]> {


    return this.repository.getUserPermissions(
      userId
    );


  }







  async hasPermission(
    userId:string,
    permissionCode:string
  ):Promise<boolean>{


    return this.repository.hasPermission(
      userId,
      permissionCode
    );


  }







  /**
   * Compatibilité avec usePermission
   */
  async getUserPermissionsFromCurrentUser()
  :Promise<Permission[]> {


    const {
      data:{
        user
      }
    } =
    await supabase.auth.getUser();



    if(!user){

      return [];

    }



    return this.getUserPermissions(
      user.id
    );


  }




}