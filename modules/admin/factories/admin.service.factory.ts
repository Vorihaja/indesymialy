import {
  AdminService
} from "../services";


import {
  AdminRepository
} from "../repositories";





let instance:AdminService | null = null;





export function makeAdminService(){



if(instance){

return instance;

}





const repository =
new AdminRepository();





instance =
new AdminService(
 repository
);





return instance;


}