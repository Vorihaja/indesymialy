"use client";

import {
  Bookmark,
  LoaderCircle,
} from "lucide-react";

import {
  useKoranaSavedPostActions,
} from "../hooks/useKoranaSavedPostActions";


export function KoranaSavedPostControl({
  postId,
  currentActorId,
  saved,
  onChanged,
}: {
  postId: string;

  currentActorId:
    string | null;

  saved:
    boolean;

  onChanged:
    () => Promise<unknown>;
}) {

  const actions =
    useKoranaSavedPostActions();


  async function toggle() {

    if (
      !currentActorId ||
      actions.pending
    ) {

      return;
    }


    actions.clearError();


    try {

      await actions.setSaved(
        {
          actorId:
            currentActorId,

          postId,

          saved:
            !saved,
        },
      );


      await onChanged();

    } catch {

      // Error exposed by hook.
    }
  }


  return (
    <div className="relative flex justify-end">

      <button
        type="button"
        disabled={
          !currentActorId ||
          actions.pending
        }
        onClick={() =>
          void toggle()
        }
        aria-pressed={
          saved
        }
        aria-label={
          saved
            ? "Retirer des Enregistrés"
            : "Enregistrer cette publication"
        }
        title={
          saved
            ? "Retirer des Enregistrés"
            : "Enregistrer"
        }
        className={
          saved
            ? "korana-social-action inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#3d92ff]/[0.08] text-[#64a8ff] transition hover:bg-[#3d92ff]/[0.14] disabled:cursor-not-allowed disabled:opacity-40"
            : "korana-social-action inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition hover:bg-[#3d92ff]/[0.06] hover:text-[#64a8ff] disabled:cursor-not-allowed disabled:opacity-40"
        }
      >

        {actions.pending ? (

          <LoaderCircle
            size={16}
            className="animate-spin"
          />

        ) : (

          <Bookmark
            size={16}
            fill={
              saved
                ? "currentColor"
                : "none"
            }
          />

        )}

      </button>


      {actions.error ? (

        <div className="absolute bottom-11 right-0 z-[200] w-[min(230px,calc(100vw-2rem))] border border-red-500/20 bg-[#0b0f15] px-3 py-2 shadow-2xl">

          <p className="text-[10px] leading-4 text-red-300">
            {actions.error}
          </p>

        </div>

      ) : null}

    </div>
  );
}
