"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  CheckCircle2,
  ChevronLeft,
  Search,
  UserRound,
  X,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";

import type {
  CommunicationConversation,
  CommunicationRecipient,
} from "../types";


type RecipientPickerProps = {

  basePath: string;

  onClose:
    () => void;

  onSearch:
    (
      query: string,
    ) =>
      Promise<
        CommunicationRecipient[]
      >;

  onOpen:
    (
      actorId: string,
    ) =>
      Promise<
        CommunicationConversation
      >;
};


function initials(
  value: string,
): string {

  const parts =
    value
      .trim()
      .split(
        /\s+/,
      )
      .filter(
        Boolean,
      )
      .slice(
        0,
        2,
      );


  if (
    !parts.length
  ) {

    return "IM";
  }


  return parts
    .map(
      (
        part,
      ) =>
        part
          .charAt(
            0,
          )
          .toUpperCase(),
    )
    .join(
      "",
    );
}


export function RecipientPicker({
  basePath,
  onClose,
  onSearch,
  onOpen,
}: RecipientPickerProps) {

  const router =
    useRouter();


  const [
    query,
    setQuery,
  ] =
    useState(
      "",
    );


  const [
    results,
    setResults,
  ] =
    useState<
      CommunicationRecipient[]
    >([]);


  const [
    searching,
    setSearching,
  ] =
    useState(
      false,
    );


  const [
    openingId,
    setOpeningId,
  ] =
    useState<
      string |
      null
    >(
      null,
    );


  const [
    error,
    setError,
  ] =
    useState<
      string |
      null
    >(
      null,
    );


  useEffect(
    () => {

      const normalized =
        query.trim();


      if (
        normalized.length <
        2
      ) {

        queueMicrotask(
          () => {

            setResults(
              [],
            );

            setSearching(
              false,
            );

            setError(
              null,
            );
          },
        );


        return;
      }


      let cancelled =
        false;


      const timer =
        window.setTimeout(
          () => {

            setSearching(
              true,
            );

            setError(
              null,
            );


            void onSearch(
              normalized,
            )
              .then(
                (
                  next,
                ) => {

                  if (
                    !cancelled
                  ) {

                    setResults(
                      next,
                    );
                  }
                },
              )
              .catch(
                (
                  reason:
                    unknown,
                ) => {

                  if (
                    !cancelled
                  ) {

                    setResults(
                      [],
                    );

                    setError(
                      reason instanceof Error
                        ? reason.message
                        : "Impossible de rechercher les destinataires.",
                    );
                  }
                },
              )
              .finally(
                () => {

                  if (
                    !cancelled
                  ) {

                    setSearching(
                      false,
                    );
                  }
                },
              );
          },
          250,
        );


      return () => {

        cancelled =
          true;

        window.clearTimeout(
          timer,
        );
      };

    },
    [
      onSearch,
      query,
    ],
  );


  async function chooseRecipient(
    recipient:
      CommunicationRecipient,
  ) {

    if (
      openingId
    ) {

      return;
    }


    setOpeningId(
      recipient.actorId,
    );

    setError(
      null,
    );


    try {

      const conversation =
        await onOpen(
          recipient.actorId,
        );


      onClose();


      router.push(
        basePath +
        "/" +
        conversation.id,
      );

    } catch (
      reason:
        unknown
    ) {

      setError(
        reason instanceof Error
          ? reason.message
          : "Impossible d'ouvrir cette conversation.",
      );

      setOpeningId(
        null,
      );
    }
  }


  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-white dark:bg-[#14181e]">

      <header className="flex h-[68px] shrink-0 items-center gap-3 border-b border-[#e5e7ea] px-4 dark:border-[#2a2f37]">

        <button
          type="button"
          onClick={
            onClose
          }
          className="grid h-8 w-8 place-items-center border border-[#dfe3e8] text-[#59606a] transition hover:bg-[#f3f4f5] dark:border-[#323842] dark:text-[#aeb4bc] dark:hover:bg-[#1c2229]"
          aria-label="Retour aux conversations"
        >
          <ChevronLeft
            size={17}
          />
        </button>


        <div className="min-w-0">

          <h2 className="truncate text-[14px] font-black text-[#171a20] dark:text-[#f0f2f4]">
            Nouveau message
          </h2>

          <p className="mt-0.5 text-[9px] text-[#9298a1] dark:text-[#777f89]">
            Choisissez un destinataire
          </p>

        </div>

      </header>


      <div className="shrink-0 border-b border-[#e5e7ea] p-4 dark:border-[#2a2f37]">

        <label className="flex h-11 items-center gap-2 border border-[#dfe3e8] bg-[#f7f8f9] px-3 transition focus-within:border-[#1769e0]/45 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#1769e0]/10 dark:border-[#333943] dark:bg-[#101419] dark:focus-within:border-[#4a7fd1] dark:focus-within:bg-[#11161c]">

          <Search
            size={15}
            className="shrink-0 text-[#9197a0]"
          />


          <span className="shrink-0 text-[10px] font-black text-[#626975] dark:text-[#9ba2ab]">
            À :
          </span>


          <input
            value={
              query
            }
            onChange={
              (
                event,
              ) =>
                setQuery(
                  event.target.value,
                )
            }
            autoFocus
            placeholder="Nom ou identifiant"
            className="min-w-0 flex-1 bg-transparent text-[12px] font-semibold text-[#252930] outline-none placeholder:text-[#9da3ab] dark:text-[#e7e9ec] dark:placeholder:text-[#747b84]"
          />


          {query ? (

            <button
              type="button"
              onClick={
                () =>
                  setQuery(
                    "",
                  )
              }
              className="grid h-6 w-6 place-items-center text-[#8d939b] transition hover:text-[#16191e] dark:hover:text-white"
              aria-label="Effacer"
            >
              <X
                size={13}
              />
            </button>

          ) : null}

        </label>

      </div>


      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">

        {query.trim().length < 2 ? (

          <div className="grid min-h-52 place-items-center px-8 text-center">

            <div>

              <UserRound
                size={28}
                className="mx-auto text-[#9ca3ac] dark:text-[#69717b]"
              />

              <p className="mt-3 text-[11px] font-bold text-[#363b43] dark:text-[#d8dce1]">
                Rechercher un membre Indesy
              </p>

              <p className="mt-1 text-[9px] leading-5 text-[#8b929c] dark:text-[#777f89]">
                Tapez au moins deux caractères du nom ou de l'identifiant.
              </p>

            </div>

          </div>

        ) : searching ? (

          <div className="px-5 py-8 text-center text-[10px] font-semibold text-[#858c96] dark:text-[#818994]">
            Recherche…
          </div>

        ) : error ? (

          <div className="m-4 border-l-[3px] border-[#e31b36] bg-[#fff4f5] px-3 py-3 text-[10px] font-medium text-[#ba1f33] dark:bg-[#25181b] dark:text-[#ff9aa8]">
            {error}
          </div>

        ) : results.length === 0 ? (

          <div className="px-5 py-8 text-center">

            <p className="text-[11px] font-bold text-[#454b54] dark:text-[#cdd2d8]">
              Aucun destinataire trouvé
            </p>

            <p className="mt-1 text-[9px] text-[#8b929c] dark:text-[#777f89]">
              Essayez un autre nom ou identifiant.
            </p>

          </div>

        ) : (

          <div>

            <div className="border-b border-[#eceef1] px-4 py-2 text-[8px] font-black uppercase tracking-[0.12em] text-[#9298a1] dark:border-[#252a31] dark:text-[#747c86]">
              Personnes
            </div>


            {results.map(
              (
                recipient,
              ) => {

                const opening =
                  openingId ===
                  recipient.actorId;


                return (
                  <button
                    key={
                      recipient.actorId
                    }
                    type="button"
                    disabled={
                      Boolean(
                        openingId,
                      )
                    }
                    onClick={
                      () =>
                        void chooseRecipient(
                          recipient,
                        )
                    }
                    className="flex min-h-[68px] w-full items-center gap-3 border-b border-[#eceef1] bg-white px-4 py-3 text-left transition hover:bg-[#f5f6f7] disabled:cursor-wait disabled:opacity-60 dark:border-[#252a31] dark:bg-[#14181e] dark:hover:bg-[#191e25]"
                  >

                    <div className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-[#e7eaee] text-[11px] font-black text-[#4b525b] dark:bg-[#282e36] dark:text-[#d9dde2]">

                      <span>
                        {initials(
                          recipient.displayName,
                        )}
                      </span>


                      {recipient.avatarUrl ? (

                        <img
                          src={
                            recipient.avatarUrl
                          }
                          alt=""
                          className="absolute inset-0 h-full w-full object-cover"
                          onError={
                            (
                              event,
                            ) => {

                              event.currentTarget.style.display =
                                "none";
                            }
                          }
                        />

                      ) : null}

                    </div>


                    <div className="min-w-0 flex-1">

                      <div className="flex min-w-0 items-center gap-1.5">

                        <strong className="truncate text-[12px] font-black text-[#252930] dark:text-[#eef1f4]">
                          {recipient.displayName}
                        </strong>


                        {recipient.verified ? (

                          <CheckCircle2
                            size={13}
                            className="shrink-0 text-[#1769e0]"
                            aria-label="Profil vérifié"
                          />

                        ) : null}

                      </div>


                      <div className="mt-1 flex min-w-0 items-center gap-2">

                        <span className="truncate text-[9px] font-semibold text-[#737b85] dark:text-[#858d97]">
                          {recipient.handle}
                        </span>

                        <span className="text-[8px] text-[#b0b5bc] dark:text-[#626b76]">
                          ·
                        </span>

                        <span className="shrink-0 text-[8px] text-[#9299a2] dark:text-[#727b86]">
                          Profil Indesy
                        </span>

                      </div>

                    </div>


                    <span className="shrink-0 text-[9px] font-bold text-[#1769e0] dark:text-[#6da3ef]">
                      {opening
                        ? "Ouverture…"
                        : "Message"}
                    </span>

                  </button>
                );
              },
            )}

          </div>

        )}

      </div>


      <footer className="shrink-0 border-t border-[#e5e7ea] px-4 py-3 text-[8px] font-medium text-[#9298a1] dark:border-[#2a2f37] dark:text-[#6f7882]">
        Les conversations de groupe et les organisations seront activées dans un lot dédié.
      </footer>

    </div>
  );
}