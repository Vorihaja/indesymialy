"use client";

import type { Fighter } from "@/modules/fighters/types";

import {
  FighterEditorForm,
} from "@/modules/fighters/features/FighterEditor";


interface Props {

  fighter: Fighter;

  onSuccess?: () => void;

}



export function FighterEditorView({
  fighter,
  onSuccess,
}: Props) {


  return (

    <div
      className="
        max-w-4xl
        mx-auto
        border
        border-neutral-800
        bg-neutral-900
        p-6
      "
    >

      <div className="mb-6">

        <h1
          className="
            text-2xl
            font-black
            text-white
          "
        >
          Modifier le profil combattant
        </h1>


        <p
          className="
            mt-2
            text-sm
            text-neutral-400
          "
        >
          Mise à jour des informations sportives.
        </p>

      </div>


      <FighterEditorForm
        fighter={fighter}
        onSuccess={onSuccess}
      />

    </div>

  );
}