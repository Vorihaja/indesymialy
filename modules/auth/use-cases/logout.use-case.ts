import {
  AuthService
} from "../services"



export class LogoutUseCase {


constructor(
 private readonly service:AuthService
){}



async execute(){


return this.service.logout()


}


}