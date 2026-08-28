"use client";

import {
  FighterRegistrationForm,
} from "@/modules/fighters/features/FighterRegistration";


interface Props {
  onSuccess?: () => void;
}



export function FighterRegistrationView({
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
          Inscription combattant
        </h1>


        <p
          className="
            mt-2
            text-sm
            text-neutral-400
          "
        >
          Création du profil sportif.
        </p>

      </div>


      <FighterRegistrationForm
        onSuccess={onSuccess}
      />


    </div>

  );
}