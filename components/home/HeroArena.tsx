"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Zap,
  TrendingUp,
  Users,
  Trophy,
  Activity,
  ShieldCheck
} from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";

import HeroStatusPanel from "@/components/home/HeroStatusPanel";

const HERO_SLIDES = [
  {
    tag: "GALA EXCLUSIF BOENY",
    title: "MAHAJANGA FIGHT NIGHT VOL.3",
    description:
      "Le plus grand événement MMA et Kickboxing de la province débarque. Les ceintures nationales sont en jeu.",
    image:
      "https://jwoxjvrsgywmlvbzhyoi.supabase.co/storage/v1/object/public/public-images/combattant_1",
    buttons: [
      {
        label: "Réserver vos places",
        href: "/events",
        primary: true,
      },
      {
        label: "Voir la Fight Card",
        href: "/events",
        primary: false,
      },
    ],
  },


  {
    tag: "ATHLÈTES MALAGASY",
    title:
      "CONSTRUISEZ VOTRE CARRIÈRE PROFESSIONNELLE",
    description:
      "Profils officiels, classements, statistiques et opportunités pour les combattants.",
    image:
      "https://jwoxjvrsgywmlvbzhyoi.supabase.co/storage/v1/object/public/public-images/banniere_Indesy_Mialy",
    buttons:[
      {
        label:"Explorer les combattants",
        href:"/combattants",
        primary:true
      }
    ]
  },


  {
    tag:"ERP COMBAT SPORTS",
    title:
      "GÉREZ VOTRE STRUCTURE COMME UN PROFESSIONNEL",
    description:
      "Clubs, organisateurs, arbitres et sponsors disposent d'outils numériques avancés.",
    image:
      "https://jwoxjvrsgywmlvbzhyoi.supabase.co/storage/v1/object/public/public-images/affiche%201",
    buttons:[
      {
        label:"Découvrir les outils",
        href:"/dashboard",
        primary:true
      }
    ]
  }

];


const LIVE_STATS = [
  {
    label:"Combattants",
    value:"340+",
    icon:Users
  },
  {
    label:"Événements",
    value:"18",
    icon:Trophy
  },
  {
    label:"Disciplines",
    value:"6",
    icon:Activity
  },
  {
    label:"Clubs",
    value:"45",
    icon:ShieldCheck
  }
];



export default function HeroArena(){


const [slide,setSlide]=useState(0);
const [progress,setProgress]=useState(0);



useEffect(()=>{


const timer=setInterval(()=>{

setProgress(value=>{

if(value>=100){

setSlide(
current=>
(current+1)%HERO_SLIDES.length
);

return 0;

}


return value+1;

});


},60);


return()=>clearInterval(timer);


},[]);



const next=()=>{

setSlide(
(slide+1)%HERO_SLIDES.length
);

setProgress(0);

};



const previous=()=>{

setSlide(
(slide-1+HERO_SLIDES.length)%HERO_SLIDES.length
);

setProgress(0);

};



const current=HERO_SLIDES[slide];



return (

<section
className="
relative
min-h-[85vh]
flex
items-center
overflow-hidden
border-b
border-neutral-900
"
>



{/* BACKGROUNDS */}

<AnimatePresence>

<motion.img

key={current.image}

src={current.image}

initial={{
opacity:0,
scale:1.2
}}

animate={{
opacity:.35,
scale:1
}}

exit={{
opacity:0
}}

transition={{
duration:1.5
}}

className="
absolute
inset-0
w-full
h-full
object-cover
"

/>

</AnimatePresence>



<div
className="
absolute
inset-0
bg-gradient-to-t
from-black
via-black/50
to-black
"
/>



{/* SCANNER */}

<div
className="
absolute
inset-0
bg-[linear-gradient(
transparent,
rgba(255,0,0,.08),
transparent
)]
animate-pulse
"
/>




<div
className="
relative
z-10
max-w-[1680px]
mx-auto
w-full
px-6
grid
grid-cols-1
lg:grid-cols-12
gap-12
items-center
"
>


{/* TEXTE */}

<div
className="
lg:col-span-7
"
>


<motion.span

key={current.tag}

initial={{
opacity:0,
y:20
}}

animate={{
opacity:1,
y:0
}}

className="
inline-flex
items-center
gap-2
border
border-red-500/30
bg-red-500/10
px-4
py-2
text-xs
font-mono
tracking-widest
text-red-500
"
>

<Zap size={14}/>
{current.tag}

</motion.span>



<AnimatePresence mode="wait">

<motion.div

key={current.title}

initial={{
opacity:0,
x:-80
}}

animate={{
opacity:1,
x:0
}}

exit={{
opacity:0,
x:80
}}

transition={{
duration:.7
}}

>


<h1
className="
mt-8
text-5xl
md:text-7xl
font-black
uppercase
tracking-tighter
leading-none
"
>

{current.title}

</h1>


<p
className="
mt-6
max-w-xl
text-neutral-400
text-lg
"
>

{current.description}

</p>


</motion.div>

</AnimatePresence>



<div
className="
flex
gap-4
mt-10
flex-wrap
"
>

{current.buttons.map((button,index)=>(

<Link

key={index}

href={button.href}

className={`
px-8
py-4
font-mono
uppercase
text-xs
font-black
transition-all

${
button.primary

?
"bg-red-600 hover:bg-red-500"

:

"border border-red-600 text-red-500 hover:bg-red-600 hover:text-white"

}

`}

>

{button.label}

</Link>


))}


</div>


</div>




{/* HERO STATUS PANEL */}

<div
className="
lg:col-span-5
"
>

    <HeroStatusPanel />

</div>




</div>




{/* CONTROLES */}

<div
className="
absolute
bottom-1
left-0
right-0
flex
left
gap-4
z-20
"
>


<button
onClick={previous}
className="
border
border-neutral-700
p-3
hover:border-red-500
"
>

<ChevronLeft/>

</button>


<button
onClick={next}
className="
border
border-neutral-700
p-3
hover:border-red-500
"
>

<ChevronRight/>

</button>



</div>



</section>


)

}