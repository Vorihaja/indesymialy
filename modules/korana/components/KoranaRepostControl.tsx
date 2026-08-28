"use client";

import {
  LoaderCircle,
  Repeat2,
} from "lucide-react";

import {
  useKoranaRepostActions,
} from "../hooks/useKoranaRepostActions";


export function KoranaRepostControl({
  postId,
  currentActorId,
  reposted,
  repostsCount,
  onChanged,
}: {
  postId: string;

  currentActorId:
    string | null;

  reposted:
    boolean;

  repostsCount:
    number;

  onChanged:
    () => Promise<unknown>;
}) {

  const actions =
    useKoranaRepostActions();


  async function toggle() {

    if (
      !currentActorId ||
      actions.pending
    ) {

      return;
    }


    actions.clearError();


    try {

      await actions.setRepost(
        {
          actorId:
            currentActorId,

          postId,

          reposted:
            !reposted,
        },
      );


      await onChanged();

    } catch {

      // Error is exposed below.
    }
  }


  return (
    <div className="relative">

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
          reposted
        }
        aria-label={
          reposted
            ? "Annuler la republication"
            : "Republier"
        }
        title={
          reposted
            ? "Annuler la republication"
            : "Republier sur Korana"
        }
        className={
          reposted
            ? "korana-social-action inline-flex h-8 items-center gap-2 rounded-full px-2 text-xs font-semibold text-[#64a8ff] transition hover:bg-[#3d92ff]/[0.08] disabled:cursor-not-allowed disabled:opacity-40"
            : "korana-social-action inline-flex h-8 items-center gap-2 rounded-full px-2 text-xs text-zinc-500 transition hover:bg-[#3d92ff]/[0.06] hover:text-[#64a8ff] disabled:cursor-not-allowed disabled:opacity-40"
        }
      >

        {actions.pending ? (

          <LoaderCircle
            size={16}
            className="animate-spin"
          />

        ) : (

          <Repeat2
            size={16}
          />

        )}


        <span>
          {repostsCount}
        </span>

      </button>


      {actions.error ? (

        <div className="absolute bottom-11 right-0 z-[200] w-[min(230px,calc(100vw-2rem))] border border-red-500/20 bg-[#151b24] px-3 py-2 shadow-2xl">

          <p className="text-[10px] leading-4 text-red-300">
            {actions.error}
          </p>

        </div>

      ) : null}

    </div>
  );
}
