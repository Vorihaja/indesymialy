interface Props {

  percentage:number;

  total:number;

}


export function WinRateCard({
  percentage,
  total,
}:Props) {


  return (

    <section className="border border-neutral-800 bg-neutral-900 p-6">


      <p className="text-xs uppercase tracking-wider text-neutral-500">
        Taux de victoire
      </p>


      <div className="mt-3 flex items-end gap-3">

        <span className="text-5xl font-black text-white">
          {percentage}%
        </span>


        <span className="mb-2 text-sm text-neutral-400">
          sur {total} combats
        </span>


      </div>


      <div className="mt-5 h-2 bg-neutral-800 overflow-hidden">


        <div
          className="h-full bg-emerald-500"
          style={{
            width:`${percentage}%`,
          }}
        />


      </div>


    </section>

  );
}