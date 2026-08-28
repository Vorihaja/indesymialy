"use client";

import {
  Repeat2,
} from "lucide-react";

import type {
  KoranaFeedItem,
} from "../feed.types";

import {
  KoranaPostCard,
} from "./KoranaPostCard";


function activityDateLabel(
  value: string,
) {

  const date =
    new Date(
      value,
    );


  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {

    return "";
  }


  return new Intl.DateTimeFormat(
    "fr-FR",
    {
      dateStyle:
        "medium",

      timeStyle:
        "short",
    },
  ).format(
    date,
  );
}


export function KoranaFeedActivityCard({
  item,
  canManage,
  currentActorId,
  onChanged,
}: {
  item:
    KoranaFeedItem;

  canManage:
    boolean;

  currentActorId:
    string | null;

  onChanged:
    () => Promise<unknown>;
}) {

  const repost =
    item.repost;


  return (
    <div>

      {repost ? (

        <div className="flex items-center gap-2 border-b border-white/[0.035] bg-[#3d92ff]/[0.025] px-4 py-2 text-[10px] text-[#8f9bad] sm:px-6">

          <Repeat2
            size={13}
            className="shrink-0 text-[#64a8ff]"
            aria-hidden="true"
          />


          <span className="min-w-0 truncate">

            {currentActorId ===
            repost.by.id ? (

              <strong className="font-bold text-[#c7d5e7]">
                Vous avez republié
              </strong>

            ) : (

              <>
                <strong className="font-bold text-[#c7d5e7]">
                  {repost.by.displayName}
                </strong>

                {" a republié"}
              </>

            )}

          </span>


          {repost.createdAt ? (

            <>
              <span
                aria-hidden="true"
                className="text-[#576273]"
              >
                ·
              </span>

              <time className="shrink-0 text-[#718095]">
                {activityDateLabel(
                  repost.createdAt,
                )}
              </time>
            </>

          ) : null}

        </div>

      ) : null}


      <KoranaPostCard
        item={
          item
        }
        canManage={
          canManage
        }
        currentActorId={
          currentActorId
        }
        onChanged={
          onChanged
        }
      />

    </div>
  );
}