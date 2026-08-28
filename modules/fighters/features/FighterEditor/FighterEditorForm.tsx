"use client";

import { useState } from "react";
import { useUpdateFighter } from "@/modules/fighters/hooks/useUpdateFighter";
import type { Fighter } from "@/modules/fighters/types";

interface FighterEditorFormProps {
  fighter: Fighter;
  onSuccess?: (fighter: Fighter | null) => void;
}

type FighterStatus =
  | "active"
  | "inactive"
  | "suspended"
  | "pending";

export function FighterEditorForm({
  fighter,
  onSuccess,
}: FighterEditorFormProps) {
  const {
    updateFighter,
    loading,
    error,
  } = useUpdateFighter();

  const [form, setForm] = useState({
    first_name: fighter.first_name ?? "",
    last_name: fighter.last_name ?? "",
    nickname: fighter.nickname ?? "",
    status: fighter.status ?? "pending",
    weight: fighter.weight ?? null,
    height: fighter.height ?? null,
    reach: fighter.reach ?? null,
    fighting_style: fighter.fighting_style ?? null,
    guard: fighter.guard ?? null,
  });


  function handleChange(
    field: keyof typeof form,
    value: string | number | null
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }


  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const updates: Partial<Fighter> = {
      first_name: form.first_name,
      last_name: form.last_name,
      nickname: form.nickname,

      status: form.status as FighterStatus,

      weight:
        form.weight === null
          ? undefined
          : form.weight,

      height:
        form.height === null
          ? undefined
          : form.height,

      reach:
        form.reach === null
          ? undefined
          : form.reach,

      fighting_style:
        form.fighting_style ?? undefined,

      guard:
        form.guard ?? undefined,
    };


    const result = await updateFighter(
      fighter.id,
      updates
    );


    if (onSuccess) {
      onSuccess(result);
    }
  }


  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 border border-neutral-800 bg-neutral-900 p-6"
    >

      <div>
        <label className="text-xs text-neutral-400">
          Prénom
        </label>

        <input
          value={form.first_name}
          onChange={(e) =>
            handleChange(
              "first_name",
              e.target.value
            )
          }
          className="w-full bg-neutral-950 border border-neutral-800 p-3 text-white"
        />
      </div>


      <div>
        <label className="text-xs text-neutral-400">
          Nom
        </label>

        <input
          value={form.last_name}
          onChange={(e) =>
            handleChange(
              "last_name",
              e.target.value
            )
          }
          className="w-full bg-neutral-950 border border-neutral-800 p-3 text-white"
        />
      </div>


      <div>
        <label className="text-xs text-neutral-400">
          Statut
        </label>

        <select
          value={form.status}
          onChange={(e) =>
            handleChange(
              "status",
              e.target.value
            )
          }
          className="w-full bg-neutral-950 border border-neutral-800 p-3 text-white"
        >
          <option value="pending">
            Pending
          </option>

          <option value="active">
            Active
          </option>

          <option value="inactive">
            Inactif
          </option>

          <option value="suspended">
            Suspendu
          </option>
        </select>
      </div>


      <div className="grid md:grid-cols-3 gap-4">

        <input
          type="number"
          placeholder="Poids"
          value={form.weight ?? ""}
          onChange={(e) =>
            handleChange(
              "weight",
              e.target.value
                ? Number(e.target.value)
                : null
            )
          }
          className="bg-neutral-950 border border-neutral-800 p-3 text-white"
        />


        <input
          type="number"
          placeholder="Taille"
          value={form.height ?? ""}
          onChange={(e) =>
            handleChange(
              "height",
              e.target.value
                ? Number(e.target.value)
                : null
            )
          }
          className="bg-neutral-950 border border-neutral-800 p-3 text-white"
        />


        <input
          type="number"
          placeholder="Allonge"
          value={form.reach ?? ""}
          onChange={(e) =>
            handleChange(
              "reach",
              e.target.value
                ? Number(e.target.value)
                : null
            )
          }
          className="bg-neutral-950 border border-neutral-800 p-3 text-white"
        />

      </div>


      <div>
        <label className="text-xs text-neutral-400">
          Style de combat
        </label>

        <input
          value={form.fighting_style ?? ""}
          onChange={(e) =>
            handleChange(
              "fighting_style",
              e.target.value || null
            )
          }
          className="w-full bg-neutral-950 border border-neutral-800 p-3 text-white"
        />

      </div>


      <div>
        <label className="text-xs text-neutral-400">
          Garde
        </label>

        <input
          value={form.guard ?? ""}
          onChange={(e) =>
            handleChange(
              "guard",
              e.target.value || null
            )
          }
          className="w-full bg-neutral-950 border border-neutral-800 p-3 text-white"
        />

      </div>


      {error && (
        <p className="text-sm text-red-400">
          {error}
        </p>
      )}


      <button
        disabled={loading}
        type="submit"
        className="bg-red-600 hover:bg-red-500 px-6 py-3 font-bold text-white"
      >
        {loading
          ? "Enregistrement..."
          : "Sauvegarder"}
      </button>

    </form>
  );
}