"use client";

import {
  Bookmark,
  LoaderCircle,
  LockKeyhole,
  RefreshCw,
} from "lucide-react";

import {
  useKoranaSavedPosts,
} from "../hooks/useKoranaSavedPosts";

import {
  KoranaActorSwitcher,
} from "../components/KoranaActorSwitcher";

import {
  KoranaPostCard,
} from "../components/KoranaPostCard";


export function KoranaSavedPostsFeature() {

  const saved =
    useKoranaSavedPosts();


  if (
    saved.loading &&
    !saved.data
  ) {

    return (
      <div className="grid h-full min-h-0 place-items-center">

        <div className="flex items-center gap-2 text-xs text-[#94a0b0]">

          <LoaderCircle
            size={16}
            className="animate-spin text-[#3d92ff]"
          />

          Chargement des Enregistrés…

        </div>

      </div>
    );
  }


  if (
    saved.error &&
    !saved.data
  ) {

    return (
      <div className="h-full min-h-0 overflow-y-auto">

        <div className="mx-auto max-w-xl p-5">

          <div className="border border-[#ff1638]/30 bg-[#ff1638]/[0.065] p-4 shadow-[inset_3px_0_0_#ff1638]">

            <strong className="text-xs font-bold text-red-200">
              Impossible de charger les Enregistrés
            </strong>

            <p className="mt-2 text-[11px] leading-5 text-red-200/75">
              {saved.error}
            </p>

            <button
              type="button"
              onClick={() =>
                void saved.refresh()
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
    saved.data;


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
          SAVED POSTS COLUMN
      ===================================================== */}

      <section className="korana-feed-scroll min-h-0 min-w-0 overflow-x-hidden overflow-y-auto xl:border-r xl:border-[#303947]">

        {/* ===================================================
            HEADER
        =================================================== */}

        <header className="korana-feed-header sticky top-0 z-40 border-b">

          <div className="korana-feed-toolbar flex min-h-[74px] items-center justify-between gap-4 px-4 sm:px-5">

            <div className="korana-feed-heading min-w-0">

              <div className="flex items-center gap-2">

                <Bookmark
                  size={17}
                  className="shrink-0 text-[#64a8ff]"
                  fill="currentColor"
                />


                <h1 className="truncate text-lg font-black tracking-[-0.025em] text-white">
                  Enregistrés
                </h1>

              </div>


              <p className="korana-feed-kicker mt-1 text-[8px] font-bold uppercase tracking-[0.16em] text-[#94a0b0]">
                Bibliothèque privée · {data.total} publication{data.total > 1 ? "s" : ""}
              </p>

            </div>


            <div className="korana-feed-identity w-[min(200px,58vw)] shrink-0 sm:w-[200px]">

              <KoranaActorSwitcher
                actors={
                  data.myActors
                }
                activeActorId={
                  saved.activeActorId
                }
                onSelect={
                  saved.selectActor
                }
              />

            </div>

          </div>

        </header>


        {/* ===================================================
            LOADING REFRESH
        =================================================== */}

        {saved.loading ? (

          <div className="flex h-9 items-center justify-center gap-2 border-b border-[#303947]/60 bg-[#0b0f15] text-[9px] text-[#94a0b0]">

            <LoaderCircle
              size={11}
              className="animate-spin text-[#3d92ff]"
            />

            Actualisation de la bibliothèque…

          </div>

        ) : null}


        {/* ===================================================
            ERROR WHILE DATA EXISTS
        =================================================== */}

        {saved.error ? (

          <div className="border-b border-red-500/15 bg-red-500/[0.04] px-4 py-3 text-[10px] text-red-300 sm:px-6">
            {saved.error}
          </div>

        ) : null}


        {/* ===================================================
            NO IDENTITY
        =================================================== */}

        {!data.currentActor ? (

          <div className="korana-feed-empty grid min-h-[360px] place-items-center px-6 py-12">

            <div className="max-w-sm text-center">

              <div className="mx-auto grid h-12 w-12 place-items-center border border-[#465264]/65 bg-[#0b0f15] text-[#64a8ff]">
                <LockKeyhole size={20} />
              </div>

              <h2 className="mt-4 text-base font-black text-[#eef3f8]">
                Bibliothèque privée
              </h2>

              <p className="mt-2 text-[11px] leading-5 text-[#94a0b0]">
                Connecte-toi avec une identité Indesy pour retrouver les publications que tu as enregistrées.
              </p>

            </div>

          </div>

        ) : data.items.length >
          0 ? (

          <>
            <div className="korana-feed-list">

              {data.items.map(
                (item) => (

                  <KoranaPostCard
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
                      saved.refresh
                    }
                  />

                ),
              )}

            </div>


            {data.pagination.hasMore ? (

              <div className="border-t border-[#303947]/70 px-4 py-5 text-center">

                <button
                  type="button"
                  disabled={
                    saved.loadingMore
                  }
                  onClick={() =>
                    void saved.loadMore()
                  }
                  className="inline-flex h-9 items-center gap-2 border border-[#465264]/70 bg-[#0b0f15] px-5 text-[10px] font-bold text-[#cbd5e1] transition hover:border-[#3d92ff]/35 hover:bg-[#3d92ff]/[0.055] hover:text-white disabled:opacity-40"
                >

                  {saved.loadingMore ? (
                    <LoaderCircle
                      size={13}
                      className="animate-spin text-[#64a8ff]"
                    />
                  ) : null}

                  Charger plus

                </button>

              </div>

            ) : null}

          </>

        ) : (

          <div className="korana-feed-empty grid min-h-[420px] place-items-center px-6 py-14">

            <div className="max-w-sm text-center">

              <div className="mx-auto grid h-14 w-14 place-items-center border border-[#465264]/65 bg-[#0b0f15] text-[#64a8ff] shadow-[0_0_30px_rgba(61,146,255,0.08)]">

                <Bookmark
                  size={23}
                />

              </div>


              <h2 className="mt-5 text-lg font-black leading-tight tracking-[-0.025em] text-[#eef3f8]">
                Aucun Enregistré
              </h2>


              <p className="mt-3 text-[11px] leading-5 text-[#94a0b0]">
                Utilise le signet sous une publication pour la conserver ici et la retrouver facilement plus tard.
              </p>

            </div>

          </div>

        )}

      </section>


      {/* =====================================================
          RIGHT INFORMATION PANEL
      ===================================================== */}

      <aside className="korana-right-sidebar hidden h-full min-h-0 overflow-hidden xl:block">

        <div className="korana-right-scroll h-full min-h-0 overflow-x-hidden overflow-y-auto p-4">

          <section className="korana-side-card">

            <div className="korana-side-card-header border-b px-4 py-3">

              <div className="flex items-center gap-2">

                <LockKeyhole
                  size={14}
                  className="text-[#64a8ff]"
                />

                <h2 className="text-xs font-black text-white">
                  Bibliothèque privée
                </h2>

              </div>

            </div>


            <div className="p-4">

              <p className="text-[10px] leading-5 text-[#a5b0bf]">
                Tes Enregistrés sont liés uniquement à l’identité Korana actuellement sélectionnée.
              </p>


              {data.currentActor ? (

                <div className="mt-4 border border-white/[0.07] bg-white/[0.02] px-3 py-3">

                  <span className="block text-[8px] font-bold uppercase tracking-[0.14em] text-[#778392]">
                    Identité active
                  </span>

                  <strong className="mt-1 block truncate text-[11px] text-[#f3f6fa]">
                    {data.currentActor.displayName}
                  </strong>

                  <span className="mt-0.5 block truncate text-[9px] text-[#8793a3]">
                    @{data.currentActor.handle}
                  </span>

                </div>

              ) : null}


              <div className="mt-4 border-t border-white/[0.06] pt-4">

                <span className="text-[26px] font-black tracking-[-0.04em] text-white">
                  {data.total}
                </span>

                <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#8793a3]">
                  Publications conservées
                </p>

              </div>

            </div>

          </section>

        </div>

      </aside>

    </div>
  );
}
