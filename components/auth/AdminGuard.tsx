"use client";

import {
  ReactNode,
  useEffect
} from "react";

import {
  useRouter
} from "next/navigation";

import {
  useSystemRole
} from "@/modules/auth/hooks";



interface AdminGuardProps {

  children: ReactNode;

}





export default function AdminGuard({
  children
}: AdminGuardProps) {



const router = useRouter();


const {
  isAdmin,
  loading
} = useSystemRole();





useEffect(()=>{


if(
  !loading &&
  !isAdmin
){

router.replace(
  "/dashboard"
);

}


},[
loading,
isAdmin,
router
]);







if(loading){

return (

<div
className="
fixed
inset-0
z-[9999]
grid
place-items-center
bg-neutral-950
text-white
font-mono
text-xs
tracking-[0.3em]
"
>

VÉRIFICATION DES DROITS ADMIN...

</div>

);

}







if(!isAdmin){

return null;

}






return (

<>

{children}

</>

);



}