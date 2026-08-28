"use client";


import {
  Users,
  Trophy,
  Activity,
  ShieldCheck,
  Database,
  TrendingUp
} from "lucide-react";


import {
  motion
} from "framer-motion";


import {
  useEffect,
  useState
} from "react";


import {
  getPlatformStats
} from "@/services/platform/platform.service";




export default function PlatformStats(){


const [stats,setStats] = useState({

  fighters:0,
  events:0,
  disciplines:0,
  clubs:0

});



useEffect(()=>{


async function load(){

const data =
await getPlatformStats();


setStats(data);


}


load();


},[]);






const DATA = [


{
label:"Combattants enregistrés",
value:`${stats.fighters}`,
icon:Users
},


{
label:"Événements organisés",
value:`${stats.events}`,
icon:Trophy
},


{
label:"Disciplines actives",
value:`${stats.disciplines}`,
icon:Activity
},


{
label:"Clubs partenaires",
value:`${stats.clubs}`,
icon:ShieldCheck
}


];






return (

<section>



<div
className="
flex
justify-between
items-center
mb-8
"
>


<div>


<div
className="
flex
items-center
gap-3
"
>


<Database
className="
text-red-500
"
/>


<h2
className="
text-2xl
font-black
uppercase
"
>

INDESY CORE DATA

</h2>


</div>


<p
className="
text-neutral-500
font-mono
text-sm
mt-2
"
>

Données de la plateforme

</p>


</div>




<div
className="
flex
items-center
gap-2
bg-green-500/10
border
border-green-500/30
px-4
py-2
text-green-400
text-xs
font-mono
"
>


<span
className="
w-2
h-2
bg-green-500
rounded-full
animate-pulse
"
/>


ONLINE


</div>


</div>







<div
className="
grid
grid-cols-1
sm:grid-cols-2
xl:grid-cols-4
gap-6
"
>


{
DATA.map((item,index)=>{


const Icon=item.icon;



return (

<motion.div

key={item.label}

initial={{
opacity:0,
y:40
}}

whileInView={{
opacity:1,
y:0
}}

transition={{
delay:index*0.1
}}

whileHover={{
y:-8
}}

className="
bg-neutral-950
border
border-neutral-800
p-6
relative
overflow-hidden
"

>


<div
className="
absolute
inset-0
bg-red-600/5
opacity-0
hover:opacity-100
transition
"
/>



<div
className="
relative
"
>


<div
className="
flex
justify-between
"
>


<div
className="
p-3
bg-red-500/10
border
border-red-500/20
"
>

<Icon
size={22}
className="
text-red-500
"
/>


</div>


<TrendingUp
size={18}
className="
text-green-400
"
/>


</div>




<h3
className="
text-5xl
font-black
mt-6
"
>

{item.value}

</h3>



<p
className="
mt-3
text-xs
uppercase
font-mono
text-neutral-400
"
>

{item.label}

</p>



</div>


</motion.div>


)


})

}



</div>


</section>


)


}