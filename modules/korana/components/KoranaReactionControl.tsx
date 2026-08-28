"use client";

import {
  useState,
} from "react";

import {
  ChevronDown,
  Heart,
  LoaderCircle,
} from "lucide-react";

import type {
  KoranaReactionType,
} from "../reaction.types";

import {
  useKoranaReactionActions,
} from "../hooks/useKoranaReactionActions";


const REACTIONS: Array<{
  type: KoranaReactionType;
  emoji: string;
  label: string;
}> = [
  {
    type:
      "like",

    emoji:
      "❤️",

    label:
      "Like",
  },

  {
    type:
      "support",

    emoji:
      "🤝",

    label:
      "Support",
  },

  {
    type:
      "respect",

    emoji:
      "🏅",

    label:
      "Respect",
  },

  {
    type:
      "fire",

    emoji:
      "🔥",

    label:
      "Fire",
  },
];


function normalizeReaction(
  value:
    string | null,
): KoranaReactionType | null {

  if (
    value === "like" ||
    value === "support" ||
    value === "respect" ||
    value === "fire"
  ) {

    return value;
  }


  return null;
}


function reactionMeta(
  type:
    KoranaReactionType | null,
) {

  return REACTIONS.find(
    (reaction) =>
      reaction.type ===
      type,
  ) ?? null;
}


export function KoranaReactionControl({
  postId,
  currentActorId,
  reactionType,
  reactionsCount,
  onChanged,
}: {
  postId:
    string;

  currentActorId:
    string | null;

  reactionType:
    string | null;

  reactionsCount:
    number;

  onChanged:
    () => Promise<unknown>;
}) {

  const actions =
    useKoranaReactionActions();


  const [
    pickerOpen,
    setPickerOpen,
  ] =
    useState(false);


  const currentReaction =
    normalizeReaction(
      reactionType,
    );


  const currentMeta =
    reactionMeta(
      currentReaction,
    );


  async function applyReaction(
    type:
      KoranaReactionType,
  ) {

    if (
      !currentActorId ||
      actions.pending
    ) {

      return;
    }


    actions.clearError();

    setPickerOpen(
      false,
    );


    try {

      await actions.setReaction(
        {
          actorId:
            currentActorId,

          postId,

          reactionType:
            type,
        },
      );


      await onChanged();

    } catch {

      // Hook exposes error.
    }
  }


  /*
   * Main button behaviour:
   *
   * no existing reaction -> Like
   * existing reaction    -> toggle that same reaction off
   */

  function handleMainClick() {

    void applyReaction(
      currentReaction ??
      "like",
    );
  }


  return (
    <div className="korana-reaction-control relative">

      <div className="inline-flex items-center">

        <button
          type="button"
          disabled={
            !currentActorId ||
            actions.pending
          }
          onClick={
            handleMainClick
          }
          className={
            currentReaction
              ? "korana-social-action inline-flex h-8 items-center gap-2 rounded-l-full px-2 text-xs font-semibold text-[#ff4058] transition hover:bg-[#ff4058]/[0.07] disabled:opacity-40"
              : "korana-social-action inline-flex h-8 items-center gap-2 rounded-l-full px-2 text-xs text-zinc-500 transition hover:bg-white/[0.04] hover:text-zinc-300 disabled:opacity-40"
          }
          title={
            currentMeta
              ? `${currentMeta.label} — cliquer pour retirer`
              : "Like"
          }
        >

          {actions.pending ? (

            <LoaderCircle
              size={16}
              className="animate-spin"
            />

          ) : currentMeta ? (

            <span
              aria-hidden="true"
              className="text-[16px] leading-none"
            >
              {currentMeta.emoji}
            </span>

          ) : (

            <Heart
              size={16}
            />

          )}


          <span>
            {reactionsCount}
          </span>

        </button>


        <button
          type="button"
          disabled={
            !currentActorId ||
            actions.pending
          }
          onClick={() =>
            setPickerOpen(
              (current) =>
                !current,
            )
          }
          className={
            currentReaction
              ? "grid h-8 w-7 place-items-center rounded-r-full text-[#ff4058] transition hover:bg-[#ff4058]/[0.07] disabled:opacity-40"
              : "grid h-8 w-7 place-items-center rounded-r-full text-zinc-600 transition hover:bg-white/[0.04] hover:text-zinc-300 disabled:opacity-40"
          }
        >
          <ChevronDown
            size={13}
          />
        </button>

      </div>


      {pickerOpen ? (

        <div
          className="absolute bottom-11 right-0 z-[200] grid grid-cols-2 gap-1 rounded-2xl border border-white/[0.09] bg-[#111318] p-1.5 shadow-2xl sm:left-0 sm:right-auto sm:flex"
        >

          {REACTIONS.map(
            (reaction) => {

              const selected =
                currentReaction ===
                reaction.type;


              return (
                <button
                  key={
                    reaction.type
                  }
                  type="button"
                  disabled={
                    actions.pending
                  }
                  onClick={() =>
                    void applyReaction(
                      reaction.type,
                    )
                  }
                  title={
                    selected
                      ? `${reaction.label} — retirer`
                      : reaction.label
                  }
                  className={
                    selected
                      ? "flex min-w-[62px] flex-col items-center gap-1 rounded-xl bg-white/[0.09] px-2 py-2 text-[9px] font-bold text-white"
                      : "flex min-w-[62px] flex-col items-center gap-1 rounded-xl px-2 py-2 text-[9px] font-semibold text-zinc-500 transition hover:bg-white/[0.05] hover:text-zinc-200"
                  }
                >

                  <span className="text-xl leading-none">
                    {reaction.emoji}
                  </span>

                  <span>
                    {reaction.label}
                  </span>

                </button>
              );
            },
          )}

        </div>

      ) : null}


      {actions.error ? (

        <div className="absolute right-0 top-11 z-[200] w-[min(220px,calc(100vw-2rem))] rounded-lg border border-red-500/20 bg-[#111318] px-3 py-2 shadow-xl">

          <p className="text-[10px] leading-4 text-red-400">
            {actions.error}
          </p>

        </div>

      ) : null}

    </div>
  );
}
