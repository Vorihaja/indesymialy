import type { Fighter } from "@/modules/fighters/types";

interface Props {
  fighter: Fighter;
}

export function FighterProfileOverview({
  fighter,
}: Props) {

  const fighterExtended = fighter as Fighter & {
    club_name?: string;
    coach_name?: string;
    discipline?: string;
  };


  return (
    <section className="border border-neutral-800 bg-neutral-900 p-5">

      <h2 className="text-xs uppercase text-neutral-500">
        Présentation
      </h2>


      <div className="mt-4 space-y-2 text-sm text-neutral-300">

        <p>
          Discipline :
          {" "}
          {fighterExtended.discipline ?? "-"}
        </p>


        <p>
          Style :
          {" "}
          {fighter.fighting_style ?? "-"}
        </p>


        <p>
          Garde :
          {" "}
          {fighter.guard ?? "-"}
        </p>


        <p>
          Club :
          {" "}
          {fighterExtended.club_name ?? "-"}
        </p>


        <p>
          Coach :
          {" "}
          {fighterExtended.coach_name ?? "-"}
        </p>


      </div>

    </section>
  );
}