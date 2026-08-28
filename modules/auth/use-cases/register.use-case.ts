import {
  AuthService
} from "../services"



export class RegisterUseCase {


constructor(
 private readonly service:AuthService
){}



async execute(
 email:string,
 password:string
){


return this.service.register(
 email,
 password
)


}


}