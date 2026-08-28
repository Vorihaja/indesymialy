"use client";

import {
  useState,
} from "react";

import {
  FighterField,
  FighterRegistrationActions,
} from "@/modules/fighters/features/FighterRegistration";

import {
  useCreateFighter,
} from "@/modules/fighters/hooks";



interface Props {

  onSuccess?: () => void;

}



interface FormState {

  first_name: string;

  last_name: string;

  nickname: string;

  date_of_birth: string;

  weight: string;

  height: string;

  category: string;

  fighting_style: string;

  guard: string;

}



const INITIAL_STATE: FormState = {

  first_name: "",

  last_name: "",

  nickname: "",

  date_of_birth: "",

  weight: "",

  height: "",

  category: "",

  fighting_style: "",

  guard: "",

};




export function FighterRegistrationForm({
  onSuccess,
}: Props) {


  const [
    form,
    setForm,
  ] = useState<FormState>(
    INITIAL_STATE
  );



  const {
    createFighter,
    loading,
    error,
  } = useCreateFighter();




  function updateField(
    key: keyof FormState,
    value: string,
  ) {


    setForm((prev) => ({

      ...prev,

      [key]: value,

    }));

  }




  async function handleSubmit(
    e: React.FormEvent
  ) {


    e.preventDefault();



    const result =
      await createFighter({

        first_name: form.first_name,

        last_name: form.last_name,

        nickname:
          form.nickname || undefined,


        birth_date:
          form.date_of_birth || undefined,


        weight:
          form.weight
            ? Number(form.weight)
            : undefined,


        height:
          form.height
            ? Number(form.height)
            : undefined,


        category:
          form.category || undefined,


        fighting_style:
          form.fighting_style || undefined,


        guard:
          form.guard || undefined,


        status: "pending",

      });



    if (result) {

      onSuccess?.();

      setForm(INITIAL_STATE);

    }

  }




  return (

    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >


      {error && (

        <div
          className="
            border
            border-red-800
            bg-red-950
            text-red-300
            p-3
            text-sm
          "
        >

          {error}

        </div>

      )}



      <div
        className="
          grid
          md:grid-cols-2
          gap-4
        "
      >


        <FighterField
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



        <FighterField
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



        <FighterField
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



        <FighterField
          label="Date naissance"
          name="date_of_birth"
          type="date"
          value={form.date_of_birth}
          onChange={(v)=>
            updateField(
              "date_of_birth",
              v
            )
          }
        />



        <FighterField
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



        <FighterField
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



        <FighterField
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



        <FighterField
          label="Style"
          name="fighting_style"
          value={form.fighting_style}
          onChange={(v)=>
            updateField(
              "fighting_style",
              v
            )
          }
        />



        <FighterField
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



      <FighterRegistrationActions
        loading={loading}
      />


    </form>

  );

}