"use client";

import {
  LoaderCircle,
  ShieldCheck,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";

import type {
  KoranaActorSuggestion,
  KoranaTrendingHashtag,
} from "../feed.types";

import {
  useKoranaFollowActions,
} from "../hooks/useKoranaFollowActions";


export function KoranaRightSidebar({
  suggestions,
  trending,
  currentActorId,
  onChanged,
}: {
  suggestions:
    KoranaActorSuggestion[];

  trending:
    KoranaTrendingHashtag[];

  currentActorId:
    string | null;

  onChanged:
    () => Promise<unknown>;
}) {

  const followActions =
    useKoranaFollowActions();


  async function follow(
    followedActorId:
      string,
  ) {

    if (
      !currentActorId ||
      followActions.isPending(
        followedActorId,
      )
    ) {

      return;
    }


    followActions.clearError();


    try {

      await followActions.follow(
        {
          followerActorId:
            currentActorId,

          followedActorId,
        },
      );


      await onChanged();

    } catch {

      // Error exposed by the hook.
    }
  }


  return (
    <aside className="korana-right-sidebar hidden h-full min-h-0 overflow-hidden xl:block">

      {/* =====================================================
          SCROLL RIGHT INDÉPENDANT

          Pas de sticky ici.
          La colonne possède déjà toute la hauteur du workspace.
      ===================================================== */}

      <div className="korana-right-scroll h-full min-h-0 space-y-4 overflow-x-hidden overflow-y-auto p-4">

        {/* ===================================================
            TENDANCES
        =================================================== */}

        <section className="korana-side-card">

          <header className="korana-side-card-header flex h-11 items-center gap-2.5 border-b px-3.5">

            <div className="grid h-6 w-6 place-items-center bg-[#ff1638]/[0.1] text-[#ff4058]">

              <TrendingUp
                size={14}
              />

            </div>


            <div>

              <h2 className="text-[9px] font-black uppercase tracking-[0.14em] text-[#d9e0e8]">
                Tendances
              </h2>

              <span className="block text-[7px] font-semibold uppercase tracking-[0.12em] text-[#7f8b9b]">
                Korana maintenant
              </span>

            </div>

          </header>


          {trending.length ===
          0 ? (

            <div className="px-3.5 py-4">

              <p className="text-[10px] leading-5 text-[#94a0b0]">
                Les tendances apparaîtront avec l’activité des hashtags Korana.
              </p>

            </div>

          ) : (

            <div className="divide-y divide-[#303947]/60">

              {trending.map(
                (item) => (

                  <div
                    key={
                      item.tag
                    }
                    className="korana-trend-row px-3.5 py-3"
                  >

                    <strong className="block truncate text-[11px] text-[#64a8ff]">
                      #{item.tag}
                    </strong>

                    <span className="mt-0.5 block text-[9px] text-[#8e9aab]">
                      {item.postsCount} publication
                      {item.postsCount > 1
                        ? "s"
                        : ""}
                    </span>

                  </div>
                ),
              )}

            </div>

          )}

        </section>


        {/* ===================================================
            À DÉCOUVRIR
        =================================================== */}

        <section className="korana-side-card">

          <header className="korana-side-card-header flex h-11 items-center gap-2.5 border-b px-3.5">

            <div className="grid h-6 w-6 place-items-center bg-[#3d92ff]/[0.11] text-[#64a8ff]">

              <Users
                size={14}
              />

            </div>


            <div>

              <h2 className="text-[9px] font-black uppercase tracking-[0.14em] text-[#d9e0e8]">
                À découvrir
              </h2>

              <span className="block text-[7px] font-semibold uppercase tracking-[0.12em] text-[#7f8b9b]">
                Profils suggérés
              </span>

            </div>

          </header>


          {followActions.error ? (

            <div className="border-b border-[#ff1638]/20 bg-[#ff1638]/[0.06] px-3.5 py-2.5">

              <p className="text-[10px] leading-4 text-red-300">
                {followActions.error}
              </p>

            </div>

          ) : null}


          {suggestions.length ===
          0 ? (

            <div className="px-3.5 py-4">

              <p className="text-[10px] leading-5 text-[#94a0b0]">
                Aucune suggestion supplémentaire pour le moment.
              </p>

            </div>

          ) : (

            <div className="divide-y divide-[#303947]/60">

              {suggestions.map(
                (profile) => {

                  const pending =
                    followActions.isPending(
                      profile.id,
                    );


                  return (
                    <div
                      key={
                        profile.id
                      }
                      className="korana-discovery-row flex items-center gap-2.5 px-3.5 py-3"
                    >

                      <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full border border-[#465264]/60 bg-[#202936] text-[10px] font-black text-[#c3ccd7] shadow-[inset_0_1px_rgba(255,255,255,0.04)]">

                        {profile.avatarUrl ? (

                          <img
                            src={
                              profile.avatarUrl
                            }
                            alt=""
                            className="h-full w-full object-cover"
                          />

                        ) : (

                          profile.displayName
                            .slice(
                              0,
                              1,
                            )
                            .toUpperCase()

                        )}

                      </div>


                      <div className="min-w-0 flex-1">

                        <div className="flex min-w-0 items-center gap-1">

                          <strong className="truncate text-[10px] text-[#e3e8ee]">
                            {profile.displayName}
                          </strong>


                          {profile.verified ? (

                            <ShieldCheck
                              size={11}
                              className="shrink-0 text-[#64a8ff]"
                            />

                          ) : null}

                        </div>


                        <span className="block truncate text-[8px] text-[#8e9aab]">
                          @{profile.handle}
                        </span>

                      </div>


                      <button
                        type="button"
                        disabled={
                          !currentActorId ||
                          pending
                        }
                        onClick={() =>
                          void follow(
                            profile.id,
                          )
                        }
                        className="inline-flex h-7 min-w-[66px] shrink-0 items-center justify-center gap-1 border border-[#4b5869]/70 bg-[#202936] px-2 text-[8px] font-bold text-[#d9e0e8] transition hover:border-[#3d92ff]/55 hover:bg-[#3d92ff]/[0.1] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                      >

                        {pending ? (

                          <LoaderCircle
                            size={10}
                            className="animate-spin"
                          />

                        ) : (

                          <UserPlus
                            size={10}
                          />

                        )}


                        {pending
                          ? "Suivi…"
                          : "Suivre"}

                      </button>

                    </div>
                  );
                },
              )}

            </div>

          )}

        </section>

      </div>

    </aside>
  );
}