"use client";

import {
  useState,
} from "react";

import type {
  Fighter,
} from "@/modules/fighters/types";


import {
  FighterEditorField,
  FighterEditorActions,
} from "@/modules/fighters/features/FighterEditor";



interface Props {

  fighter:Fighter;

  onSuccess?:()=>void;

}



export function FighterEditorForm({
  fighter,
  onSuccess,
}:Props) {



  const [
    form,
    setForm,
  ] = useState({

    first_name:
      fighter.first_name ?? "",

    last_name:
      fighter.last_name ?? "",

    nickname:
      fighter.nickname ?? "",

    category:
      fighter.category ?? "",

    fighting_style:
      fighter.fighting_style ?? "",

    guard:
      fighter.guard ?? "",

    weight:
      fighter.weight ?? "",

    height:
      fighter.height ?? "",

  });



  const [
    loading,
    setLoading,
  ] = useState(false);



  function updateField(
    key:keyof typeof form,
    value:string,
  ){

    setForm((previous)=>({

      ...previous,

      [key]:value,

    }));

  }



  async function handleSubmit(
    event:React.FormEvent
  ){

    event.preventDefault();


    try {

      setLoading(true);


      /*
        Le branchement repository/service
        sera ajouté dans la couche use-case.
      */


      console.log(
        "update fighter",
        fighter.id,
        form
      );


      onSuccess?.();


    }

    finally {

      setLoading(false);

    }

  }



  return (

    <form

      onSubmit={handleSubmit}

      className="
        space-y-6
      "

    >


      <div
        className="
          grid
          md:grid-cols-2
          gap-4
        "
      >


        <FighterEditorField

          label="Prénom"

          name="first_name"

          value={form.first_name}

          onChange={(v)=>
            updateField(
              "first_name",
              v
            )
          }

        />



        <FighterEditorField

          label="Nom"

          name="last_name"

          value={form.last_name}

          onChange={(v)=>
            updateField(
              "last_name",
              v
            )
          }

        />



        <FighterEditorField

          label="Surnom"

          name="nickname"

          value={form.nickname}

          onChange={(v)=>
            updateField(
              "nickname",
              v
            )
          }

        />



        <FighterEditorField

          label="Catégorie"

          name="category"

          value={form.category}

          onChange={(v)=>
            updateField(
              "category",
              v
            )
          }

        />



        <FighterEditorField

          label="Poids"

          name="weight"

          value={form.weight}

          onChange={(v)=>
            updateField(
              "weight",
              v
            )
          }

        />



        <FighterEditorField

          label="Taille"

          name="height"

          value={form.height}

          onChange={(v)=>
            updateField(
              "height",
              v
            )
          }

        />



        <FighterEditorField

          label="Style combat"

          name="fighting_style"

          value={form.fighting_style}

          onChange={(v)=>
            updateField(
              "fighting_style",
              v
            )
          }

        />



        <FighterEditorField

          label="Garde"

          name="guard"

          value={form.guard}

          onChange={(v)=>
            updateField(
              "guard",
              v
            )
          }

        />


      </div>



      <FighterEditorActions

        loading={loading}

      />


    </form>

  );
}