import { UserService }
from "../services/user.service"

import {
 makeUserRepository
}
from "./user.repository.factory"



export function makeUserService(){


return new UserService(
  makeUserRepository()
)


}