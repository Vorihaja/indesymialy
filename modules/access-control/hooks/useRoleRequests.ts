"use client";


import {
  useEffect,
  useState
} from "react";


import {
  GetRoleRequestsUseCase
} from "../use-cases";


import {
  makeAccessControlService
} from "../factories";


import type {
  RoleRequest,
  RoleRequestFilter
} from "../types";



export function useRoleRequests(
  filter?: RoleRequestFilter
){


const [requests,setRequests] =
useState<RoleRequest[]>([]);


const [loading,setLoading] =
useState(true);


const [error,setError] =
useState<string | null>(null);





const loadRequests = async()=>{


try{


setLoading(true);

setError(null);



const service =
makeAccessControlService();



const useCase =
new GetRoleRequestsUseCase(
 service
);



const result =
await useCase.execute(
 filter
);



setRequests(result);



}

catch(error){


setError(
 error instanceof Error
 ? error.message
 : "Erreur inconnue"
);


}

finally{


setLoading(false);


}



};





useEffect(()=>{


queueMicrotask(() => {
  void loadRequests();
});


},[
 JSON.stringify(filter)
]);





return {

requests,

loading,

error,

reload:loadRequests

};


}
