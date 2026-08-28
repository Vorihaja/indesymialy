"use client"

import { useState } from "react"

import {
 RegisterUseCase
} from "@/modules/auth/use-cases/register.use-case"

import {
 makeAuthService
} from "@/modules/auth/factories/auth.service.factory"



export function useRegister(){


const [loading,setLoading] = useState(false)

const [error,setError] = useState<string | null>(null)



const register = async(
 email:string,
 password:string
)=>{


try{


setLoading(true)

setError(null)



const service =
makeAuthService()



const useCase =
new RegisterUseCase(
 service
)



return await useCase.execute(
 email,
 password
)



}catch(error){


const message =
error instanceof Error
? error.message
:"Erreur inconnue"



setError(message)

throw error



}finally{


setLoading(false)


}


}



return {

register,
loading,
error

}


}