import type { Fighter } from "@/modules/fighters/types";


interface Props {
 fighters:Fighter[];
}


export function FighterSearchResults({
 fighters,
}:Props){


if(!fighters.length){

return (

<p className="text-neutral-400">
Aucun combattant trouvé.
</p>

);

}


return (

<div className="grid md:grid-cols-3 gap-4">

{
fighters.map((fighter)=>(

<div
key={fighter.id}
className="
border
border-neutral-800
bg-neutral-900
p-5
"
>

<h3 className="text-white font-bold">

{fighter.first_name} {fighter.last_name}

</h3>


<p className="text-neutral-400 text-sm">

{fighter.category ?? "Catégorie inconnue"}

</p>


</div>

))

}

</div>

);


}