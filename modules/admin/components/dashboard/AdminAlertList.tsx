"use client";


import type {
  AdminAlert
} from "../../types";





interface AdminAlertListProps {

alerts: AdminAlert[];

}





export default function AdminAlertList({

alerts

}:AdminAlertListProps){



return (

<section
className="
border
border-neutral-800
bg-neutral-950
p-5
"
>



<h2
className="
mb-4
text-xs
font-mono
uppercase
tracking-widest
text-neutral-400
"
>

Alertes système

</h2>





{
alerts.length === 0 ? (

<p
className="
text-sm
font-mono
text-neutral-500
"
>

Aucune alerte active

</p>


)

:

(


<div
className="
space-y-3
"
>


{

alerts.map(alert=>(


<div

key={alert.id}

className="
border
border-neutral-800
p-3
"

>


<div
className="
flex
justify-between
items-center
"
>


<p
className="
text-sm
font-mono
text-white
"
>

{alert.title}

</p>



<span
className="
text-[10px]
font-mono
uppercase
text-neutral-400
"
>

{alert.level}

</span>



</div>





<p
className="
mt-2
text-xs
font-mono
text-neutral-500
"
>

{alert.message}

</p>



</div>


))


}


</div>


)

}



</section>

);


}