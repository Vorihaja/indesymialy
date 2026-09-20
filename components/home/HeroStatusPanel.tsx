"use client";


import {
  Calendar,
  MapPin,
  Trophy,
  Flame,
  Clock
} from "lucide-react";


import { motion } from "framer-motion";


import {
  useFeaturedEvent
} from "@/modules/events/hooks/useFeaturedEvent";



export default function HeroStatusPanel(){


  const {
    event,
    loading
  } = useFeaturedEvent();



  if(loading){

    return (

      <div
      className="
      bg-neutral-950
      border
      border-neutral-800
      p-6
      text-neutral-500
      font-mono
      text-sm
      "
      >

        Chargement événement...

      </div>

    );

  }



  if(!event){

    return (

      <div
      className="
      bg-neutral-950
      border
      border-red-500/20
      p-6
      text-neutral-400
      font-mono
      text-sm
      "
      >

        Aucun événement disponible

      </div>

    );

  }




return (

<motion.div

initial={{
opacity:0,
x:50
}}

animate={{
opacity:1,
x:0
}}

transition={{
duration:.8
}}

className="
bg-neutral-950/90
backdrop-blur-xl
border
border-red-500/20
p-6
relative
overflow-hidden
"

>


<div
className="
absolute
top-0
right-0
w-40
h-40
bg-red-600/20
blur-[80px]
"
/>



<div
className="
relative
z-10
space-y-6
"
>




{/* HEADER */}

<div
className="
flex
items-center
justify-between
border-b
border-neutral-800
pb-4
"
>


<div
className="
flex
items-center
gap-2
"
>

<Flame
size={18}
className="
text-red-500
animate-pulse
"
/>


<h3
className="
font-mono
font-black
uppercase
tracking-widest
text-sm
"
>

INDESY LIVE STATUS

</h3>


</div>



<span
className="
text-[10px]
font-mono
px-3
py-1
border
border-blue-500/30
text-blue-500
bg-blue-500/10
"
>

{event.status ?? "UPCOMING"}

</span>



</div>







{/* EVENT */}

<div>


<p
className="
text-xs
font-mono
text-neutral-500
uppercase
"
>

Prochain événement majeur

</p>



<h2
className="
text-xl
font-black
uppercase
mt-2
leading-tight
"
>

{event.title}

</h2>


</div>








{/* INFOS */}

<div
className="
space-y-3
font-mono
text-xs
"
>


<div
className="
flex
items-center
gap-3
text-neutral-300
"
>

<Calendar
size={15}
className="
text-red-500
"
/>

{event.event_date}


</div>





<div
className="
flex
items-center
gap-3
text-neutral-300
"
>

<MapPin
size={15}
className="
text-red-500
"
/>

{event.location}


</div>


</div>








{/* FIGHT CARD */}

<div
className="
border
border-neutral-800
p-4
bg-black/40
"
>


<div
className="
flex
items-center
gap-2
text-xs
font-mono
text-neutral-500
mb-4
"
>


<Trophy
size={14}
className="
text-yellow-400
"
/>


MAIN EVENT


</div>




<div
className="
text-center
font-black
text-sm
"
>

Fight Card bientôt disponible

</div>


</div>








{/* COUNTDOWN */}

<div
className="
flex
items-center
gap-2
text-xs
font-mono
text-blue-400
"
>


<Clock
size={14}
/>


COMPTE À REBOURS ACTIVÉ


</div>








<button

className="
w-full
py-3
bg-red-600
hover:bg-red-500
transition
font-mono
text-xs
font-black
uppercase
"

>

Voir la Fight Card

</button>




</div>



</motion.div>


);


}
