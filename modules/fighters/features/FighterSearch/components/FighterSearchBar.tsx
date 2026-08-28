interface Props {

  value:string;

  onChange:(value:string)=>void;

}


export function FighterSearchBar({
  value,
  onChange,
}:Props) {


  return (

    <input
      value={value}
      onChange={(e)=>onChange(e.target.value)}
      placeholder="Rechercher un combattant..."
      className="
        w-full
        bg-neutral-900
        border
        border-neutral-800
        px-4
        py-3
        text-white
        outline-none
      "
    />

  );
}