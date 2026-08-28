import { UserService } from "../services/user.service"


export class GetCurrentUserUseCase {


  constructor(
    private readonly service: UserService
  ) {}


  async execute(){

    return this.service.getCurrentUser()

  }


}