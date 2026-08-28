import { UserService } from "../services/user.service"

import type {
  UpdateUserProfile
} from "../types"



export class UpdateProfileUseCase {


constructor(
 private readonly service:UserService
){}



async execute(
 userId:string,
 data:UpdateUserProfile
){


return this.service.updateProfile(
 userId,
 data
)


}


}