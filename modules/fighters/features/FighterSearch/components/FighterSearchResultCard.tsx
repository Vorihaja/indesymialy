import type {
  Fighter,
} from "@/modules/fighters/types";


interface Props {

  fighter:Fighter;

}


export function FighterSearchResultCard({
  fighter,
}:Props) {


  return (

    <article
      className="
        border
        border-neutral-800
        bg-neutral-900
        p-5
      "
    >

      <h3 className="text-lg font-black text-white">

        {fighter.first_name} {fighter.last_name}

      </h3>


      <p className="text-sm text-neutral-400 mt-2">

        {fighter.nickname ?? "Sans surnom"}

      </p>


      <div className="mt-4 space-y-1 text-sm text-neutral-300">

        <p>
          Catégorie :
          {" "}
          {fighter.category ?? "-"}
        </p>


        <p>
          Statut :
          {" "}
          {fighter.status}
        </p>


      </div>


    </article>

  );
}