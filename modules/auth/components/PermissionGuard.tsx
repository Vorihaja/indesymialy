"use client";


import {
  ReactNode
} from "react";


import {
  usePermission
} from "../hooks/usePermission";




interface PermissionGuardProps {


 permission:string;


 children:ReactNode;


 fallback?:ReactNode;


}




export default function PermissionGuard({

 permission,

 children,

 fallback=null,

}:PermissionGuardProps){



const {

 can,

 loading

}=usePermission();





if(loading){

return null;

}





if(!can(permission)){


return <>{fallback}</>;

}





return <>{children}</>;



}