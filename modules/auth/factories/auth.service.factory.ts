import {
 AuthService
} from "../services";


import {
 makeAuthRepository
} from "./auth.repository.factory";




export function makeAuthService(){


return new AuthService(
 makeAuthRepository()
);


}