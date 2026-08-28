import {
 AuthRepository
} from "../repositories"


import {
 Container
} from "@/shared/container"



export function makeAuthRepository(){


const supabase =
 Container
 .getInstance()
 .supabase()



return new AuthRepository(
 supabase
)


}