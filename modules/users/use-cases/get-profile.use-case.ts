import { UserService } from "../services/user.service"


export class GetProfileUseCase {


  constructor(
    private readonly service: UserService
  ) {}



  async execute(
    userId:string
  ){

    return this.service.getProfile(
      userId
    )

  }


}