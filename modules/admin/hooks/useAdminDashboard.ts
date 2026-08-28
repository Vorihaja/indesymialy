"use client";


import {
  useEffect,
  useState
} from "react";


import {
  GetAdminDashboardUseCase
} from "../use-cases";


import {
  makeAdminService
} from "../factories";


import type {
  AdminDashboardData
} from "../types";





export function useAdminDashboard(){



const [
data,
setData
] = useState<AdminDashboardData | null>(null);




const [
loading,
setLoading
] = useState(true);




const [
error,
setError
] = useState<string | null>(null);







useEffect(()=>{


async function loadDashboard(){


try{


setLoading(true);


const service =
makeAdminService();



const useCase =
new GetAdminDashboardUseCase(
service
);



const result =
await useCase.execute();



setData(
result
);



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



}



void loadDashboard();


},[]);







return {

data,

loading,

error

};



}