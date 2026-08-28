import {
  supabase
} from "@/lib/supabase";


import type {
  SystemRole
} from "@/modules/access-control/types";




export class SystemRoleRepository {



  async getUserSystemRoles(
    userId: string
  ): Promise<SystemRole[]> {



    const {
      data,
      error
    } = await supabase

      .from("profile_system_roles")

      .select(`
        system_roles(
          id,
          code,
          label,
          description,
          created_at
        )
      `)

      .eq(
        "profile_id",
        userId
      );



    if (error) {

      console.error(
        "Erreur récupération rôles système",
        error
      );

      return [];

    }



    return (
      data ?? []
    )
    .flatMap(
      (item) => item.system_roles ?? []
    )
    .filter(Boolean) as SystemRole[];



  }





  async hasSystemRole(
    userId: string,
    roleCode: string
  ): Promise<boolean> {



    const roles =
      await this.getUserSystemRoles(
        userId
      );



    return roles.some(
      (role) =>
        role.code === roleCode
    );



  }



}
