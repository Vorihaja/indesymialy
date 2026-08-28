"use client";

import {
  LoaderCircle,
  RefreshCw,
  UsersRound,
} from "lucide-react";

import {
  useKoranaFeed,
} from "../hooks/useKoranaFeed";

import {
  KoranaActorSwitcher,
} from "../components/KoranaActorSwitcher";

import {
  KoranaComposer,
} from "../components/KoranaComposer";

import {
  KoranaFeedActivityCard,
} from "../components/KoranaFeedActivityCard";

import {
  KoranaRightSidebar,
} from "../components/KoranaRightSidebar";


export function KoranaHomeFeature() {

  const korana =
    useKoranaFeed();


  if (
    korana.loading &&
    !korana.data
  ) {

    return (
      <div className="grid h-full min-h-0 place-items-center">

        <div className="flex items-center gap-2 text-xs text-[#94a0b0]">

          <LoaderCircle
            size={16}
            className="animate-spin text-[#3d92ff]"
          />

          Chargement de Korana…

        </div>

      </div>
    );
  }


  if (
    korana.error &&
    !korana.data
  ) {

    return (
      <div className="h-full min-h-0 overflow-y-auto">

        <div className="mx-auto max-w-xl p-5">

          <div className="border border-[#ff1638]/30 bg-[#ff1638]/[0.065] p-4 shadow-[inset_3px_0_0_#ff1638]">

            <strong className="text-xs font-bold text-red-200">
              Impossible de charger Korana
            </strong>

            <p className="mt-2 text-[11px] leading-5 text-red-200/75">
              {korana.error}
            </p>

            <button
              type="button"
              onClick={() =>
                void korana.refresh()
              }
              className="mt-3 inline-flex h-8 items-center gap-2 border border-[#ff1638]/35 bg-[#ff1638]/[0.08] px-3 text-[10px] font-bold text-red-100 transition hover:bg-[#ff1638]/[0.14]"
            >
              <RefreshCw size={13} />
              Réessayer
            </button>

          </div>

        </div>

      </div>
    );
  }


  const data =
    korana.data;


  if (!data) {

    return null;
  }


  const controlledActorIds =
    new Set(
      data.myActors.map(
        (actor) =>
          actor.id,
      ),
    );


  const currentActorId =
    data.currentActor?.id ??
    null;


  return (
    <div className="korana-home-grid mx-auto grid h-full min-h-0 w-full grid-cols-1 overflow-hidden xl:grid-cols-[minmax(0,760px)_320px] xl:justify-center">

      {/* =====================================================
          FEED
      ===================================================== */}

      <section className="korana-feed-scroll min-h-0 min-w-0 overflow-x-hidden overflow-y-auto xl:border-r xl:border-[#303947]">

        {/* ===================================================
            FEED HEADER
        =================================================== */}

        <header className="korana-feed-header sticky top-0 z-40 border-b">

          <div className="korana-feed-toolbar flex min-h-14 items-center justify-between gap-3 px-4 sm:px-5">

            <div className="korana-feed-heading min-w-0">

              <h1 className="truncate text-lg font-black tracking-[-0.025em] text-white">
                Accueil
              </h1>

              <p className="korana-feed-kicker mt-0.5 text-[8px] font-bold uppercase tracking-[0.16em] text-[#94a0b0]">
                Feed Korana
              </p>

            </div>


            <div className="korana-feed-identity w-[min(200px,58vw)] shrink-0 sm:w-[200px]">

              <KoranaActorSwitcher
                actors={
                  data.myActors
                }
                activeActorId={
                  korana.activeActorId
                }
                onSelect={
                  korana.selectActor
                }
              />

            </div>

          </div>


          <div className="korana-feed-tabs grid h-10 grid-cols-2 border-t border-[#303947]/70">

            <button
              type="button"
              onClick={
                korana.showForYou
              }
              className={[
                "relative",
                "text-[10px]",
                "transition",
                korana.mode ===
                  "for_you"
                  ? "bg-white/[0.025] font-bold text-white"
                  : "font-semibold text-[#94a0b0] hover:bg-[#3d92ff]/[0.055] hover:text-white",
              ].join(" ")}
            >
              Pour vous

              {korana.mode ===
              "for_you" ? (
                <span className="absolute inset-x-[32%] bottom-0 h-[2px] bg-[#ff1638] shadow-[0_0_12px_rgba(255,22,56,0.55)]" />
              ) : null}

            </button>


            <button
              type="button"
              onClick={
                korana.showFollowing
              }
              className={[
                "relative",
                "text-[10px]",
                "transition",
                korana.mode ===
                  "following"
                  ? "bg-white/[0.025] font-bold text-white"
                  : "font-semibold text-[#94a0b0] hover:bg-[#3d92ff]/[0.055] hover:text-white",
              ].join(" ")}
            >
              Abonnements

              {korana.mode ===
              "following" ? (
                <span className="absolute inset-x-[32%] bottom-0 h-[2px] bg-[#ff1638] shadow-[0_0_12px_rgba(255,22,56,0.55)]" />
              ) : null}

            </button>

          </div>

        </header>


        {/* ===================================================
            STREAM
        =================================================== */}

        <div className="korana-stream">

          {data.currentActor ? (

            <KoranaComposer
              actor={
                data.currentActor
              }
              onPublished={
                korana.refresh
              }
            />

          ) : (

            <section className="border-b border-[#303947]/70 px-4 py-4">

              <div className="border border-[#465264]/55 bg-[#1a212b] p-4 shadow-[inset_3px_0_0_rgba(61,146,255,0.7)]">

                <strong className="text-xs text-[#e1e6ec]">
                  Consultation publique
                </strong>

                <p className="mt-1 text-[11px] leading-5 text-[#9da8b7]">
                  Connecte-toi à Indesy pour publier, suivre des profils et personnaliser ton Feed.
                </p>

              </div>

            </section>

          )}


          {korana.loading ? (

            <div className="flex h-9 items-center justify-center gap-2 border-b border-[#303947]/60 bg-[#121820] text-[9px] text-[#94a0b0]">

              <LoaderCircle
                size={11}
                className="animate-spin text-[#3d92ff]"
              />

              Actualisation du Feed…

            </div>

          ) : null}


          {data.feed.length >
          0 ? (

            <div className="korana-feed-list">

              {data.feed.map(
                (item) => (

                  <KoranaFeedActivityCard
                    key={
                      item.feedEntryId
                    }
                    item={
                      item
                    }
                    canManage={
                      controlledActorIds.has(
                        item.author.id,
                      )
                    }
                    currentActorId={
                      currentActorId
                    }
                    onChanged={
                      korana.refresh
                    }
                  />

                ),
              )}

            </div>

          ) : (

            <div className="korana-feed-empty grid min-h-[320px] place-items-center px-6 py-12">

              <div className="max-w-xs text-center">

                <div className="mx-auto grid h-12 w-12 place-items-center border border-[#465264]/65 bg-[#1c2430] text-[#64a8ff] shadow-[0_0_28px_rgba(61,146,255,0.09)]">

                  <UsersRound
                    size={21}
                  />

                </div>


                <h2 className="mt-4 text-base font-black leading-tight tracking-[-0.02em] text-[#e4e9ef]">

                  {korana.mode ===
                  "following"
                    ? "Aucune publication dans vos abonnements"
                    : "Korana attend ses premières publications"}

                </h2>


                <p className="mt-2 text-[11px] leading-5 text-[#94a0b0]">

                  {korana.mode ===
                  "following"
                    ? "Suis des profils, combattants, clubs ou organisations pour construire ton Feed Abonnements."
                    : "Publie un message depuis le Composer Korana."}

                </p>

              </div>

            </div>

          )}

        </div>

      </section>


      {/* =====================================================
          RIGHT SIDEBAR
      ===================================================== */}

      <KoranaRightSidebar
        suggestions={
          data.suggestions
        }
        trending={
          data.trendingHashtags
        }
        currentActorId={
          currentActorId
        }
        onChanged={
          korana.refresh
        }
      />

    </div>
  );
}
