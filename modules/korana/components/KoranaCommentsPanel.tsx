"use client";

import {
  useMemo,
  useState,
} from "react";

import type {
  ReactNode,
} from "react";

import {
  Check,
  LoaderCircle,
  MessageCircle,
  Pencil,
  Reply,
  Send,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";

import type {
  KoranaCommentItem,
  KoranaCommentPermissionReason,
} from "../comment.types";

import {
  useKoranaComments,
} from "../hooks/useKoranaComments";


interface CommentTreeNode
  extends KoranaCommentItem {

  children:
    CommentTreeNode[];
}


function buildTree(
  comments:
    KoranaCommentItem[],
) {

  const nodes =
    new Map<
      string,
      CommentTreeNode
    >();


  for (
    const comment
    of comments
  ) {

    nodes.set(
      comment.id,
      {
        ...comment,

        children:
          [],
      },
    );
  }


  const roots:
    CommentTreeNode[] = [];


  for (
    const comment
    of nodes.values()
  ) {

    if (
      comment.parentCommentId
    ) {

      const parent =
        nodes.get(
          comment.parentCommentId,
        );


      if (parent) {

        parent.children.push(
          comment,
        );

        continue;
      }
    }


    roots.push(
      comment,
    );
  }


  return roots;
}


function dateLabel(
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


function permissionMessage(
  reason:
    KoranaCommentPermissionReason | null,
) {

  switch (
    reason
  ) {

    case "authentication_required":
      return "Connecte-toi pour commenter.";

    case "actor_required":
      return "Sélectionne une identité Korana pour commenter.";

    case "followers_only":
      return "Cette discussion est réservée aux abonnés de l’auteur.";

    case "mentioned_only":
      return "Cette discussion est réservée aux identités mentionnées dans la publication.";

    case "post_closed":
      return "Cette publication n’accepte plus de réponses.";

    case "actor_forbidden":
    case "post_forbidden":
      return "Tu ne peux pas commenter cette publication avec l’identité sélectionnée.";

    default:
      return null;
  }
}


export function KoranaCommentsPanel({
  postId,
  currentActorId,
  commentsCount,
  onChanged,
}: {
  postId: string;

  currentActorId:
    string | null;

  commentsCount: number;

  onChanged:
    () => Promise<unknown>;
}) {

  const comments =
    useKoranaComments(
      postId,
      currentActorId,
    );


  const [
    open,
    setOpen,
  ] =
    useState(false);


  const [
    content,
    setContent,
  ] =
    useState("");


  const [
    replyingToId,
    setReplyingToId,
  ] =
    useState<string | null>(
      null,
    );


  const [
    replyContent,
    setReplyContent,
  ] =
    useState("");


  const [
    editingId,
    setEditingId,
  ] =
    useState<string | null>(
      null,
    );


  const [
    editContent,
    setEditContent,
  ] =
    useState("");


  const tree =
    useMemo(
      () =>
        buildTree(
          comments.snapshot?.comments ??
          [],
        ),
      [
        comments.snapshot,
      ],
    );


  function toggle() {

    const next =
      !open;


    setOpen(
      next,
    );


    if (
      next &&
      !comments.loaded &&
      !comments.loading
    ) {

      void comments
        .load()
        .catch(
          () => undefined,
        );
    }
  }


  async function publishComment() {

    if (
      !currentActorId ||
      !content.trim() ||
      comments.pending
    ) {

      return;
    }


    try {

      await comments.create(
        {
          actorId:
            currentActorId,

          postId,

          content,
        },
      );


      setContent(
        "",
      );


      await onChanged();

    } catch {

      // Hook exposes the error.
    }
  }


  async function publishReply(
    parentCommentId:
      string,
  ) {

    if (
      !currentActorId ||
      !replyContent.trim() ||
      comments.pending
    ) {

      return;
    }


    try {

      await comments.create(
        {
          actorId:
            currentActorId,

          postId,

          parentCommentId,

          content:
            replyContent,
        },
      );


      setReplyContent(
        "",
      );

      setReplyingToId(
        null,
      );


      await onChanged();

    } catch {

      // Hook exposes the error.
    }
  }


  async function saveEdit(
    commentId:
      string,
  ) {

    if (
      !editContent.trim() ||
      comments.pending
    ) {

      return;
    }


    try {

      await comments.update(
        {
          commentId,

          content:
            editContent,
        },
      );


      setEditingId(
        null,
      );

      setEditContent(
        "",
      );


      await onChanged();

    } catch {

      // Hook exposes the error.
    }
  }


  async function removeComment(
    commentId:
      string,
  ) {

    if (
      comments.pending
    ) {

      return;
    }


    const confirmed =
      window.confirm(
        "Supprimer ce commentaire ? Les réponses existantes seront conservées.",
      );


    if (!confirmed) {

      return;
    }


    try {

      await comments.remove(
        commentId,
      );


      await onChanged();

    } catch {

      // Hook exposes the error.
    }
  }


  function renderComment(
    comment:
      CommentTreeNode,
    depth:
      number,
  ): ReactNode {

    const published =
      comment.status ===
      "published";


    const author =
      comment.author;


    return (
      <div
        key={
          comment.id
        }
        className={
          depth === 0
            ? "py-3"
            : "korana-comment-reply ml-6 border-l border-white/[0.055] py-2 pl-3"
        }
      >

        {!published ? (

          <div className="text-[10px] italic text-zinc-700">

            {comment.status ===
            "deleted"
              ? "Commentaire supprimé"
              : "Commentaire indisponible"}

          </div>

        ) : (

          <div className="flex gap-2.5">

            <div className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full border border-white/[0.07] bg-[#15171b] text-[10px] font-black text-zinc-500">

              {author?.avatarUrl ? (

                <img
                  src={
                    author.avatarUrl
                  }
                  alt=""
                  className="h-full w-full object-cover"
                />

              ) : (

                author?.displayName
                  .slice(
                    0,
                    1,
                  )
                  .toUpperCase() ??
                "?"

              )}

            </div>


            <div className="min-w-0 flex-1">

              <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">

                <strong className="truncate text-[11px] text-zinc-300">
                  {author?.displayName ??
                    "Utilisateur"}
                </strong>


                {author?.verified ? (

                  <ShieldCheck
                    size={11}
                    className="shrink-0 text-[#4b9cff]"
                  />

                ) : null}


                <span className="truncate text-[9px] text-zinc-700">
                  @{author?.handle ??
                    "profil"}
                </span>


                <span className="text-[9px] text-zinc-800">
                  ·
                </span>


                <time className="text-[9px] text-zinc-700">
                  {dateLabel(
                    comment.createdAt,
                  )}
                </time>


                {comment.editedAt ? (

                  <span className="text-[8px] text-zinc-800">
                    · modifié
                  </span>

                ) : null}

              </div>


              {editingId ===
              comment.id ? (

                <div className="mt-2">

                  <textarea
                    value={
                      editContent
                    }
                    onChange={(event) =>
                      setEditContent(
                        event.target.value,
                      )
                    }
                    maxLength={
                      5000
                    }
                    rows={3}
                    disabled={
                      comments.pending
                    }
                    className="w-full resize-y border border-white/[0.08] bg-white/[0.018] px-3 py-2 text-[11px] leading-5 text-zinc-300 outline-none focus:border-white/[0.16]"
                  />


                  <div className="mt-2 flex justify-end gap-2">

                    <button
                      type="button"
                      disabled={
                        comments.pending
                      }
                      onClick={() => {

                        setEditingId(
                          null,
                        );

                        setEditContent(
                          "",
                        );
                      }}
                      className="inline-flex h-7 items-center gap-1 border border-white/[0.07] px-2 text-[9px] font-semibold text-zinc-500"
                    >
                      <X size={11} />
                      Annuler
                    </button>


                    <button
                      type="button"
                      disabled={
                        comments.pending ||
                        !editContent.trim()
                      }
                      onClick={() =>
                        void saveEdit(
                          comment.id,
                        )
                      }
                      className="inline-flex h-7 items-center gap-1 bg-[#ff1638] px-2.5 text-[9px] font-black text-white disabled:bg-white/[0.04] disabled:text-zinc-700"
                    >
                      {comments.pending ? (
                        <LoaderCircle
                          size={11}
                          className="animate-spin"
                        />
                      ) : (
                        <Check
                          size={11}
                        />
                      )}

                      Enregistrer
                    </button>

                  </div>

                </div>

              ) : (

                <>
                  <p className="mt-1 whitespace-pre-wrap break-words text-[11px] leading-5 text-zinc-400">
                    {comment.content}
                  </p>


                  <div className="mt-1.5 flex flex-wrap items-center gap-3">

                    {comments.snapshot?.canComment &&
                    currentActorId ? (

                      <button
                        type="button"
                        onClick={() => {

                          setReplyingToId(
                            comment.id,
                          );

                          setReplyContent(
                            "",
                          );

                          setEditingId(
                            null,
                          );
                        }}
                        className="inline-flex items-center gap-1 text-[9px] font-semibold text-zinc-700 transition hover:text-zinc-300"
                      >
                        <Reply
                          size={11}
                        />

                        Répondre
                      </button>

                    ) : null}


                    {comment.viewer.canManage ? (

                      <>
                        <button
                          type="button"
                          onClick={() => {

                            setEditingId(
                              comment.id,
                            );

                            setEditContent(
                              comment.content ??
                              "",
                            );

                            setReplyingToId(
                              null,
                            );
                          }}
                          className="inline-flex items-center gap-1 text-[9px] font-semibold text-zinc-700 transition hover:text-zinc-300"
                        >
                          <Pencil
                            size={10}
                          />

                          Modifier
                        </button>


                        <button
                          type="button"
                          disabled={
                            comments.pending
                          }
                          onClick={() =>
                            void removeComment(
                              comment.id,
                            )
                          }
                          className="inline-flex items-center gap-1 text-[9px] font-semibold text-zinc-700 transition hover:text-red-400"
                        >
                          <Trash2
                            size={10}
                          />

                          Supprimer
                        </button>
                      </>

                    ) : null}


                    {comment.counts.replies >
                    0 ? (

                      <span className="text-[8px] text-zinc-800">
                        {comment.counts.replies} réponse
                        {comment.counts.replies !==
                        1
                          ? "s"
                          : ""}
                      </span>

                    ) : null}

                  </div>


                  {replyingToId ===
                  comment.id ? (

                    <div className="mt-2">

                      <textarea
                        value={
                          replyContent
                        }
                        onChange={(event) =>
                          setReplyContent(
                            event.target.value,
                          )
                        }
                        maxLength={
                          5000
                        }
                        rows={2}
                        placeholder={`Répondre à ${author?.displayName ?? "ce commentaire"}…`}
                        disabled={
                          comments.pending
                        }
                        className="w-full resize-y border border-white/[0.08] bg-white/[0.015] px-3 py-2 text-[10px] leading-5 text-zinc-300 outline-none placeholder:text-zinc-800 focus:border-white/[0.16]"
                      />


                      <div className="mt-2 flex justify-end gap-2">

                        <button
                          type="button"
                          disabled={
                            comments.pending
                          }
                          onClick={() => {

                            setReplyingToId(
                              null,
                            );

                            setReplyContent(
                              "",
                            );
                          }}
                          className="h-7 border border-white/[0.07] px-2 text-[9px] font-semibold text-zinc-600"
                        >
                          Annuler
                        </button>


                        <button
                          type="button"
                          disabled={
                            comments.pending ||
                            !replyContent.trim()
                          }
                          onClick={() =>
                            void publishReply(
                              comment.id,
                            )
                          }
                          className="inline-flex h-7 items-center gap-1 bg-white px-2.5 text-[9px] font-black text-black disabled:bg-white/[0.05] disabled:text-zinc-700"
                        >
                          {comments.pending ? (
                            <LoaderCircle
                              size={11}
                              className="animate-spin"
                            />
                          ) : (
                            <Send
                              size={11}
                            />
                          )}

                          Répondre
                        </button>

                      </div>

                    </div>

                  ) : null}

                </>

              )}

            </div>

          </div>

        )}


        {comment.children.length >
        0 ? (

          <div className="mt-1">

            {comment.children.map(
              (child) =>
                renderComment(
                  child,
                  depth + 1,
                ),
            )}

          </div>

        ) : null}

      </div>
    );
  }


  const reason =
    permissionMessage(
      comments.snapshot?.canCommentReason ??
      null,
    );


  return (
    <>

      {/* =====================================================
          GRID ACTION
      ===================================================== */}

      <button
        type="button"
        onClick={
          toggle
        }
        aria-expanded={
          open
        }
        className={
          open
            ? "korana-social-action flex items-center gap-2 text-xs font-semibold text-zinc-200"
            : "korana-social-action flex items-center gap-2 text-xs text-zinc-500 transition hover:text-zinc-300"
        }
      >
        <MessageCircle
          size={16}
        />

        {commentsCount}
      </button>


      {/* =====================================================
          THREAD
      ===================================================== */}

      {open ? (

        <div className="korana-comments-thread col-span-4 mt-3 border-t border-white/[0.055] pt-3">

          {comments.loading &&
          !comments.loaded ? (

            <div className="flex h-14 items-center justify-center gap-2 text-[10px] text-zinc-700">

              <LoaderCircle
                size={12}
                className="animate-spin"
              />

              Chargement des commentaires…

            </div>

          ) : null}


          {comments.error ? (

            <div className="mb-3 border border-red-500/15 bg-red-500/[0.025] px-3 py-2">

              <p className="text-[10px] leading-4 text-red-400">
                {comments.error}
              </p>

            </div>

          ) : null}


          {comments.snapshot ? (

            <>

              {/* =============================================
                  NEW COMMENT
              ============================================= */}

              {comments.snapshot.canComment &&
              currentActorId ? (

                <div className="mb-3">

                  <textarea
                    value={
                      content
                    }
                    onChange={(event) =>
                      setContent(
                        event.target.value,
                      )
                    }
                    maxLength={
                      5000
                    }
                    rows={2}
                    disabled={
                      comments.pending
                    }
                    placeholder="Écrire un commentaire…"
                    className="w-full resize-y border border-white/[0.075] bg-white/[0.015] px-3 py-2.5 text-[11px] leading-5 text-zinc-300 outline-none placeholder:text-zinc-800 focus:border-white/[0.15]"
                  />


                  <div className="mt-2 flex items-center justify-between gap-3">

                    <span className="font-mono text-[8px] text-zinc-800">
                      {content.length}/5000
                    </span>


                    <button
                      type="button"
                      disabled={
                        comments.pending ||
                        !content.trim()
                      }
                      onClick={() =>
                        void publishComment()
                      }
                      className="inline-flex h-7 items-center gap-1.5 bg-[#ff1638] px-3 text-[9px] font-black text-white disabled:cursor-not-allowed disabled:bg-white/[0.04] disabled:text-zinc-700"
                    >
                      {comments.pending ? (

                        <LoaderCircle
                          size={11}
                          className="animate-spin"
                        />

                      ) : (

                        <Send
                          size={11}
                        />

                      )}

                      Commenter
                    </button>

                  </div>

                </div>

              ) : reason ? (

                <div className="mb-3 border-l-2 border-white/[0.08] px-3 py-2">

                  <p className="text-[9px] leading-4 text-zinc-700">
                    {reason}
                  </p>

                </div>

              ) : null}


              {/* =============================================
                  COMMENTS LIST
              ============================================= */}

              {tree.length >
              0 ? (

                <div className="divide-y divide-white/[0.04]">

                  {tree.map(
                    (comment) =>
                      renderComment(
                        comment,
                        0,
                      ),
                  )}

                </div>

              ) : (

                <div className="py-5 text-center">

                  <MessageCircle
                    size={17}
                    className="mx-auto text-zinc-800"
                  />

                  <p className="mt-2 text-[9px] text-zinc-700">
                    Aucun commentaire pour le moment.
                  </p>

                </div>

              )}

            </>

          ) : null}

        </div>

      ) : null}

    </>
  );
}
