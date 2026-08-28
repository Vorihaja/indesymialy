import {
  supabase
} from "@/lib/supabase";


import type {
  Permission
} from "@/modules/access-control/types";





export class PermissionRepository {






  async getUserPermissions(
    userId:string
  ):Promise<Permission[]> {




    try {



      /*
      =====================================
      1 - Récupération des rôles système
      =====================================
      */


      const {
        data:systemRoles,
        error:systemRoleError
      } =
      await supabase

        .from(
          "profile_system_roles"
        )

        .select(
          "system_role_id"
        )

        .eq(
          "profile_id",
          userId
        );




      if(systemRoleError){

        throw systemRoleError;

      }




      if(!systemRoles?.length){

        return [];

      }







      const roleIds =
      systemRoles.map(
        role =>
          role.system_role_id
      );







      /*
      =====================================
      2 - Permissions liées aux rôles
      =====================================
      */



      const {
        data:rolePermissions,
        error:permissionError
      }
      =
      await supabase

        .from(
          "role_permissions"
        )

        .select(
          `
          permission_id
          `
        )

        .in(
          "role_id",
          roleIds
        );





      if(permissionError){

        throw permissionError;

      }




      if(!rolePermissions?.length){

        return [];

      }







      const permissionIds =
      rolePermissions.map(
        item =>
          item.permission_id
      );







      /*
      =====================================
      3 - Chargement des permissions
      =====================================
      */



      const {
        data:permissions,
        error:permissionsError
      }
      =
      await supabase

        .from(
          "permissions"
        )

        .select(
          `
          id,
          code,
          description,
          created_at
          `
        )

        .in(
          "id",
          permissionIds
        );






      if(permissionsError){

        throw permissionsError;

      }






      return permissions ?? [];




    }

    catch(error){


      console.error(
        "Erreur récupération permissions",
        JSON.stringify(
          error,
          null,
          2
        )
      );


      return [];

    }




  }








  async hasPermission(
    userId:string,
    permissionCode:string
  ):Promise<boolean>{



    const permissions =
    await this.getUserPermissions(
      userId
    );



    return permissions.some(
      permission =>
        permission.code === permissionCode
    );


  }






}