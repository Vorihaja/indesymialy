"use client";

import Link from "next/link";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

import {
  Archive,
  BellOff,
  CheckCheck,
  ChevronLeft,
  FileText,
  MessageCircle,
  MoreHorizontal,
  Paperclip,
  Plus,
  Search,
  Send,
  Smile,
  Star,
  Trash2,
  Users,
  X,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";

import type {
  CommunicationConversation,
  CommunicationMessage,
  CommunicationRecipient,
  CommunicationRole,
} from "../types";

import {
  RecipientPicker,
} from "./RecipientPicker";


type ConversationAction =
  | "archive"
  | "delete_local"
  | "favorite"
  | "mute";


type ConversationFilter =
  | "all"
  | "unread"
  | "favorites";


// MESSAGING-ROLE-FILTER-DROPDOWN-1R
const MESSAGING_ROLE_FILTER_OPTIONS:
  readonly CommunicationRole[] = [
    "fighter",
    "coach",
    "club",
    "organizer",
    "referee",
    "judge",
    "sponsor",
    "seller",
    "federation",
    "league",
    "fan",
  ];


type ModernMessagingWorkspaceProps = {
  items:
    CommunicationConversation[];

  active:
    CommunicationConversation |
    null;

  query: string;

  onQueryChange:
    (
      value: string,
    ) => void;

  onSelect:
    (
      item:
        CommunicationConversation,
    ) => void;

  onSend:
    (
      content: string,
      replyToId?: string,
    ) => Promise<void>;

  onAction:
    (
      id: string,
      action:
        ConversationAction,
    ) => Promise<void>;

  onSearchRecipients:
    (
      query: string,
    ) =>
      Promise<
        CommunicationRecipient[]
      >;

  onOpenPrivate:
    (
      actorId: string,
    ) =>
      Promise<
        CommunicationConversation
      >;

  basePath: string;

  currentProfileId?:
    string |
    null;

  realtimeConnected?:
    boolean;

  realtimeStatus?:
    string |
    null;

  embedded?:
    boolean;

  showThreadOnMobile?:
    boolean;

  initialCreateOpen?:
    boolean;

  searchAutoFocus?:
    boolean;
};



// MESSAGING-ROLE-TAGS-1R-HELPER
const COMMUNICATION_ROLE_LABELS:
  Record<
    CommunicationRole,
    string
  > = {

    fighter:
      "Combattant",

    coach:
      "Coach",

    club:
      "Club",

    organizer:
      "Organisateur",

    official:
      "Officiel",

    referee:
      "Arbitre",

    judge:
      "Juge",

    sponsor:
      "Sponsor",

    seller:
      "Vendeur",

    federation:
      "Fédération",

    league:
      "Ligue",

    fan:
      "Fan",
  };


function communicationRoleLabel(
  role:
    CommunicationRole,
): string {

  return (
    COMMUNICATION_ROLE_LABELS[
      role
    ] ??
    role
  );
}


function CommunicationRoleTag({
  role,
}: {
  role:
    CommunicationRole;
}) {

  return (
    <span
      className="
        inline-flex
        max-w-[112px]
        shrink-0
        items-center
        border
        border-[#167EFF]/25
        bg-[#167EFF]/[0.065]
        px-1.5
        py-[2px]
        text-[7px]
        font-black
        uppercase
        leading-none
        tracking-[0.08em]
        text-[#2C79D9]
        dark:text-[#539FFF]
      "
      title={
        communicationRoleLabel(
          role,
        )
      }
    >
      {communicationRoleLabel(
        role,
      )}
    </span>
  );
}


function conversationPeerRole(
  conversation:
    CommunicationConversation,

  currentProfileId?:
    string |
    null,
): CommunicationRole | null {

  if (
    conversation.kind !==
      "private"
  ) {

    return null;
  }


  if (
    currentProfileId
  ) {

    const peer =
      conversation
        .participants
        .find(
          (
            participant,
          ) =>
            participant.profileId !==
              currentProfileId,
        );


    if (
      peer
    ) {

      return peer.role;
    }
  }


  return (
    conversation
      .participants[0]
      ?.role ??
    null
  );
}


function initials(
  value: string,
): string {

  const parts =
    value
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2);

  if (
    parts.length === 0
  ) {

    return "IM";
  }

  return parts
    .map(
      (
        part,
      ) =>
        part
          .charAt(0)
          .toUpperCase(),
    )
    .join("");
}


function conversationAvatarUrl(
  conversation:
    CommunicationConversation,

  currentProfileId?:
    string |
    null,
): string | undefined {

  if (
    conversation.kind ===
      "group"
  ) {

    return undefined;
  }


  if (
    currentProfileId
  ) {

    return conversation
      .participants
      .find(
        (
          participant,
        ) =>
          participant.profileId !==
            currentProfileId,
      )
      ?.avatarUrl;
  }


  if (
    conversation
      .participants
      .length ===
      1
  ) {

    return conversation
      .participants[0]
      ?.avatarUrl;
  }


  return conversation
    .participants
    .find(
      (
        participant,
      ) =>
        participant.name ===
          conversation.title,
    )
    ?.avatarUrl;
}


function formatTime(
  value:
    string |
    undefined,
): string {

  if (
    !value
  ) {

    return "";
  }


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
      hour:
        "2-digit",

      minute:
        "2-digit",
    },
  ).format(
    date,
  );
}


function formatConversationDate(
  value:
    string |
    undefined,
): string {

  if (
    !value
  ) {

    return "";
  }


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


  const now =
    new Date();


  const sameDay =
    date.getFullYear() ===
      now.getFullYear() &&
    date.getMonth() ===
      now.getMonth() &&
    date.getDate() ===
      now.getDate();


  if (
    sameDay
  ) {

    return formatTime(
      value,
    );
  }


  if (
    date.getFullYear() ===
      now.getFullYear()
  ) {

    return new Intl.DateTimeFormat(
      "fr-FR",
      {
        day:
          "2-digit",

        month:
          "short",
      },
    ).format(
      date,
    );
  }


  return new Intl.DateTimeFormat(
    "fr-FR",
    {
      day:
        "2-digit",

      month:
        "2-digit",

      year:
        "2-digit",
    },
  ).format(
    date,
  );
}


function dayKey(
  value: string,
): string {

  const date =
    new Date(
      value,
    );


  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {

    return value;
  }


  return [
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ].join("-");
}


function formatDay(
  value: string,
): string {

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


  const now =
    new Date();


  const today =
    new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );


  const target =
    new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );


  const difference =
    Math.round(
      (
        today.getTime() -
        target.getTime()
      ) /
      86400000,
    );


  if (
    difference === 0
  ) {

    return "Aujourd’hui";
  }


  if (
    difference === 1
  ) {

    return "Hier";
  }


  return new Intl.DateTimeFormat(
    "fr-FR",
    {
      weekday:
        "short",

      day:
        "numeric",

      month:
        "long",
    },
  ).format(
    date,
  );
}


