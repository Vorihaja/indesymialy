"use client";


import {
  useRoleRequests,
  RoleRequestsTable,
} from "@/modules/access-control";



export default function RoleRequestsPanel(){


const {
  requests,
  loading,
  error,
  reload,
} = useRoleRequests();



if(loading){

return (

<div
className="
border
border-neutral-800
bg-neutral-950
p-6
font-mono
text-sm
text-neutral-400
"
>

Chargement des demandes de rôles...

</div>

);

}



if(error){

return (

<div
className="
border
border-red-900
bg-red-950/30
p-6
font-mono
text-sm
text-red-400
"
>

{error}

</div>

);

}



return (

<section
className="
space-y-4
"
>


<div
className="
flex
items-center
justify-between
"
>


<h2
className="
font-mono
text-sm
uppercase
tracking-widest
text-white
"
>

Demandes de rôles

</h2>



<button

onClick={()=>reload()}

className="
border
border-neutral-700
px-3
py-1
font-mono
text-xs
uppercase
text-neutral-300
hover:bg-neutral-800
"
>

Actualiser

</button>


</div>



<RoleRequestsTable

requests={requests}

/>



</section>

);


}