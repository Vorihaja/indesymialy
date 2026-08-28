interface Props {
  label:string;
  value:number;
  accent?:string;
}


export function StatBox({
  label,
  value,
  accent="text-white",
}:Props) {


  return (

    <div className="border border-neutral-800 bg-neutral-900 p-5 shadow-xl">


      <p className="text-xs uppercase tracking-wider text-neutral-500">
        {label}
      </p>


      <p className={`mt-2 text-3xl font-black ${accent}`}>
        {value}
      </p>


    </div>

  );
}