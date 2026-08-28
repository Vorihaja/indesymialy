"use client";


import {
  ReactNode
} from "react";


import {
  AdminSidebar
} from "./AdminSidebar";


import {
 AdminHeader
} from "./AdminHeader";


interface AdminShellProps {

children: ReactNode;

}





export default function AdminShell({

children

}:AdminShellProps){



return (

<div
className="
h-full
min-h-0
bg-neutral-950
text-white
flex
overflow-hidden
"
>



<AdminSidebar />


<main className="min-w-0 min-h-0 flex-1 overflow-x-hidden overflow-y-auto">

<AdminHeader />

<div className="p-6">

{children}

</div>

</main>


</div>

);



}