function lastMessage(
  conversation:
    CommunicationConversation,
):
  CommunicationMessage |
  undefined {

  return conversation
    .messages
    .at(-1);
}


function isOwnMessage(
  message:
    CommunicationMessage,

  currentProfileId?:
    string |
    null,
): boolean {

  if (
    currentProfileId &&
    message.authorId ===
      currentProfileId
  ) {

    return true;
  }


  return (
    message.authorName
      .trim()
      .toLocaleLowerCase(
        "fr-FR",
      ) ===
    "moi"
  );
}


export function ModernMessagingWorkspace({
  items,
  active,
  query,
  onQueryChange,
  onSelect,
  onSend,
  onAction,
  onSearchRecipients,
  onOpenPrivate,
  basePath,
  currentProfileId,
  realtimeConnected = false,
  realtimeStatus,
  embedded = false,
  showThreadOnMobile = false,
  initialCreateOpen = false,
  searchAutoFocus = false,
}: ModernMessagingWorkspaceProps) {

  const router =
    useRouter();


  const [
    filter,
    setFilter,
  ] =
    useState<
      ConversationFilter
    >(
      "all",
    );


  const [
    selectedRoles,
    setSelectedRoles,
  ] =
    useState<
      CommunicationRole[]
    >(
      [],
    );


  const [
    roleFilterOpen,
    setRoleFilterOpen,
  ] =
    useState(
      false,
    );


  const roleFilterRef =
    useRef<HTMLDivElement>(
      null,
    );


  const [
    createOpen,
    setCreateOpen,
  ] =
    useState(
      initialCreateOpen,
    );


  const [
    content,
    setContent,
  ] =
    useState(
      "",
    );


  const [
    replyTo,
    setReplyTo,
  ] =
    useState<
      string |
      undefined
    >();


  const [
    sending,
    setSending,
  ] =
    useState(
      false,
    );


  const [
    menuOpen,
    setMenuOpen,
  ] =
    useState(
      false,
    );


  const endOfMessagesRef =
    useRef<HTMLDivElement>(
      null,
    );


  useEffect(
    () => {

      const pointer = (
        event: MouseEvent,
      ) => {

        if (
          roleFilterRef.current &&
          !roleFilterRef.current.contains(
            event.target as Node,
          )
        ) {

          setRoleFilterOpen(
            false,
          );
        }
      };


      const keyboard = (
        event: KeyboardEvent,
      ) => {

        if (
          event.key ===
          "Escape"
        ) {

          setRoleFilterOpen(
            false,
          );
        }
      };


      document.addEventListener(
        "mousedown",
        pointer,
      );


      document.addEventListener(
        "keydown",
        keyboard,
      );


      return () => {

        document.removeEventListener(
          "mousedown",
          pointer,
        );


        document.removeEventListener(
          "keydown",
          keyboard,
        );
      };

    },
    [],
  );


  useEffect(
    () => {

      if (
        initialCreateOpen
      ) {

        setCreateOpen(
          true,
        );
      }
    },
    [
      initialCreateOpen,
    ],
  );


  useEffect(
    () => {

      endOfMessagesRef.current
        ?.scrollIntoView(
          {
            block:
              "end",
          },
        );
    },
    [
      active?.id,
      active?.messages.length,
    ],
  );


  useEffect(
    () => {

      setReplyTo(
        undefined,
      );

      setMenuOpen(
        false,
      );
    },
    [
      active?.id,
    ],
  );


  const totalUnread =
    useMemo(
      () =>
        items.reduce(
          (
            total,
            item,
          ) =>
            total +
            item.unreadCount,
          0,
        ),
      [
        items,
      ],
    );


  const visibleItems =
    useMemo(
      () => {

        const normalizedQuery =
          query
            .trim()
            .toLocaleLowerCase(
              "fr-FR",
            );


        return items.filter(
          (
            item,
          ) => {

            if (
              filter ===
                "unread" &&
              item.unreadCount ===
                0
            ) {

              return false;
            }


            if (
              filter ===
                "favorites" &&
              !item.favorite
            ) {

              return false;
            }

            /*
             * MESSAGING-ROLE-FILTER-DROPDOWN-1R
             */
            if (
              selectedRoles.length >
              0
            ) {

              if (
                item.kind ===
                  "private"
              ) {

                const peerRole =
                  conversationPeerRole(
                    item,
                    currentProfileId,
                  );


                if (
                  !peerRole ||
                  !selectedRoles.includes(
                    peerRole,
                  )
                ) {

                  return false;
                }

              } else {

                const groupMatchesRole =
                  item
                    .participants
                    .filter(
                      (
                        participant,
                      ) =>
                        !currentProfileId ||
                        participant.profileId !==
                          currentProfileId,
                    )
                    .some(
                      (
                        participant,
                      ) =>
                        selectedRoles.includes(
                          participant.role,
                        ),
                    );


                if (
                  !groupMatchesRole
                ) {

                  return false;
                }
              }
            }



            if (
              !normalizedQuery
            ) {

              return true;
            }


            const titleMatch =
              item.title
                .toLocaleLowerCase(
                  "fr-FR",
                )
                .includes(
                  normalizedQuery,
                );


            const messageMatch =
              item.messages.some(
                (
                  message,
                ) =>
                  message.content
                    .toLocaleLowerCase(
                      "fr-FR",
                    )
                    .includes(
                      normalizedQuery,
                    ),
              );


            return (
              titleMatch ||
              messageMatch
            );
          },
        );
      },
      [
        currentProfileId,
        filter,
        items,
        query,
        selectedRoles,
      ],
    );


  const messageById =
    useMemo(
      () =>
        new Map(
          (
            active
              ?.messages ??
            []
          ).map(
            (
              message,
            ) => [
              message.id,
              message,
            ],
          ),
        ),
      [
        active,
      ],
    );


  const replyTarget =
    replyTo
      ? messageById.get(
          replyTo,
        )
      : undefined;


  const conversationSubtitle =
    active
      ? active.kind ===
        "group"
        ? (
            active
              .participants
              .length ===
            1
              ? "1 membre"
              : (
                  active
                    .participants
                    .length +
                  " membres"
                )
          )
        : (
            active
              .participants
              .find(
                (
                  participant,
                ) =>
                  participant.profileId !==
                    currentProfileId,
              )
              ?.name ??
            "Conversation privée"
          )
      : "";


  const heightClass =
    embedded
      ? "h-full min-h-0"
      : "h-[calc(100dvh-150px)] min-h-0 max-h-[920px]";


  async function handleSend() {

    const value =
      content
        .trim();


    if (
      !value ||
      sending ||
      !active
    ) {

      return;
    }


    setSending(
      true,
    );


    try {

      await onSend(
        value,
        replyTo,
      );


      setContent(
        "",
      );

      setReplyTo(
        undefined,
      );

    } finally {

      setSending(
        false,
      );
    }
  }


  function handleComposerKeyDown(
    event:
      ReactKeyboardEvent<HTMLTextAreaElement>,
  ) {

    if (
      event.key ===
        "Enter" &&
      !event.shiftKey
    ) {

      event.preventDefault();

      void handleSend();
    }
  }


  function conversationAction(
    action:
      ConversationAction,
  ) {

    if (
      !active
    ) {

      return;
    }


    setMenuOpen(
      false,
    );


    void onAction(
      active.id,
      action,
    );
  }


  return (
    <section
      className={[
        "korana-messaging-workspace grid h-full min-h-0 min-w-0 w-full overflow-hidden border border-[#dfe3e8] bg-white text-[#181b20] shadow-[0_18px_48px_rgba(15,23,42,0.08)]",
        "dark:border-[#2a2f37] dark:bg-[#11151a] dark:text-[#edf0f3] dark:shadow-[0_18px_52px_rgba(0,0,0,0.30)]",
        "md:grid-cols-[340px_minmax(0,1fr)]",
        heightClass,
      ].join(" ")}
    >
      <aside
        className={[
          "relative min-h-0 min-w-0 flex-col border-r border-[#e3e6ea] bg-[#fbfbfc]",
          "dark:border-[#2a2f37] dark:bg-[#14181e]",
          showThreadOnMobile
            ? "hidden md:flex"
            : "flex",
        ].join(" ")}
      >
        <header
          className="korana-messaging-list-header border-b border-[#e6e8eb] bg-white px-5 pb-0 pt-5 dark:border-[#2a2f37] dark:bg-[#14181e]"
        >
          <div
            className="flex items-center justify-between gap-4"
          >
            <div>
              <div
                className="flex items-center gap-2"
              >
                <h1
                  className="text-[19px] font-black tracking-[-0.025em] text-[#16191e] dark:text-[#f2f4f6]"
                >
                  Conversations
                </h1>

                <button
                  type="button"
                  onClick={() =>
                    setCreateOpen(
                      true,
                    )
                  }
                  className="grid h-7 w-7 place-items-center border border-[#e31b36] bg-[#e31b36] text-white transition hover:bg-[#c7152e] focus:outline-none focus:ring-2 focus:ring-[#e31b36]/25"
                  aria-label="Démarrer une conversation"
                  title="Démarrer une conversation"
                >
                  <Plus
                    size={16}
                    strokeWidth={2.3}
                  />
                </button>
              </div>

              <p
                className="mt-1 text-[10px] font-medium text-[#8a9099] dark:text-[#838a94]"
              >
                {totalUnread > 0
                  ? (
                      totalUnread +
                      (
                        totalUnread === 1
                          ? " message non lu"
                          : " messages non lus"
                      )
                    )
                  : "Tout est à jour"}
              </p>
            </div>

            <div
              className="flex items-center gap-1.5 text-[9px] font-semibold text-[#7c838d] dark:text-[#858c96]"
              title={
                realtimeStatus ??
                "Realtime"
              }
            >
              <span
                className={[
                  "h-1.5 w-1.5 rounded-full",
                  realtimeConnected
                    ? "bg-[#20a15f]"
                    : "bg-[#aeb4bc]",
                ].join(" ")}
              />

              Live
            </div>
          </div>


          <label
            className="korana-messaging-search mt-4 flex h-10 items-center gap-2 border border-[#dfe3e8] bg-[#f7f8f9] px-3 transition focus-within:border-[#1769e0]/45 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#1769e0]/10 dark:border-[#333943] dark:bg-[#101419] dark:focus-within:border-[#4a7fd1] dark:focus-within:bg-[#11161c]"
          >
            <Search
              size={15}
              className="shrink-0 text-[#9197a0]"
            />

            <input
              value={
                query
              }
              onChange={
                (
                  event,
                ) =>
                  onQueryChange(
                    event.target.value,
                  )
              }
              autoFocus={
                searchAutoFocus
              }
              placeholder="Rechercher"
              className="min-w-0 flex-1 bg-transparent text-[12px] font-medium text-[#252930] outline-none placeholder:text-[#9da3ab] dark:text-[#e7e9ec] dark:placeholder:text-[#747b84]"
            />

            {query && (
              <button
                type="button"
                onClick={() =>
                  onQueryChange(
                    "",
                  )
                }
                className="grid h-5 w-5 place-items-center text-[#8d939b] hover:text-[#16191e] dark:hover:text-white"
                aria-label="Effacer la recherche"
              >
                <X
                  size={13}
                />
              </button>
            )}
          </label>


          <nav
            className="korana-messaging-tabs mt-4 flex h-9 items-end gap-6"
            aria-label="Filtres de conversations"
          >
            {(
              [
                [
                  "all",
                  "Toutes",
                ],
                [
                  "unread",
                  "Non lues",
                ],
                [
                  "favorites",
                  "Favorites",
                ],
              ] as const
            ).map(
              (
                [
                  value,
                  label,
                ],
              ) => {

                const selected =
                  filter ===
                    value;


                return (
                  <button
                    key={
                      value
                    }
                    type="button"
                    onClick={() =>
                      setFilter(
                        value,
                      )
                    }
                    className={[
                      "relative h-9 text-[10px] font-bold transition",
                      selected
                        ? "text-[#e31b36]"
                        : "text-[#767d87] hover:text-[#252930] dark:text-[#8b929d] dark:hover:text-[#e8eaed]",
                    ].join(" ")}
                  >
                    {label}

                    {selected && (
                      <span
                        className="absolute inset-x-0 bottom-0 h-[2px] bg-[#e31b36]"
                      />
                    )}
                  </button>
                );
              },
            )}


            {/* =================================================
                MESSAGING-ROLE-FILTER-DROPDOWN-1R
            ================================================= */}

            <div
              ref={
                roleFilterRef
              }
              className="relative h-9 shrink-0"
            >

              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={
                  roleFilterOpen
                }
                onClick={() =>
                  setRoleFilterOpen(
                    (
                      current,
                    ) =>
                      !current,
                  )
                }
                className={[
                  "relative flex h-9 items-center gap-1 text-[10px] font-bold transition",
                  selectedRoles.length >
                  0
                    ? "text-[#e31b36]"
                    : "text-[#858b94] hover:text-[#30343a] dark:text-[#8e959f] dark:hover:text-[#e5e7eb]",
                ].join(
                  " ",
                )}
              >

                <span>
                  Rôle
                </span>


                <span
                  aria-hidden="true"
                  className={[
                    "relative -top-px text-[10px] transition-transform",
                    roleFilterOpen
                      ? "rotate-180"
                      : "",
                  ].join(
                    " ",
                  )}
                >
                  ▾
                </span>


                {selectedRoles.length >
                0 ? (

                  <span
                    className="absolute inset-x-0 bottom-0 h-[2px] bg-[#e31b36]"
                  />

                ) : null}

              </button>


              {roleFilterOpen ? (

                <div
                  role="menu"
                  aria-label="Sélection des rôles"
                  className="
                    absolute
                    right-0
                    top-[calc(100%+6px)]
                    z-[100]
                    w-[220px]
                    border
                    border-[#dfe3e8]
                    bg-white
                    p-1.5
                    shadow-[0_18px_45px_rgba(15,23,42,0.18)]
                    dark:border-[#303640]
                    dark:bg-[#11161c]
                    dark:shadow-[0_20px_48px_rgba(0,0,0,0.46)]
                  "
                >

                  <div
                    className="px-2.5 pb-1.5 pt-1 text-[7px] font-black uppercase tracking-[0.12em] text-[#999fa7] dark:text-[#686f78]"
                  >
                    Filtrer par rôle
                  </div>


                  {MESSAGING_ROLE_FILTER_OPTIONS.map(
                    (
                      roleOption,
                    ) => {

                      const checked =
                        selectedRoles.includes(
                          roleOption,
                        );


                      return (
                        <label
                          key={
                            roleOption
                          }
                          className="
                            flex
                            min-h-9
                            cursor-pointer
                            items-center
                            gap-2.5
                            px-2.5
                            text-[10px]
                            font-semibold
                            text-[#4f5660]
                            transition
                            hover:bg-[#f3f4f6]
                            dark:text-[#b7bdc5]
                            dark:hover:bg-white/[0.045]
                          "
                        >

                          <input
                            type="checkbox"
                            checked={
                              checked
                            }
                            onChange={() =>
                              setSelectedRoles(
                                (
                                  current,
                                ) =>
                                  current.includes(
                                    roleOption,
                                  )
                                    ? current.filter(
                                        (
                                          value,
                                        ) =>
                                          value !==
                                          roleOption,
                                      )
                                    : [
                                        ...current,
                                        roleOption,
                                      ],
                              )
                            }
                            className="h-3.5 w-3.5 shrink-0 accent-[#e31b36]"
                          />


                          <span
                            className="min-w-0 flex-1 truncate"
                          >
                            {communicationRoleLabel(
                              roleOption,
                            )}
                          </span>

                        </label>
                      );
                    },
                  )}


                  {selectedRoles.length >
                  0 ? (

                    <>
                      <div
                        className="my-1 h-px bg-[#e7e9ec] dark:bg-[#282e35]"
                      />


                      <button
                        type="button"
                        onClick={() =>
                          setSelectedRoles(
                            [],
                          )
                        }
                        className="
                          flex
                          min-h-9
                          w-full
                          items-center
                          px-2.5
                          text-left
                          text-[9px]
                          font-bold
                          text-[#d72840]
                          transition
                          hover:bg-[#e31b36]/[0.05]
                          dark:text-[#ff536b]
                        "
                      >
                        Tout effacer
                      </button>
                    </>

                  ) : null}

                </div>

              ) : null}

            </div>
</nav>
        </header>


        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
        >
          {visibleItems.length ===
          0 ? (
            <div
              className="grid min-h-52 place-items-center px-8 text-center"
            >
              <div>
                <MessageCircle
                  size={28}
                  className="mx-auto text-[#a0a6ae] dark:text-[#68707a]"
                />

                <p
                  className="mt-3 text-[12px] font-bold text-[#343840] dark:text-[#d9dde2]"
                >
                  Aucune conversation
                </p>

                <p
                  className="mt-1 text-[10px] leading-5 text-[#8d939b] dark:text-[#7f8791]"
                >
                  Utilisez le + à côté de Conversations pour démarrer un échange.
                </p>
              </div>
            </div>
          ) : (
            visibleItems.map(
              (
                item,
              ) => {

                const selected =
                  active?.id ===
                  item.id;

                const latest =
                  lastMessage(
                    item,
                  );


                return (
                  <Link
                    key={
                      item.id
                    }
                    href={
                      basePath +
                      "/" +
                      item.id
                    }
                    onClick={() =>
                      onSelect(
                        item,
                      )
                    }
                    aria-current={
                      selected
                        ? "page"
                        : undefined
                    }
                    className={[
                      "korana-messaging-conversation group relative flex min-h-[72px] items-center gap-3 border-b px-4 py-3 transition",
                      "border-[#eceef1] dark:border-[#252a31]",
                      selected
                        ? "bg-[#f1f3f5] dark:bg-[#1c2128]"
                        : "bg-[#fbfbfc] hover:bg-[#f5f6f7] dark:bg-[#14181e] dark:hover:bg-[#191e25]",
                    ].join(" ")}
                  >
                    {selected && (
                      <span
                        className="absolute inset-y-0 left-0 w-[3px] bg-[#e31b36]"
                      />
                    )}

                    <div
                      className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#e8ebef] text-[11px] font-black text-[#3d434b] dark:bg-[#282e36] dark:text-[#d9dde2]"
                    >
                      {conversationAvatarUrl(
                        item,
                        currentProfileId,
                      ) ? (
                        <img
                          src={
                            conversationAvatarUrl(
                              item,
                              currentProfileId,
                            )
                          }
                          alt={item.title}
                          className="h-11 w-11 rounded-full object-cover"
                        />
                      ) : (
                        initials(
                          item.title,
                        )
                      )}

                      {item.kind ===
                        "group" && (
                        <span
                          className="absolute -bottom-0.5 -right-0.5 grid h-[18px] w-[18px] place-items-center rounded-full border-2 border-white bg-[#1769e0] text-white dark:border-[#14181e]"
                        >
                          <Users
                            size={9}
                          />
                        </span>
                      )}
                    </div>


                    <div
                      className="min-w-0 flex-1"
                    >
                      <div
                        className="flex items-center gap-2"
                      >
                        <strong
                          className={[
                            "min-w-0 flex-1 truncate text-[12px]",
                            item.unreadCount >
                            0
                              ? "font-black text-[#171a20] dark:text-white"
                              : "font-bold text-[#343942] dark:text-[#d9dde2]",
                          ].join(" ")}
                        >
                          {item.title}
                        </strong>

                        {conversationPeerRole(
                          item,
                          currentProfileId,
                        ) ? (
                          <CommunicationRoleTag
                            role={
                              conversationPeerRole(
                                item,
                                currentProfileId,
                              ) ??
                              "fan"
                            }
                          />
                        ) : null}

                        <time
                          className={[
                            "shrink-0 text-[8px] font-semibold",
                            item.unreadCount >
                            0
                              ? "text-[#e31b36]"
                              : "text-[#999fa8] dark:text-[#767e89]",
                          ].join(" ")}
                        >
                          {formatConversationDate(
                            item.lastActivityAt,
                          )}
                        </time>
                      </div>


                      <div
                        className="mt-1 flex items-center gap-2"
                      >
                        <p
                          className={[
                            "min-w-0 flex-1 truncate text-[10px]",
                            item.unreadCount >
                            0
                              ? "font-semibold text-[#555b64] dark:text-[#b5bbc3]"
                              : "text-[#8d939c] dark:text-[#7b838d]",
                          ].join(" ")}
                        >
                          {latest?.authorName
                            ? (
                                latest.authorName +
                                " · "
                              )
                            : ""}

                          {latest?.content ??
                            "Conversation démarrée"}
                        </p>

                        {item.unreadCount >
                          0 && (
                          <span
                            className="inline-flex min-w-[18px] items-center justify-center bg-[#1769e0] px-1 py-0.5 text-[8px] font-black text-white"
                          >
                            {item.unreadCount >
                            99
                              ? "99+"
                              : item.unreadCount}
                          </span>
                        )}
                      </div>


                      {(item.favorite ||
                        item.muted ||
                        item.archived) && (
                        <div
                          className="mt-1.5 flex items-center gap-1.5 text-[#9aa0a8] dark:text-[#6f7781]"
                        >
                          {item.favorite && (
                            <Star
                              size={9}
                              fill="currentColor"
                            />
                          )}

                          {item.muted && (
                            <BellOff
                              size={9}
                            />
                          )}

                          {item.archived && (
                            <Archive
                              size={9}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              },
            )
          )}
        </div>


        {createOpen ? (

          <RecipientPicker
            basePath={
              basePath
            }
            onClose={
              () =>
                setCreateOpen(
                  false,
                )
            }
            onSearch={
              onSearchRecipients
            }
            onOpen={
              onOpenPrivate
            }
          />

        ) : null}
      </aside>


      <main
        className={[
          "relative min-h-0 min-w-0 flex-col overflow-hidden bg-[#f5f6f7] dark:bg-[#0d1015]",
          showThreadOnMobile
            ? "flex"
            : "hidden md:flex",
        ].join(" ")}
      >
        {!active ? (
          <div
            className="grid h-full place-items-center p-10"
          >
            <div
              className="max-w-sm text-center"
            >
              <MessageCircle
                size={36}
                className="mx-auto text-[#7f8791] dark:text-[#69717b]"
              />

              <h2
                className="mt-5 text-[18px] font-black text-[#24282e] dark:text-[#e7eaee]"
              >
                Messagerie Indesy
              </h2>

              <p
                className="mt-2 text-[11px] leading-6 text-[#8b919a] dark:text-[#78808a]"
              >
                Sélectionnez une conversation pour commencer à échanger.
              </p>
            </div>
          </div>
        ) : (
          <>
            <header
              className="korana-messaging-thread-header relative z-20 flex min-h-[68px] items-center gap-3 border-b border-[#e2e5e9] bg-white px-3 sm:px-5 dark:border-[#2a2f37] dark:bg-[#11151a]"
            >
              <Link
                href={
                  basePath
                }
                className="grid h-8 w-8 shrink-0 place-items-center border border-[#dfe3e8] text-[#626975] hover:bg-[#f2f3f4] md:hidden dark:border-[#333943] dark:text-[#abb1b9] dark:hover:bg-[#1b2027]"
                aria-label="Retour aux conversations"
              >
                <ChevronLeft
                  size={17}
                />
              </Link>


              <div
                className="korana-messaging-thread-avatar grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#20242a] text-[10px] font-black text-white dark:bg-[#2b3139]"
              >
                {conversationAvatarUrl(
                  active,
                  currentProfileId,
                ) ? (
                  <img
                    src={
                      conversationAvatarUrl(
                        active,
                        currentProfileId,
                      )
                    }
                    alt={active.title}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  initials(
                    active.title,
                  )
                )}
              </div>


              <div
                className="min-w-0 flex-1"
              >
                <div
                  className="flex min-w-0 items-center gap-2"
                >
                  <h2
                    className="min-w-0 truncate text-[13px] font-black text-[#1c1f24] dark:text-[#f1f3f5]"
                  >
                    {active.title}
                  </h2>

                  {conversationPeerRole(
                    active,
                    currentProfileId,
                  ) ? (
                    <CommunicationRoleTag
                      role={
                        conversationPeerRole(
                          active,
                          currentProfileId,
                        ) ??
                        "fan"
                      }
                    />
                  ) : null}
                </div>

                <div
                  className="mt-0.5 flex items-center gap-2"
                >
                  <p
                    className="truncate text-[9px] font-medium text-[#8a919b] dark:text-[#7f8791]"
                  >
                    {conversationSubtitle}
                  </p>

                  <span
                    className={[
                      "h-1.5 w-1.5 rounded-full",
                      realtimeConnected
                        ? "bg-[#20a15f]"
                        : "bg-[#aeb4bc]",
                    ].join(" ")}
                  />

                  <span
                    className={[
                      "text-[8px] font-semibold",
                      realtimeConnected
                        ? "text-[#16804a] dark:text-[#50c481]"
                        : "text-[#9ba1aa] dark:text-[#717984]",
                    ].join(" ")}
                  >
                    {realtimeConnected
                      ? "En ligne"
                      : "Connexion"}
                  </span>
                </div>
              </div>


              <div
                className="korana-messaging-thread-actions flex items-center gap-1"
              >
                <button
                  type="button"
                  onClick={() =>
                    conversationAction(
                      "favorite",
                    )
                  }
                  className={[
                    "grid h-8 w-8 place-items-center border transition",
                    active.favorite
                      ? "border-[#e31b36] bg-[#e31b36] text-white"
                      : "border-transparent text-[#646b75] hover:border-[#dfe3e8] hover:bg-[#f5f6f7] dark:text-[#a1a8b1] dark:hover:border-[#343a43] dark:hover:bg-[#1a1f26]",
                  ].join(" ")}
                  aria-label="Favori"
                >
                  <Star
                    size={15}
                    fill={
                      active.favorite
                        ? "currentColor"
                        : "none"
                    }
                  />
                </button>


                <button
                  type="button"
                  onClick={() =>
                    conversationAction(
                      "mute",
                    )
                  }
                  className={[
                    "grid h-8 w-8 place-items-center border transition",
                    active.muted
                      ? "border-[#1769e0] bg-[#1769e0] text-white"
                      : "border-transparent text-[#646b75] hover:border-[#dfe3e8] hover:bg-[#f5f6f7] dark:text-[#a1a8b1] dark:hover:border-[#343a43] dark:hover:bg-[#1a1f26]",
                  ].join(" ")}
                  aria-label="Notifications"
                >
                  <BellOff
                    size={15}
                  />
                </button>


                <div
                  className="relative"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setMenuOpen(
                        (
                          current,
                        ) =>
                          !current,
                      )
                    }
                    className="grid h-8 w-8 place-items-center border border-transparent text-[#646b75] transition hover:border-[#dfe3e8] hover:bg-[#f5f6f7] dark:text-[#a1a8b1] dark:hover:border-[#343a43] dark:hover:bg-[#1a1f26]"
                    aria-label="Options"
                  >
                    <MoreHorizontal
                      size={18}
                    />
                  </button>


                  {menuOpen && (
                    <div
                      className="absolute right-0 top-9 z-40 w-48 border border-[#dfe3e8] bg-white p-1 shadow-[0_14px_35px_rgba(15,23,42,0.14)] dark:border-[#343a43] dark:bg-[#171c22] dark:shadow-[0_14px_35px_rgba(0,0,0,0.35)]"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          conversationAction(
                            "archive",
                          )
                        }
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-[10px] font-semibold text-[#4c525b] hover:bg-[#f3f4f5] dark:text-[#c4c9cf] dark:hover:bg-[#20262d]"
                      >
                        <Archive
                          size={14}
                        />

                        {active.archived
                          ? "Retirer des archives"
                          : "Archiver"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          conversationAction(
                            "delete_local",
                          )
                        }
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-[10px] font-semibold text-[#d21d35] hover:bg-[#fff1f3] dark:hover:bg-[#29171b]"
                      >
                        <Trash2
                          size={14}
                        />

                        Masquer pour moi
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </header>


            <div
              className="korana-messaging-thread-body min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#f7f8f9] px-3 py-5 sm:px-6 dark:bg-[#0d1015]"
            >
              <div
                className="mx-auto flex w-full max-w-[880px] flex-col"
              >
                {active.messages.length ===
                  0 && (
                  <div
                    className="mx-auto my-14 max-w-sm text-center"
                  >
                    <MessageCircle
                      size={28}
                      className="mx-auto text-[#969da6] dark:text-[#69717b]"
                    />

                    <p
                      className="mt-3 text-[11px] font-black text-[#343840] dark:text-[#d8dce1]"
                    >
                      Début de la conversation
                    </p>
                  </div>
                )}


                {active.messages.map(
                  (
                    message,
                    index,
                  ) => {

                    const previous =
                      index >
                      0
                        ? active
                            .messages[
                              index -
                              1
                            ]
                        : undefined;


                    const showDay =
                      !previous ||
                      dayKey(
                        previous.sentAt,
                      ) !==
                        dayKey(
                          message.sentAt,
                        );


                    const own =
                      isOwnMessage(
                        message,
                        currentProfileId,
                      );


                    const replied =
                      message.replyToId
                        ? messageById.get(
                            message.replyToId,
                          )
                        : undefined;


                    if (
                      message.contentType ===
                        "system"
                    ) {

                      return (
                        <div
                          key={
                            message.id
                          }
                        >
                          {showDay && (
                            <div
                              className="my-5 flex items-center gap-4"
                            >
                              <span
                                className="h-px flex-1 bg-[#e2e5e9] dark:bg-[#292f37]"
                              />

                              <span
                                className="text-[8px] font-bold text-[#8c929b] dark:text-[#707984]"
                              >
                                {formatDay(
                                  message.sentAt,
                                )}
                              </span>

                              <span
                                className="h-px flex-1 bg-[#e2e5e9] dark:bg-[#292f37]"
                              />
                            </div>
                          )}

                          <div
                            className="my-3 text-center text-[9px] font-medium text-[#9197a1] dark:text-[#6f7882]"
                          >
                            {message.content}
                          </div>
                        </div>
                      );
                    }


                    return (
                      <div
                        key={
                          message.id
                        }
                      >
                        {showDay && (
                          <div
                            className="my-5 flex items-center gap-4"
                          >
                            <span
                              className="h-px flex-1 bg-[#e2e5e9] dark:bg-[#292f37]"
                            />

                            <span
                              className="text-[8px] font-bold text-[#8c929b] dark:text-[#707984]"
                            >
                              {formatDay(
                                message.sentAt,
                              )}
                            </span>

                            <span
                              className="h-px flex-1 bg-[#e2e5e9] dark:bg-[#292f37]"
                            />
                          </div>
                        )}


                        <div
                          className={[
                            "group mb-2 flex w-full items-end gap-2",
                            own
                              ? "justify-end"
                              : "justify-start",
                          ].join(" ")}
                        >
                          {!own && (
                            <div
                              className="mb-4 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#e2e6ea] text-[8px] font-black text-[#555d66] dark:bg-[#272d35] dark:text-[#d5d9de]"
                            >
                              {message.authorAvatarUrl ? (
                                <img
                                  src={
                                    message.authorAvatarUrl
                                  }
                                  alt={
                                    message.authorName
                                  }
                                  className="h-7 w-7 rounded-full object-cover"
                                />
                              ) : (
                                initials(
                                  message.authorName,
                                )
                              )}
                            </div>
                          )}


                          <div
                            className={[
                              "flex max-w-[80%] flex-col sm:max-w-[68%]",
                              own
                                ? "items-end"
                                : "items-start",
                            ].join(" ")}
                          >
                            {!own &&
                              active.kind ===
                                "group" && (
                                <div
                                  className="mb-1 flex min-w-0 items-center gap-1.5"
                                >
                                  <span
                                    className="min-w-0 truncate text-[8px] font-bold text-[#7d838d] dark:text-[#858d97]"
                                  >
                                    {message.authorName}
                                  </span>

                                  <CommunicationRoleTag
                                    role={
                                      message.authorRole
                                    }
                                  />
                                </div>
                              )}


                            <div
                              className={[
                                "border px-3 py-2 text-[11px] leading-[1.55]",
                                own
                                  ? "rounded-[4px] border-[#e31b36] bg-[#e31b36] text-white"
                                  : "rounded-[4px] border-[#dde1e5] bg-white text-[#252930] dark:border-[#2e343d] dark:bg-[#171c22] dark:text-[#e5e8eb]",
                              ].join(" ")}
                            >
                              {replied && (
                                <div
                                  className={[
                                    "mb-2 border-l-2 px-2 py-1 text-[9px]",
                                    own
                                      ? "border-white/60 bg-black/5 text-white/90"
                                      : "border-[#1769e0] bg-[#f2f5f9] text-[#68707b] dark:bg-[#11161c] dark:text-[#a5acb5]",
                                  ].join(" ")}
                                >
                                  <span
                                    className="block truncate font-bold"
                                  >
                                    {replied.authorName}
                                  </span>

                                  <span
                                    className="block max-w-[280px] truncate"
                                  >
                                    {replied.content}
                                  </span>
                                </div>
                              )}


                              <p
                                className={
                                  message.deletedAt
                                    ? "italic opacity-70"
                                    : ""
                                }
                              >
                                {message.content}
                              </p>
                            </div>


                            <div
                              className="mt-1 flex items-center gap-1.5 text-[8px] text-[#989fa8] dark:text-[#6f7882]"
                            >
                              <time>
                                {formatTime(
                                  message.sentAt,
                                )}
                              </time>

                              {message.editedAt && (
                                <>
                                  <span>
                                    ·
                                  </span>

                                  <span>
                                    modifié
                                  </span>
                                </>
                              )}

                              {own && (
                                <>
                                  <CheckCheck
                                    size={10}
                                    className={
                                      message.status ===
                                      "read"
                                        ? "text-[#1769e0]"
                                        : ""
                                    }
                                  />

                                  <span>
                                    {message.status ===
                                      "read"
                                      ? "Lu"
                                      : "Envoyé"}
                                  </span>
                                </>
                              )}
                            </div>


                            {!message.deletedAt && (
                              <button
                                type="button"
                                onClick={() =>
                                  setReplyTo(
                                    message.id,
                                  )
                                }
                                className="mt-0.5 text-[8px] font-bold text-[#a0a6ae] opacity-0 transition hover:text-[#1769e0] group-hover:opacity-100 focus:opacity-100 dark:text-[#68717b]"
                              >
                                Répondre
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  },
                )}


                <div
                  ref={
                    endOfMessagesRef
                  }
                />
              </div>
            </div>


            <footer
              className="korana-messaging-composer relative z-20 border-t border-[#dfe3e8] bg-white px-3 py-3 sm:px-5 dark:border-[#2a3038] dark:bg-[#11151a]"
            >
              <div
                className="mx-auto w-full max-w-[920px]"
              >
                {replyTarget && (
                  <div
                    className="mb-2 flex items-center gap-3 border border-[#dfe3e8] bg-[#f7f8f9] px-3 py-2 dark:border-[#303640] dark:bg-[#171c22]"
                  >
                    <div
                      className="h-8 w-[2px] bg-[#1769e0]"
                    />

                    <div
                      className="min-w-0 flex-1"
                    >
                      <p
                        className="text-[8px] font-black text-[#1769e0]"
                      >
                        Réponse à {replyTarget.authorName}
                      </p>

                      <p
                        className="mt-0.5 truncate text-[8px] text-[#858c96] dark:text-[#838b95]"
                      >
                        {replyTarget.content}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setReplyTo(
                          undefined,
                        )
                      }
                      className="grid h-6 w-6 place-items-center text-[#8c929c] hover:bg-[#e8eaed] hover:text-[#272b31] dark:hover:bg-[#222830] dark:hover:text-white"
                      aria-label="Annuler la réponse"
                    >
                      <X
                        size={13}
                      />
                    </button>
                  </div>
                )}


                <div
                  className="flex items-end gap-2"
                >
                  <button
                    type="button"
                    disabled
                    title="Pièces jointes — prochain lot"
                    className="grid h-10 w-10 shrink-0 place-items-center border border-[#dfe3e8] text-[#7f8791] disabled:cursor-default dark:border-[#333943] dark:text-[#7a838d]"
                    aria-label="Ajouter une pièce jointe"
                  >
                    <Paperclip
                      size={16}
                    />
                  </button>


                  <div
                    className="flex min-h-[42px] min-w-0 flex-1 items-end border border-[#dfe3e8] bg-[#f8f9fa] px-3 transition focus-within:border-[#1769e0]/45 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#1769e0]/8 dark:border-[#333943] dark:bg-[#171c22] dark:focus-within:border-[#4f7fc7] dark:focus-within:bg-[#151a20]"
                  >
                    <textarea
                      value={
                        content
                      }
                      onChange={
                        (
                          event,
                        ) =>
                          setContent(
                            event.target.value,
                          )
                      }
                      onKeyDown={
                        handleComposerKeyDown
                      }
                      rows={1}
                      placeholder="Écrivez un message..."
                      className="max-h-[120px] min-h-[40px] min-w-0 flex-1 resize-none bg-transparent py-[11px] text-[11px] leading-5 text-[#20242a] outline-none placeholder:text-[#9ba1aa] dark:text-[#e6e9ec] dark:placeholder:text-[#6f7882]"
                    />


                    <button
                      type="button"
                      disabled
                      title="Emojis — prochain lot"
                      className="grid h-10 w-8 shrink-0 place-items-center text-[#9198a1] dark:text-[#737c86]"
                      aria-label="Ajouter un emoji"
                    >
                      <Smile
                        size={15}
                      />
                    </button>
                  </div>


                  <button
                    type="button"
                    onClick={() =>
                      void handleSend()
                    }
                    disabled={
                      !content.trim() ||
                      sending
                    }
                    className="grid h-10 w-10 shrink-0 place-items-center bg-[#e31b36] text-white transition hover:bg-[#c7152e] disabled:cursor-not-allowed disabled:bg-[#c8ccd1] dark:disabled:bg-[#343a43]"
                    aria-label="Envoyer"
                  >
                    <Send
                      size={15}
                      strokeWidth={2.4}
                    />
                  </button>
                </div>
              </div>
            </footer>
          </>
        )}
      </main>
    </section>
  );
}
