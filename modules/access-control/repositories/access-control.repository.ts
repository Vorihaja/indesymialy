import type {
  SupabaseClient
} from "@supabase/supabase-js";


import type {
  BusinessRole,
  SystemRole,
  Permission,
  RoleRequest
} from "../types";


export class AccessControlRepository {


constructor(
 private readonly supabase: SupabaseClient
){}





async getRoleRequests():Promise<RoleRequest[]> {


const {
 data,
 error
} = await this.supabase
.from("role_requests")
.select("*")
.order(
"created_at",
{
 ascending:false
}
);



if(error){

throw error;

}



return data ?? [];

}

async getRoles():Promise<BusinessRole[]> {


const { data, error } =
await this.supabase
.from("roles")
.select(`
 id,
 slug,
 label,
 description,
 is_organization,
 created_at
`);



if(error){

throw error;

}



return data ?? [];

}





async getPermissions():Promise<Permission[]> {


const {
 data,
 error
} = await this.supabase
.from("permissions")
.select("*");



if(error){

throw error;

}



return data ?? [];

}



}