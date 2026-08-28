import type {
  Fighter,
} from "@/modules/fighters/types";


interface Props {

  fighter: Fighter;

}



export function FighterListCard({
  fighter,
}: Props) {


  return (

    <article
      className="
        border
        border-neutral-800
        bg-neutral-900
        p-5
        hover:border-neutral-600
        transition
      "
    >


      <div className="space-y-2">


        <h3
          className="
            text-lg
            font-black
            text-white
          "
        >

          {fighter.first_name} {fighter.last_name}

        </h3>



        <p
          className="
            text-sm
            text-neutral-400
          "
        >

          {fighter.nickname
            ? `"${fighter.nickname}"`
            : "Sans surnom"}

        </p>


      </div>



      <div
        className="
          mt-4
          text-sm
          text-neutral-300
          space-y-1
        "
      >

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


        <p>
          Style :
          {" "}
          {fighter.fighting_style ?? "-"}
        </p>


      </div>


    </article>

  );
}