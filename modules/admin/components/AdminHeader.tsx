"use client";


import {
  useAuth
} from "@/modules/auth/hooks";


import {
  useLogout
} from "@/modules/auth/hooks";


import {
  ShieldCheck
} from "lucide-react";





export function AdminHeader(){



const {
 user
} = useAuth();



const {
 logout
} = useLogout();





return (

<header
className="
h-16
border-b
border-neutral-800
bg-neutral-950
flex
items-center
justify-between
px-6
"
>



<div
className="
flex
items-center
gap-3
"
>

<ShieldCheck
className="
h-5
w-5
text-blue-400
"
/>


<div>

<p
className="
text-xs
font-mono
text-neutral-400
uppercase
"
>

Administration

</p>


<p
className="
text-sm
font-mono
text-white
"
>

{user?.email ?? "Administrateur"}

</p>

</div>


</div>





<button

onClick={() => logout()}

className="
text-xs
font-mono
uppercase
border
border-red-500/40
px-3
py-2
text-red-400
hover:bg-red-500/10
transition
"

>

Déconnexion

</button>



</header>

);


}