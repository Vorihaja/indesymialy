"use client";

import {
  Activity,
  Radio,
  Timer,
  Shield,
  Target,
  Trophy
} from "lucide-react";

import { motion } from "framer-motion";


const FIGHT_DATA = {

status:"LIVE",

event:"MAHAJANGA FIGHT NIGHT VOL.3",

round:"ROUND 2",

time:"03:24",

fighterA:{
name:"Rova Rakotonirina",
record:"12 - 2 - 0",
score:10,
color:"red"
},

fighterB:{
name:"Jean Razafindrakoto",
record:"10 - 1 - 0",
score:9,
color:"blue"
}

};



const JUDGES=[

{
name:"Juge 1",
score:"10 - 9"
},

{
name:"Juge 2",
score:"10 - 9"
},

{
name:"Juge 3",
score:"10 - 8"
}

];



export default function LiveFightCenter(){


return (

<section
className="
relative
"
>


<div
className="
flex
items-center
justify-between
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

<Radio
className="
text-red-500
animate-pulse
"
/>


<h2
className="
text-2xl
font-black
uppercase
tracking-tight
"
>

Live Fight Center

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

Suivi officiel des combats en direct

</p>


</div>



<span
className="
bg-blue-600/10
border
border-blue-500/30
text-blue-500
px-4
py-2
font-mono
text-xs
"
>

● {FIGHT_DATA.status}

</span>


</div>





<motion.div

initial={{
opacity:0,
y:40
}}

whileInView={{
opacity:1,
y:0
}}

transition={{
duration:.8
}}

viewport={{
once:true
}}

className="
bg-neutral-950
border
border-red-500/20
overflow-hidden
"

>



{/* HEADER */}

<div
className="
flex
justify-between
items-center
px-6
py-4
border-b
border-neutral-800
bg-black
"
>


<div
className="
font-mono
text-xs
text-neutral-400
"
>

{FIGHT_DATA.event}

</div>



<div
className="
flex
items-center
gap-2
font-mono
font-bold
"
>

<Timer
size={18}
className="text-red-500"
/>

{FIGHT_DATA.round}

<span
className="
text-red-500
"
>

{FIGHT_DATA.time}

</span>


</div>


</div>






{/* FIGHTERS */}

<div
className="
grid
grid-cols-1
md:grid-cols-3
gap-6
p-8
items-center
"
>



<div
className="
text-center
"
>


<div
className="
w-24
h-24
mx-auto
rounded-full
bg-red-600/10
border
border-red-500
flex
items-center
justify-center
"
>

<Target
size={40}
className="text-red-500"
/>

</div>


<h3
className="
mt-5
text-xl
font-black
uppercase
"
>

{FIGHT_DATA.fighterA.name}

</h3>


<p
className="
text-neutral-500
font-mono
text-sm
"
>

{FIGHT_DATA.fighterA.record}

</p>



<div
className="
mt-5
text-5xl
font-black
text-red-500
"
>

{FIGHT_DATA.fighterA.score}

</div>


</div>






<div
className="
text-center
"
>


<motion.div

animate={{
scale:[1,1.15,1]
}}

transition={{
duration:2,
repeat:Infinity
}}

className="
text-5xl
font-black
text-white
"

>

VS

</motion.div>


<div
className="
mt-4
text-xs
font-mono
text-neutral-500
"
>

OFFICIAL SCORECARD

</div>


</div>






<div
className="
text-center
"
>


<div
className="
w-24
h-24
mx-auto
rounded-full
bg-blue-600/10
border
border-blue-500
flex
items-center
justify-center
"
>

<Shield
size={40}
className="text-blue-500"
/>

</div>



<h3
className="
mt-5
text-xl
font-black
uppercase
"
>

{FIGHT_DATA.fighterB.name}

</h3>


<p
className="
text-neutral-500
font-mono
text-sm
"
>

{FIGHT_DATA.fighterB.record}

</p>


<div
className="
mt-5
text-5xl
font-black
text-blue-500
"
>

{FIGHT_DATA.fighterB.score}

</div>



</div>



</div>







{/* JUGES */}

<div
className="
border-t
border-neutral-800
p-6
grid
grid-cols-1
md:grid-cols-3
gap-4
"
>


{

JUDGES.map((judge,index)=>(


<div
key={index}

className="
bg-black
border
border-neutral-800
p-4
flex
justify-between
items-center
"
>


<div
className="
flex
items-center
gap-3
"
>

<Trophy
size={16}
className="text-yellow-500"
/>


<span
className="
font-mono
text-xs
uppercase
"
>

{judge.name}

</span>


</div>


<strong
className="
font-mono
"
>

{judge.score}

</strong>


</div>


))

}


</div>





</motion.div>


</section>

)

}
