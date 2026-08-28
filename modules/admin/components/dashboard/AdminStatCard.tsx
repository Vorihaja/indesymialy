"use client";


import {
  ReactNode
} from "react";





interface AdminStatCardProps {


title:string;


value:number | string;


icon?:ReactNode;


description?:string;


}





export default function AdminStatCard({

title,

value,

icon,

description

}:AdminStatCardProps){



return (

<div
className="
border
border-neutral-800
bg-neutral-950
p-5
transition
hover:border-blue-500/40
"
>



<div
className="
flex
items-center
justify-between
mb-4
"
>



<p
className="
text-xs
font-mono
uppercase
tracking-widest
text-neutral-400
"
>

{title}

</p>



<div
className="
text-blue-400
"
>

{icon}

</div>



</div>





<div
className="
text-3xl
font-bold
font-mono
text-white
"
>

{value}

</div>





{
description && (

<p
className="
mt-2
text-xs
font-mono
text-neutral-500
"
>

{description}

</p>

)

}



</div>

);


}