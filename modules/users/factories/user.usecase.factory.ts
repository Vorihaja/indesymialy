import {
 GetCurrentUserUseCase,
 GetProfileUseCase,
 UpdateProfileUseCase
}
from "../use-cases"


import {
 makeUserService
}
from "./user.service.factory"



export function makeGetCurrentUserUseCase(){


return new GetCurrentUserUseCase(
 makeUserService()
)


}



export function makeGetProfileUseCase(){


return new GetProfileUseCase(
 makeUserService()
)


}



export function makeUpdateProfileUseCase(){


return new UpdateProfileUseCase(
 makeUserService()
)


}