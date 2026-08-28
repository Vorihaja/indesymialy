"use client";

import {
  ReactNode,
  useEffect
} from "react";

import {
  useRouter
} from "next/navigation";


import {
  useAuthContext
} from "@/providers/auth/index";



type ErpAuthGuardProps = {
  children: ReactNode;
};



export default function ErpAuthGuard({
  children
}: ErpAuthGuardProps) {


const router = useRouter();


const {
  loading,
  authenticated
} = useAuthContext();





useEffect(()=>{


if(!loading && !authenticated){

router.replace("/auth");

}


},[
loading,
authenticated,
router
]);





if(loading){

return (

<div
className="
fixed
inset-0
z-[9999]
bg-[#060a14]
grid
place-items-center
text-white
font-mono
text-xs
tracking-widest
"
>

VÉRIFICATION DE L&apos;AUTHENTIFICATION...

</div>

)

}





if(!authenticated){

return null;

}





return (

<>

{children}

</>

);


}
