"use client";

import {
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Check,
  ChevronDown,
  Globe2,
  ImagePlus,
  LoaderCircle,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import type {
  KoranaFeedItem,
  KoranaFeedMedia,
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

import {
  useKoranaMediaUrls,
} from "../hooks/useKoranaMediaUrls";

import {
  useKoranaFollowActions,
} from "../hooks/useKoranaFollowActions";

import {
  KoranaMediaGallery,
} from "./KoranaMediaGallery";

import {
  KoranaReactionControl,
} from "./KoranaReactionControl";

import {
  KoranaCommentsPanel,
} from "./KoranaCommentsPanel";

import {
  KoranaRepostControl,
} from "./KoranaRepostControl";

import {
  KoranaSavedPostControl,
} from "./KoranaSavedPostControl";


interface LocalMediaDraft {
  id: string;

  file: File;

  previewUrl: string;

  mediaType:
    | "image"
    | "video";
}


function dateLabel(
  value: string | null,
) {

  if (!value) {
    return "";
  }


  const date =
    new Date(value);


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
  ).format(date);
}


function isSupportedImage(
  file: File,
) {

  return [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
  ].includes(
    file.type,
  );
}


function isSupportedVideo(
  file: File,
) {

  return [
    "video/mp4",
    "video/webm",
  ].includes(
    file.type,
  );
}


interface KoranaPostCardProps {

  item:
    KoranaFeedItem;

  canManage:
    boolean;

  currentActorId:
    string | null;

  onChanged:
    () => Promise<unknown>;
}


export function KoranaPostCard({
  item,
  canManage,
  currentActorId,
  onChanged,
}: KoranaPostCardProps) {

  const postActions =
    useKoranaPostActions();


  const mediaActions =
    useKoranaMediaActions();


  const followActions =
    useKoranaFollowActions();


  const signedMedia =
    useKoranaMediaUrls(
      item.media,
    );


  const fileInputRef =
    useRef<HTMLInputElement>(
      null,
    );


  const [
    menuOpen,
    setMenuOpen,
  ] =
    useState(false);


  const [
    editing,
    setEditing,
  ] =
    useState(false);


  const [
    confirmingDelete,
    setConfirmingDelete,
  ] =
    useState(false);


  const [
    editContent,
    setEditContent,
  ] =
    useState(
      item.content,
    );


  const [
    editVisibility,
    setEditVisibility,
  ] =
    useState<KoranaPostVisibility>(
      item.visibility,
    );


  const [
    editReplyControl,
    setEditReplyControl,
  ] =
    useState<KoranaReplyControl>(
      item.replyControl,
    );


  const [
    removedMediaIds,
    setRemovedMediaIds,
  ] =
    useState<string[]>(
      [],
    );


  const [
    newMedia,
    setNewMedia,
  ] =
    useState<LocalMediaDraft[]>(
      [],
    );


  const [
    localError,
    setLocalError,
  ] =
    useState<string | null>(
      null,
    );


  const busy =
    postActions.pending ||
    mediaActions.pending;


  const keptMedia =
    useMemo(
      () =>
        item.media.filter(
          (media) =>
            !removedMediaIds.includes(
              media.id,
            ),
        ),
      [
        item.media,
        removedMediaIds,
      ],
    );


  const canFollowAuthor =
    currentActorId !== null &&
    !canManage &&
    currentActorId !==
      item.author.id;


  async function toggleFollowAuthor() {

    if (
      !currentActorId ||
      followActions.isPending(
        item.author.id,
      )
    ) {

      return;
    }


    followActions.clearError();


    try {

      if (
        item.viewer.isFollowingAuthor
      ) {

        await followActions.unfollow(
          {
            followerActorId:
              currentActorId,

            followedActorId:
              item.author.id,
          },
        );

      } else {

        await followActions.follow(
          {
            followerActorId:
              currentActorId,

            followedActorId:
              item.author.id,
          },
        );
      }


      await onChanged();

    } catch {

      // Hook exposes error.
    }
  }


  function revokeNewMedia() {

    for (
      const media
      of newMedia
    ) {

      URL.revokeObjectURL(
        media.previewUrl,
      );
    }
  }


  function resetMediaEditor() {

    revokeNewMedia();

    setRemovedMediaIds(
      [],
    );

    setNewMedia(
      [],
    );
  }


  function beginEdit() {

    setEditContent(
      item.content,
    );

    setEditVisibility(
      item.visibility,
    );

    setEditReplyControl(
      item.replyControl,
    );

    resetMediaEditor();

    setLocalError(
      null,
    );

    postActions.clearError();

    mediaActions.clearError();

    setConfirmingDelete(
      false,
    );

    setMenuOpen(
      false,
    );

    setEditing(
      true,
    );
  }


  function cancelEdit() {

    if (busy) {
      return;
    }


    resetMediaEditor();

    setEditContent(
      item.content,
    );

    setEditVisibility(
      item.visibility,
    );

    setEditReplyControl(
      item.replyControl,
    );

    setLocalError(
      null,
    );

    postActions.clearError();

    mediaActions.clearError();

    setEditing(
      false,
    );
  }


  function toggleExistingMedia(
    mediaId: string,
  ) {

    setLocalError(
      null,
    );


    setRemovedMediaIds(
      (current) => {

        if (
          current.includes(
            mediaId,
          )
        ) {

          return current.filter(
            (id) =>
              id !==
              mediaId,
          );
        }


        return [
          ...current,
          mediaId,
        ];
      },
    );
  }


  function removeNewMedia(
    mediaId: string,
  ) {

    setNewMedia(
      (current) => {

        const target =
          current.find(
            (media) =>
              media.id ===
              mediaId,
          );


        if (target) {

          URL.revokeObjectURL(
            target.previewUrl,
          );
        }


        return current.filter(
          (media) =>
            media.id !==
            mediaId,
        );
      },
    );
  }


  function selectNewFiles(
    files: File[],
  ) {

    setLocalError(
      null,
    );

    mediaActions.clearError();


    if (
      files.length === 0
    ) {

      return;
    }


    for (
      const file
      of files
    ) {

      if (
        !isSupportedImage(
          file,
        ) &&
        !isSupportedVideo(
          file,
        )
      ) {

        setLocalError(
          "Formats acceptés : JPEG, PNG, WebP, GIF, MP4 ou WebM.",
        );

        return;
      }


      if (
        isSupportedImage(
          file,
        ) &&
        file.size >
          10 * 1024 * 1024
      ) {

        setLocalError(
          "Chaque image doit faire 10 Mo maximum.",
        );

        return;
      }


      if (
        isSupportedVideo(
          file,
        ) &&
        file.size >
          100 * 1024 * 1024
      ) {

        setLocalError(
          "La vidéo doit faire 100 Mo maximum.",
        );

        return;
      }
    }


    const existingTypes =
      keptMedia.map(
        (media) =>
          media.mediaType,
      );


    const newTypes =
      [
        ...newMedia.map(
          (media) =>
            media.mediaType,
        ),

        ...files.map(
          (file) =>
            isSupportedVideo(
              file,
            )
              ? "video" as const
              : "image" as const,
        ),
      ];


    const allTypes =
      [
        ...existingTypes,
        ...newTypes,
      ];


    const imageCount =
      allTypes.filter(
        (type) =>
          type ===
          "image",
      ).length;


    const videoCount =
      allTypes.filter(
        (type) =>
          type ===
          "video",
      ).length;


    if (
      imageCount > 0 &&
      videoCount > 0
    ) {

      setLocalError(
        "Retire d'abord la vidéo avant d'ajouter des images, ou retire les images avant d'ajouter une vidéo.",
      );

      return;
    }


    if (
      imageCount > 4
    ) {

      setLocalError(
        "Quatre images maximum sont autorisées.",
      );

      return;
    }


    if (
      videoCount > 1
    ) {

      setLocalError(
        "Une seule vidéo est autorisée.",
      );

      return;
    }


    const drafts =
      files.map(
        (file) => ({
          id:
            crypto.randomUUID(),

          file,

          previewUrl:
            URL.createObjectURL(
              file,
            ),

          mediaType:
            isSupportedVideo(
              file,
            )
              ? "video" as const
              : "image" as const,
        }),
      );


    setNewMedia(
      (current) => [
        ...current,
        ...drafts,
      ],
    );
  }


  function availablePositions(
    existing:
      KoranaFeedMedia[],
  ) {

    const used =
      new Set(
        existing.map(
          (media) =>
            media.position,
        ),
      );


    return [
      0,
      1,
      2,
      3,
    ].filter(
      (position) =>
        !used.has(
          position,
        ),
    );
  }


  async function saveEdit() {

    const content =
      editContent.trim();


    if (!content) {

      setLocalError(
        "La publication ne peut pas être vide.",
      );

      return;
    }


    setLocalError(
      null,
    );

    postActions.clearError();

    mediaActions.clearError();


    try {

      await postActions.update(
        {
          postId:
            item.id,

          content,

          visibility:
            editVisibility,

          replyControl:
            editReplyControl,

          hashtags:
            [],
        },
      );


      for (
        const mediaId
        of removedMediaIds
      ) {

        await mediaActions.remove(
          mediaId,
        );
      }


      if (
        newMedia.length >
        0
      ) {

        const keptAfterRemoval =
          item.media.filter(
            (media) =>
              !removedMediaIds.includes(
                media.id,
              ),
          );


        const positions =
          newMedia[0]?.mediaType ===
          "video"
            ? [0]
            : availablePositions(
                keptAfterRemoval,
              );


        await mediaActions.uploadMany(
          newMedia.map(
            (
              media,
              index,
            ) => ({
              actorId:
                item.author.id,

              postId:
                item.id,

              file:
                media.file,

              position:
                positions[
                  index
                ] ?? index,
            }),
          ),
        );
      }


      resetMediaEditor();

      setEditing(
        false,
      );


      await onChanged();

    } catch (
      reason
    ) {

      setLocalError(
        reason instanceof Error
          ? reason.message
          : "La modification a échoué.",
      );


      await onChanged();
    }
  }


  async function deletePost() {

    try {

      await postActions.remove(
        item.id,
      );


      setConfirmingDelete(
        false,
      );


      await onChanged();

    } catch {

      // Hook exposes error.
    }
  }


  const followPending =
    followActions.isPending(
      item.author.id,
    );


  return (
    <article className="korana-post-card relative border-b border-white/[0.065] px-4 py-5 sm:px-6">

      <div className="korana-post-layout flex gap-3">

        <div className="korana-post-avatar grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full border border-white/[0.08] bg-[#15171b] text-sm font-black text-zinc-400">

          {item.author.avatarUrl ? (
            <img
              src={
                item.author.avatarUrl
              }
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            item.author.displayName
              .slice(0, 1)
              .toUpperCase()
          )}

        </div>


        <div className="min-w-0 flex-1">

          <header className="flex min-w-0 items-start justify-between gap-3">

            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">

              <strong className="truncate text-sm text-zinc-100">
                {item.author.displayName}
              </strong>


              {item.author.verified ? (
                <ShieldCheck
                  size={15}
                  className="shrink-0 text-[#3d92ff]"
                />
              ) : null}


              <span className="truncate text-xs text-zinc-600">
                @{item.author.handle}
              </span>


              <span className="text-xs text-zinc-700">
                ·
              </span>


              <time className="text-xs text-zinc-600">
                {dateLabel(
                  item.publishedAt,
                )}
              </time>


              {item.editedAt ? (
                <span className="text-[10px] text-zinc-700">
                  · modifié
                </span>
              ) : null}

            </div>


            <div className="flex shrink-0 items-center gap-1">

              {canFollowAuthor &&
              !editing ? (

                <button
                  type="button"
                  disabled={
                    followPending
                  }
                  onClick={() =>
                    void toggleFollowAuthor()
                  }
                  className={
                    item.viewer.isFollowingAuthor
                      ? "inline-flex h-8 items-center gap-1.5 rounded-full border border-white/[0.09] px-3 text-[10px] font-bold text-zinc-300 transition hover:border-red-500/25 hover:bg-red-500/[0.05] hover:text-red-300 disabled:opacity-40"
                      : "inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-[10px] font-black text-black transition hover:bg-zinc-200 disabled:opacity-40"
                  }
                >

                  {followPending ? (

                    <LoaderCircle
                      size={12}
                      className="animate-spin"
                    />

                  ) : item.viewer.isFollowingAuthor ? (

                    <UserCheck
                      size={12}
                    />

                  ) : (

                    <UserPlus
                      size={12}
                    />

                  )}


                  {item.viewer.isFollowingAuthor
                    ? "Suivi"
                    : "Suivre"}

                </button>

              ) : null}


              {canManage &&
              !editing ? (

                <div className="relative">

                  <button
                    type="button"
                    onClick={() =>
                      setMenuOpen(
                        (current) =>
                          !current,
                      )
                    }
                    className="grid h-8 w-8 place-items-center rounded-full text-zinc-600 transition hover:bg-white/[0.05] hover:text-zinc-300"
                  >
                    <MoreHorizontal
                      size={18}
                    />
                  </button>


                  {menuOpen ? (

                    <div
                      className="absolute right-0 top-10 z-[200] w-48 overflow-hidden rounded-xl border border-white/[0.09] bg-[#111318] p-1 shadow-2xl"
                    >

                      <button
                        type="button"
                        onClick={
                          beginEdit
                        }
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-white/[0.05]"
                      >
                        <Pencil size={14} />
                        Modifier
                      </button>


                      <button
                        type="button"
                        onClick={() => {

                          setMenuOpen(
                            false,
                          );

                          setConfirmingDelete(
                            true,
                          );
                        }}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold text-red-400 hover:bg-red-500/[0.08]"
                      >
                        <Trash2 size={14} />
                        Supprimer
                      </button>

                    </div>

                  ) : null}

                </div>

              ) : null}

            </div>

          </header>


          {followActions.error ? (
            <p className="mt-2 text-[10px] text-red-400">
              {followActions.error}
            </p>
          ) : null}


          {editing ? (

            <div className="mt-3">

              <textarea
                value={editContent}
                onChange={(event) =>
                  setEditContent(
                    event.target.value,
                  )
                }
                rows={5}
                maxLength={10000}
                disabled={busy}
                className="min-h-[120px] w-full resize-y rounded-2xl border border-white/[0.09] bg-white/[0.02] px-4 py-3 text-sm leading-6 text-zinc-200 outline-none focus:border-white/[0.18]"
              />


              {item.media.length >
              0 ? (

                <div className="mt-4">

                  <strong className="mb-2 block text-[11px] font-bold text-zinc-400">
                    Médias actuels
                  </strong>


                  <div className="korana-editor-media-grid grid grid-cols-2 gap-2">

                    {item.media.map(
                      (media) => {

                        const removed =
                          removedMediaIds.includes(
                            media.id,
                          );


                        const url =
                          signedMedia.urls[
                            media.storagePath
                          ];


                        return (
                          <div
                            key={media.id}
                            className={
                              removed
                                ? "relative overflow-hidden rounded-xl border border-red-500/30 bg-black opacity-45"
                                : "relative overflow-hidden rounded-xl border border-white/[0.08] bg-black"
                            }
                          >

                            {url ? (

                              media.mediaType ===
                              "video" ? (

                                <video
                                  src={url}
                                  muted
                                  controls
                                  className="h-44 w-full object-contain"
                                />

                              ) : (

                                <img
                                  src={url}
                                  alt={
                                    media.altText ??
                                    ""
                                  }
                                  className="h-44 w-full object-cover"
                                />

                              )

                            ) : (

                              <div className="grid h-44 place-items-center text-xs text-zinc-600">
                                Chargement…
                              </div>

                            )}


                            <button
                              type="button"
                              onClick={() =>
                                toggleExistingMedia(
                                  media.id,
                                )
                              }
                              className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/80 text-white"
                            >
                              {removed ? (
                                <RotateCcw size={14} />
                              ) : (
                                <Trash2 size={14} />
                              )}
                            </button>

                          </div>
                        );
                      },
                    )}

                  </div>

                </div>

              ) : null}


              {newMedia.length >
              0 ? (

                <div className="mt-4">

                  <strong className="mb-2 block text-[11px] font-bold text-zinc-400">
                    Nouveaux médias
                  </strong>


                  <div className="korana-editor-media-grid grid grid-cols-2 gap-2">

                    {newMedia.map(
                      (media) => (
                        <div
                          key={media.id}
                          className="relative overflow-hidden rounded-xl border border-emerald-500/20 bg-black"
                        >

                          {media.mediaType ===
                          "video" ? (

                            <video
                              src={media.previewUrl}
                              controls
                              muted
                              className="h-44 w-full object-contain"
                            />

                          ) : (

                            <img
                              src={media.previewUrl}
                              alt=""
                              className="h-44 w-full object-cover"
                            />

                          )}


                          <button
                            type="button"
                            onClick={() =>
                              removeNewMedia(
                                media.id,
                              )
                            }
                            className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/80 text-white"
                          >
                            <X size={14} />
                          </button>

                        </div>
                      ),
                    )}

                  </div>

                </div>

              ) : null}


              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
                className="hidden"
                onChange={(event) => {

                  selectNewFiles(
                    Array.from(
                      event.currentTarget.files ??
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
                className="mt-3 inline-flex h-9 items-center gap-2 rounded-xl border border-white/[0.08] px-3 text-[11px] font-bold text-zinc-400"
              >
                <ImagePlus size={15} />
                Ajouter ou remplacer des médias
              </button>


              <div className="mt-4 flex flex-wrap items-center gap-2">

                <label className="relative">

                  {editVisibility ===
                  "followers" ? (
                    <Users
                      size={13}
                      className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600"
                    />
                  ) : (
                    <Globe2
                      size={13}
                      className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600"
                    />
                  )}


                  <select
                    value={editVisibility}
                    onChange={(event) =>
                      setEditVisibility(
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
                    value={editReplyControl}
                    onChange={(event) =>
                      setEditReplyControl(
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


              {(localError ||
                postActions.error ||
                mediaActions.error) ? (

                <p className="mt-3 text-[11px] text-red-400">
                  {localError ??
                    postActions.error ??
                    mediaActions.error}
                </p>

              ) : null}


              <div className="mt-4 flex justify-end gap-2">

                <button
                  type="button"
                  disabled={busy}
                  onClick={
                    cancelEdit
                  }
                  className="inline-flex h-9 items-center gap-2 rounded-full border border-white/[0.08] px-4 text-xs font-bold text-zinc-400"
                >
                  <X size={14} />
                  Annuler
                </button>


                <button
                  type="button"
                  disabled={
                    busy ||
                    !editContent.trim()
                  }
                  onClick={() =>
                    void saveEdit()
                  }
                  className="inline-flex h-9 items-center gap-2 rounded-full bg-[#ff1638] px-4 text-xs font-black text-white disabled:bg-white/[0.04] disabled:text-zinc-700"
                >

                  {busy ? (
                    <LoaderCircle
                      size={14}
                      className="animate-spin"
                    />
                  ) : (
                    <Check size={14} />
                  )}

                  Enregistrer

                </button>

              </div>

            </div>

          ) : (

            <>
              {item.content ? (
                <p className="mt-3 whitespace-pre-wrap break-words text-[14px] leading-6 text-zinc-200">
                  {item.content}
                </p>
              ) : null}


              {item.hashtags.length >
              0 ? (

                <div className="mt-3 flex flex-wrap gap-2">

                  {item.hashtags.map(
                    (tag) => (
                      <span
                        key={tag}
                        className="text-xs font-semibold text-[#3d92ff]"
                      >
                        #{tag}
                      </span>
                    ),
                  )}

                </div>

              ) : null}


              <KoranaMediaGallery
                media={item.media}
              />


              {confirmingDelete ? (

                <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/[0.045] p-4">

                  <strong className="text-xs text-red-300">
                    Supprimer cette publication ?
                  </strong>


                  <div className="mt-3 flex justify-end gap-2">

                    <button
                      type="button"
                      onClick={() =>
                        setConfirmingDelete(
                          false,
                        )
                      }
                      className="h-8 rounded-full border border-white/[0.08] px-4 text-[11px] font-bold text-zinc-400"
                    >
                      Annuler
                    </button>


                    <button
                      type="button"
                      onClick={() =>
                        void deletePost()
                      }
                      className="inline-flex h-8 items-center gap-2 rounded-full bg-red-500 px-4 text-[11px] font-black text-white"
                    >
                      <Trash2 size={13} />
                      Supprimer
                    </button>

                  </div>

                </div>

              ) : null}


              {/* =============================================
                  SOCIAL ACTIONS
              ============================================= */}

              <footer className="korana-post-actions mt-4 grid grid-cols-4 items-center">

                <KoranaCommentsPanel
                  postId={
                    item.id
                  }
                  currentActorId={
                    currentActorId
                  }
                  commentsCount={
                    item.counts.comments
                  }
                  onChanged={
                    onChanged
                  }
                />


                <KoranaRepostControl
                  postId={
                    item.id
                  }
                  currentActorId={
                    currentActorId
                  }
                  reposted={
                    item.viewer.reposted
                  }
                  repostsCount={
                    item.counts.reposts
                  }
                  onChanged={
                    onChanged
                  }
                />


                <KoranaReactionControl
                  postId={
                    item.id
                  }
                  currentActorId={
                    currentActorId
                  }
                  reactionType={
                    item.viewer.reactionType
                  }
                  reactionsCount={
                    item.counts.reactions
                  }
                  onChanged={
                    onChanged
                  }
                />


                <KoranaSavedPostControl
                  postId={
                    item.id
                  }
                  currentActorId={
                    currentActorId
                  }
                  saved={
                    item.viewer.saved
                  }
                  onChanged={
                    onChanged
                  }
                />

              </footer>

            </>

          )}

        </div>

      </div>

    </article>
  );
}
