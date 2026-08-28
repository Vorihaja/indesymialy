"use client"

import { useState } from "react"

import {
  LoginUseCase
} from "@/modules/auth/use-cases/login.use-case"

import {
  makeAuthService
} from "@/modules/auth/factories/auth.service.factory"



export function useLogin(){


const [loading,setLoading] = useState(false)

const [error,setError] = useState<string | null>(null)



const login = async(
 email:string,
 password:string
)=>{


try{


setLoading(true)

setError(null)



const service =
makeAuthService()



const useCase =
new LoginUseCase(
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

login,
loading,
error

}


}