import {
  AuthService
} from "../services"



export class LoginUseCase {


constructor(
 private readonly service:AuthService
){}



async execute(
 email:string,
 password:string
){


return this.service.login(
 email,
 password
)


}


}