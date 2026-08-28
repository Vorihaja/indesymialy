import {
  LoginUseCase,
  RegisterUseCase,
  LogoutUseCase
}
from "../use-cases"


import {
  makeAuthService
}
from "./auth.service.factory"



export function makeLoginUseCase(){


return new LoginUseCase(
  makeAuthService()
)


}



export function makeRegisterUseCase(){


return new RegisterUseCase(
  makeAuthService()
)


}



export function makeLogoutUseCase(){


return new LogoutUseCase(
  makeAuthService()
)


}