"use client";


import type {
  Fighter,
} from "@/modules/fighters/types";


import {
  useManageFighter,
} from "@/modules/fighters/hooks";


import {
  FighterStatusBadge,
  FighterManagementActions,
} from "@/modules/fighters/features/FighterManagement";



interface Props {

  fighter: Fighter;

}



export function FighterManagementView({
  fighter,
}: Props) {


  const {

    activateFighter,

    suspendFighter,

    deactivateFighter,

    loading,

    error,

  } = useManageFighter();





  return (

    <div
      className="
        border
        border-neutral-800
        bg-neutral-900
        p-6
        space-y-5
      "
    >


      <div
        className="
          flex
          justify-between
          items-center
        "
      >


        <div>

          <h2
            className="
              text-xl
              font-black
              text-white
            "
          >

            {fighter.first_name} {fighter.last_name}

          </h2>


          <p
            className="
              text-sm
              text-neutral-400
            "
          >

            Gestion du statut combattant

          </p>


        </div>



        <FighterStatusBadge
          status={fighter.status}
        />


      </div>



      {error && (

        <p
          className="
            text-sm
            text-red-400
          "
        >

          {error}

        </p>

      )}




      <FighterManagementActions

        loading={loading}

        onActivate={() =>
          activateFighter(
            fighter.id
          )
        }

        onSuspend={() =>
          suspendFighter(
            fighter.id
          )
        }

        onDeactivate={() =>
          deactivateFighter(
            fighter.id
          )
        }

      />


    </div>

  );

}