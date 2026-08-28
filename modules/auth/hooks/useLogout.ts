"use client"

import {
 LogoutUseCase
} from "@/modules/auth/use-cases/logout.use-case"


import {
 makeAuthService
} from "@/modules/auth/factories/auth.service.factory"



export function useLogout(){



const logout = async()=>{


const service =
makeAuthService()



const useCase =
new LogoutUseCase(
 service
)



return useCase.execute()


}



return {

logout

}


}