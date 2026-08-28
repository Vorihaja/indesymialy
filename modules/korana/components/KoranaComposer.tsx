"use client";

import {
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ChevronDown,
  Globe2,
  ImagePlus,
  LoaderCircle,
  MessageCircle,
  PenLine,
  Shield,
  Trash2,
  Users,
} from "lucide-react";

import type {
  KoranaCurrentActor,
} from "../feed.types";

import type {
  KoranaPostVisibility,
  KoranaReplyControl,
} from "../types";

import {
  useKoranaPostActions,
} from "../hooks/useKoranaPostActions";

import {
  useKoranaMediaActions,
} from "../hooks/useKoranaMediaActions";


const MAX_LENGTH =
  10000;


interface SelectedMedia {
  id: string;
  file: File;
  previewUrl: string;
  type:
    | "image"
    | "video";
}


export function KoranaComposer({
  actor,
  onPublished,
}: {
  actor: KoranaCurrentActor;

  onPublished:
    () => Promise<unknown>;
}) {

  const postActions =
    useKoranaPostActions();

  const mediaActions =
    useKoranaMediaActions();


  const fileInputRef =
    useRef<HTMLInputElement>(
      null,
    );


  const [
    content,
    setContent,
  ] =
    useState("");


  const [
    visibility,
    setVisibility,
  ] =
    useState<KoranaPostVisibility>(
      "public",
    );


  const [
    replyControl,
    setReplyControl,
  ] =
    useState<KoranaReplyControl>(
      "everyone",
    );


  const [
    media,
    setMedia,
  ] =
    useState<SelectedMedia[]>(
      [],
    );


  const [
    localError,
    setLocalError,
  ] =
    useState<string | null>(
      null,
    );


  const [
    success,
    setSuccess,
  ] =
    useState<string | null>(
      null,
    );


  const trimmed =
    content.trim();


  const busy =
    postActions.pending ||
    mediaActions.pending;


  const hashtags =
    useMemo(
      () => {

        const matches =
          trimmed.match(
            /#[\p{L}\p{N}_]{1,50}/gu,
          ) ?? [];


        return Array.from(
          new Set(
            matches.map(
              (value) =>
                value
                  .slice(1)
                  .toLowerCase(),
            ),
          ),
        ).slice(
          0,
          20,
        );

      },
      [
        trimmed,
      ],
    );


  const canPublish =
    trimmed.length > 0 &&
    content.length <=
      MAX_LENGTH &&
    actor.status ===
      "active" &&
    !busy;


  function clearMessages() {

    setLocalError(
      null,
    );

    setSuccess(
      null,
    );

    postActions.clearError();

    mediaActions.clearError();
  }


  function removeMedia(
    id: string,
  ) {

    setMedia(
      (current) => {

        const target =
          current.find(
            (item) =>
              item.id === id,
          );


        if (target) {

          URL.revokeObjectURL(
            target.previewUrl,
          );
        }


        return current.filter(
          (item) =>
            item.id !== id,
        );
      },
    );
  }


  function chooseFiles(
    files:
      File[],
  ) {

    clearMessages();


    if (
      files.length === 0
    ) {
      return;
    }


    const combinedFiles =
      [
        ...media.map(
          (item) =>
            item.file,
        ),
        ...files,
      ];


    const videos =
      combinedFiles.filter(
        (file) =>
          file.type ===
            "video/mp4" ||
          file.type ===
            "video/webm",
      );


    const images =
      combinedFiles.filter(
        (file) =>
          [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
          ].includes(
            file.type,
          ),
      );


    if (
      videos.length > 0 &&
      images.length > 0
    ) {

      setLocalError(
        "Choisis soit des images, soit une vidéo.",
      );

      return;
    }


    if (
      videos.length > 1
    ) {

      setLocalError(
        "Une seule vidéo est autorisée.",
      );

      return;
    }


    if (
      images.length > 4
    ) {

      setLocalError(
        "Quatre images maximum sont autorisées.",
      );

      return;
    }


    for (
      const file
      of files
    ) {

      const isImage =
        [
          "image/jpeg",
          "image/png",
          "image/webp",
          "image/gif",
        ].includes(
          file.type,
        );


      const isVideo =
        [
          "video/mp4",
          "video/webm",
        ].includes(
          file.type,
        );


      if (
        !isImage &&
        !isVideo
      ) {

        setLocalError(
          "Format accepté : JPEG, PNG, WebP, GIF, MP4 ou WebM.",
        );

        return;
      }


      if (
        isImage &&
        file.size >
          10 * 1024 * 1024
      ) {

        setLocalError(
          "Chaque image doit faire 10 Mo maximum.",
        );

        return;
      }


      if (
        isVideo &&
        file.size >
          100 * 1024 * 1024
      ) {

        setLocalError(
          "La vidéo doit faire 100 Mo maximum.",
        );

        return;
      }
    }


    const next =
      files.map(
        (file) => ({
          id:
            crypto.randomUUID(),

          file,

          previewUrl:
            URL.createObjectURL(
              file,
            ),

          type:
            file.type.startsWith(
              "video/",
            )
              ? "video" as const
              : "image" as const,
        }),
      );


    setMedia(
      (current) => [
        ...current,
        ...next,
      ],
    );
  }


  async function publish() {

    if (!canPublish) {
      return;
    }


    clearMessages();


    try {

      const post =
        await postActions.create(
          {
            actorId:
              actor.id,

            content:
              trimmed,

            visibility,

            replyControl,

            hashtags,
          },
        );


      let mediaFailure =
        false;


      if (
        media.length > 0
      ) {

        try {

          await mediaActions.uploadMany(
            media.map(
              (
                item,
                position,
              ) => ({
                actorId:
                  actor.id,

                postId:
                  post.id,

                file:
                  item.file,

                position,
              }),
            ),
          );

        } catch {

          mediaFailure =
            true;
        }
      }


      for (
        const item
        of media
      ) {

        URL.revokeObjectURL(
          item.previewUrl,
        );
      }


      setMedia(
        [],
      );

      setContent(
        "",
      );

      setVisibility(
        "public",
      );

      setReplyControl(
        "everyone",
      );


      setSuccess(
        mediaFailure
          ? "Publication créée, mais au moins un média n'a pas pu être ajouté."
          : "Publication envoyée sur Korana.",
      );


      await onPublished();

    } catch {

      // Errors are already exposed by hooks.
    }
  }


  return (
    <section className="korana-composer border-b border-white/[0.065] px-4 py-4 sm:px-6">

      <div className="korana-composer-layout flex gap-3">

        <div className="korana-composer-avatar grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full border border-white/[0.08] bg-[#15171b] text-sm font-black text-zinc-400">

          {actor.avatarUrl ? (
            <img
              src={actor.avatarUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            actor.displayName
              .slice(0, 1)
              .toUpperCase()
          )}

        </div>


        <div className="min-w-0 flex-1">

          <div className="mb-2 flex items-center gap-2">

            <strong className="text-xs text-zinc-300">
              {actor.displayName}
            </strong>

            <span className="text-[10px] text-zinc-600">
              @{actor.handle}
            </span>

          </div>


          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.018]">

            <div className="flex gap-3 px-4 pt-4">

              <PenLine
                size={17}
                className="mt-1 shrink-0 text-zinc-600"
              />

              <textarea
                value={content}
                onChange={(event) => {
                  setContent(
                    event.target.value,
                  );

                  clearMessages();
                }}
                maxLength={
                  MAX_LENGTH
                }
                rows={4}
                placeholder="Quoi de neuf dans le monde des sports de combat ?"
                className="min-h-[94px] w-full resize-none bg-transparent text-sm leading-6 text-zinc-200 outline-none placeholder:text-zinc-700"
              />

            </div>


            {hashtags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 px-4 pb-3 pl-11">

                {hashtags.map(
                  (tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-blue-500/[0.08] px-2 py-1 text-[10px] font-bold text-[#4da3ff]"
                    >
                      #{tag}
                    </span>
                  ),
                )}

              </div>
            ) : null}

          </div>


          {media.length > 0 ? (
            <div className="korana-composer-media-grid mt-3 grid grid-cols-2 gap-2">

              {media.map(
                (item) => (
                  <div
                    key={item.id}
                    className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-black"
                  >

                    {item.type ===
                    "video" ? (
                      <video
                        src={item.previewUrl}
                        className="h-44 w-full object-contain"
                        controls
                        muted
                      />
                    ) : (
                      <img
                        src={item.previewUrl}
                        alt=""
                        className="h-44 w-full object-cover"
                      />
                    )}


                    <button
                      type="button"
                      onClick={() =>
                        removeMedia(
                          item.id,
                        )
                      }
                      className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/75 text-white backdrop-blur"
                      aria-label="Retirer le média"
                    >
                      <Trash2 size={14} />
                    </button>

                  </div>
                ),
              )}

            </div>
          ) : null}


          <div className="mt-3 flex flex-wrap items-center gap-2">

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
              className="hidden"
              onChange={(event) => {

                chooseFiles(
                  Array.from(
                    event.target.files ??
                    [],
                  ),
                );

                event.currentTarget.value =
                  "";
              }}
            />


            <button
              type="button"
              disabled={busy}
              onClick={() =>
                fileInputRef.current?.click()
              }
              className="inline-flex h-8 items-center gap-2 rounded-lg border border-white/[0.07] px-3 text-[10px] font-semibold text-zinc-400 transition hover:border-white/[0.14] hover:text-zinc-200 disabled:opacity-40"
            >
              <ImagePlus size={14} />

              Photo / vidéo
            </button>


            <label className="relative">

              <Globe2
                size={13}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600"
              />

              <select
                value={visibility}
                onChange={(event) =>
                  setVisibility(
                    event.target.value as
                      KoranaPostVisibility,
                  )
                }
                className="h-8 appearance-none rounded-lg border border-white/[0.07] bg-[#0e1013] pl-8 pr-7 text-[10px] font-semibold text-zinc-400"
              >
                <option value="public">
                  Public
                </option>

                <option value="followers">
                  Abonnés
                </option>
              </select>

              <ChevronDown
                size={12}
                className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-zinc-700"
              />

            </label>


            <label className="relative">

              <MessageCircle
                size={13}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600"
              />

              <select
                value={replyControl}
                onChange={(event) =>
                  setReplyControl(
                    event.target.value as
                      KoranaReplyControl,
                  )
                }
                className="h-8 appearance-none rounded-lg border border-white/[0.07] bg-[#0e1013] pl-8 pr-7 text-[10px] font-semibold text-zinc-400"
              >
                <option value="everyone">
                  Tout le monde
                </option>

                <option value="followers">
                  Abonnés
                </option>

                <option value="mentioned">
                  Mentionnés
                </option>
              </select>

              <ChevronDown
                size={12}
                className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-zinc-700"
              />

            </label>

          </div>


          <div className="mt-3 flex min-h-9 items-center justify-between gap-4">

            <div className="min-w-0">

              {localError ||
              postActions.error ||
              mediaActions.error ? (
                <p className="text-[11px] text-red-400">
                  {localError ??
                    postActions.error ??
                    mediaActions.error}
                </p>
              ) : success ? (
                <p className="text-[11px] text-emerald-400">
                  {success}
                </p>
              ) : (
                <p className="flex items-center gap-1.5 text-[10px] text-zinc-700">
                  <Shield size={12} />

                  4 images max ou 1 vidéo.
                </p>
              )}

            </div>


            <div className="flex items-center gap-3">

              <span className="font-mono text-[10px] text-zinc-700">
                {content.length.toLocaleString(
                  "fr-FR",
                )}
                /
                10 000
              </span>


              <button
                type="button"
                disabled={
                  !canPublish
                }
                onClick={() =>
                  void publish()
                }
                className="inline-flex h-9 items-center gap-2 rounded-full bg-[#ff1638] px-5 text-xs font-black text-white disabled:cursor-not-allowed disabled:bg-white/[0.04] disabled:text-zinc-700"
              >
                {busy ? (
                  <>
                    <LoaderCircle
                      size={14}
                      className="animate-spin"
                    />

                    Envoi…
                  </>
                ) : (
                  "Publier"
                )}
              </button>

            </div>

          </div>

        </div>

      </div>

    </section>
  );
}
