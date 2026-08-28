"use client";

import {
  LoaderCircle,
} from "lucide-react";

import type {
  KoranaFeedMedia,
} from "../feed.types";

import {
  useKoranaMediaUrls,
} from "../hooks/useKoranaMediaUrls";


export function KoranaMediaGallery({
  media,
}: {
  media: KoranaFeedMedia[];
}) {

  const {
    urls,
    loading,
  } =
    useKoranaMediaUrls(
      media,
    );


  if (
    media.length === 0
  ) {
    return null;
  }


  if (loading) {

    return (
      <div className="korana-media-gallery mt-4 grid min-h-48 place-items-center rounded-2xl border border-white/[0.07] bg-white/[0.02]">

        <LoaderCircle
          size={20}
          className="animate-spin text-zinc-600"
        />

      </div>
    );
  }


  const gridClass =
    media.length === 1
      ? "grid-cols-1"
      : "grid-cols-2";


  return (
    <div
      className={
        `korana-media-gallery mt-4 grid ${gridClass} gap-1 overflow-hidden rounded-2xl border border-white/[0.07] bg-black`
      }
    >

      {media.map(
        (item) => {

          const url =
            urls[
              item.storagePath
            ];


          if (!url) {

            return (
              <div
                key={item.id}
                className="grid min-h-48 place-items-center bg-[#111318] px-4 text-center text-xs text-zinc-600"
              >
                Média indisponible
              </div>
            );
          }


          if (
            item.mediaType ===
            "video"
          ) {

            return (
              <video
                key={item.id}
                src={url}
                controls
                preload="metadata"
                className="max-h-[620px] w-full bg-black object-contain"
              />
            );
          }


          return (
            <img
              key={item.id}
              src={url}
              alt={
                item.altText ??
                ""
              }
              loading="lazy"
              className="h-full max-h-[620px] min-h-48 w-full object-cover"
            />
          );
        },
      )}

    </div>
  );
}
