"use client";


import {
  ReactNode
} from "react";


import {
  useRole
} from "../hooks/useRole";


import type {
  BusinessRole
} from "../types";



interface RoleGuardProps {


  role: BusinessRole;


  children: ReactNode;


  fallback?: ReactNode;

}




export default function RoleGuard({

  role,

  children,

  fallback = null,

}: RoleGuardProps){



const {
  hasRole,
  loading
}=useRole();





if(loading){

return null;

}





if(!hasRole(role)){

return <>{fallback}</>;

}





return <>{children}</>;



}