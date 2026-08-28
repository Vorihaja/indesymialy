"use client";

interface Props {
  query:string;
  setQuery:(value:string)=>void;
}


export function FighterSearchFilters({
  query,
  setQuery,
}:Props){

return (

<div className="border border-neutral-800 bg-neutral-900 p-5">

<input
value={query}
onChange={(e)=>setQuery(e.target.value)}
placeholder="Rechercher un combattant..."
className="
w-full
bg-neutral-950
border
border-neutral-700
px-4
py-3
text-white
"
/>

</div>

);

}