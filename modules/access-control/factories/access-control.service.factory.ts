import {
  AccessControlRepository
} from "../repositories";


import {
  AccessControlService
} from "../services";


import {
  supabase
} from "@/lib/supabase";



export function makeAccessControlService(){


const repository =
new AccessControlRepository(
  supabase
);



return new AccessControlService(
  repository
);


}