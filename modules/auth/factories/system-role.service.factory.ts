import {
  SystemRoleService
} from "../services";


import {
  SystemRoleRepository
} from "../repositories";





let instance:SystemRoleService | null = null;





export function makeSystemRoleService(){



if(instance){

return instance;

}





const repository =
new SystemRoleRepository();





instance =
new SystemRoleService(
 repository
);





return instance;


}