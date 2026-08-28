import {
 UserRepository
} from "../repositories"



import {
 Container
} from "@/shared/container"



export function makeUserRepository(){


const supabase =
 Container
 .getInstance()
 .supabase()



return new UserRepository(
 supabase
)


}