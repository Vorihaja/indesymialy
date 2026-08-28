"use client";


import type {
  RoleRequest
} from "../types";



interface RoleRequestsTableProps {

requests: RoleRequest[];

}





export default function RoleRequestsTable({

requests

}:RoleRequestsTableProps){



return (

<div
className="
overflow-hidden
border
border-neutral-800
bg-neutral-950
"
>



<table
className="
w-full
text-left
"
>


<thead
className="
border-b
border-neutral-800
bg-neutral-900
"
>

<tr>


<th
className="
px-4
py-3
text-xs
font-mono
uppercase
tracking-wider
text-neutral-400
"
>
Utilisateur
</th>



<th
className="
px-4
py-3
text-xs
font-mono
uppercase
tracking-wider
text-neutral-400
"
>
Rôle demandé
</th>



<th
className="
px-4
py-3
text-xs
font-mono
uppercase
tracking-wider
text-neutral-400
"
>
Statut
</th>



<th
className="
px-4
py-3
text-xs
font-mono
uppercase
tracking-wider
text-neutral-400
"
>
Date
</th>



</tr>


</thead>




<tbody>


{
requests.length === 0 ? (


<tr>

<td
colSpan={4}
className="
px-4
py-8
text-center
font-mono
text-sm
text-neutral-500
"
>

Aucune demande trouvée

</td>


</tr>


)

:

requests.map(
(request)=>(


<tr
key={request.id}
className="
border-b
border-neutral-900
hover:bg-neutral-900/50
"
>


<td
className="
px-4
py-3
font-mono
text-sm
text-white
"
>

{request.user_id}

</td>



<td
className="
px-4
py-3
font-mono
text-sm
text-blue-400
"
>

{request.requested_role}

</td>




<td
className="
px-4
py-3
font-mono
text-xs
uppercase
text-neutral-300
"
>

{request.status}

</td>




<td
className="
px-4
py-3
font-mono
text-xs
text-neutral-500
"
>

{
new Date(
request.created_at
)
.toLocaleDateString("fr-FR")
}

</td>



</tr>


)

)


}



</tbody>


</table>


</div>


);


}