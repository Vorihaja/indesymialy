"use client";

import {
  useEffect,
  useState,
} from "react";

import type {
  ReactNode,
} from "react";

import Link from "next/link";

import {
  usePathname,
} from "next/navigation";

import type {
  LucideIcon,
} from "lucide-react";

import {
  ArrowLeft,
  Bell,
  Bookmark,
  Home,
  MessageCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  UserRound,
} from "lucide-react";

import Navbar from "@/components/navigation/Navbar";

import GlobalSearchBar from "@/components/navigation/GlobalSearchBar";


interface KoranaNavigationItem {
  label: string;
  href: string;
  icon: LucideIcon;
}


const KORANA_SIDEBAR_STORAGE_KEY =
  "indesy:korana-sidebar-collapsed";


const primaryNavigation:
  readonly KoranaNavigationItem[] = [
    {
      label: "Accueil",
      href: "/korana",
      icon: Home,
    },
    {
      label: "Enregistrés",
      href: "/korana/enregistres",
      icon: Bookmark,
    },
    {
      label: "Notifications",
      href: "/notifications",
      icon: Bell,
    },
    {
      label: "Messages",
      href: "/korana/messages",
      icon: MessageCircle,
    },
  ];


const futureNavigation:
  readonly KoranaNavigationItem[] = [
    {
      label: "Explorer",
      href: "/korana",
      icon: Search,
    },
    {
      label: "Profil",
      href: "/korana",
      icon: UserRound,
    },
  ];


function KoranaMark({
  size = 24,
}: {
  size?: number;
}) {

  return (
    <svg
      width={
        size
      }
      height={
        size
      }
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="shrink-0 overflow-visible"
    >

      <rect
        x="2.75"
        y="2.75"
        width="18.5"
        height="18.5"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.35"
        opacity="0.9"
      />


      <path
        d="M7.7 7.15V16.85"
        stroke="currentColor"
        strokeWidth="2.15"
        strokeLinecap="round"
      />


      <path
        d="M8.05 12L14.55 7.2"
        stroke="currentColor"
        strokeWidth="2.15"
        strokeLinecap="round"
        strokeLinejoin="round"
      />


      <path
        d="M8.05 12L14.8 16.8"
        stroke="currentColor"
        strokeWidth="2.15"
        strokeLinecap="round"
        strokeLinejoin="round"
      />


      <path
        d="M17.55 7.05V10.15"
        stroke="#ff1638"
        strokeWidth="2.25"
        strokeLinecap="round"
      />


      <circle
        cx="17.55"
        cy="14.85"
        r="1.15"
        fill="#ff1638"
      />

    </svg>
  );
}


function isCurrentRoute(
  pathname: string,
  href: string,
) {

  if (
    href === "/korana"
  ) {

    return pathname ===
      "/korana";
  }


  return (
    pathname === href ||
    pathname.startsWith(
      `${href}/`,
    )
  );
}


export function KoranaShell({
  children,
}: {
  children: ReactNode;
}) {

  const pathname =
    usePathname();


  const [
    showSearch,
    setShowSearch,
  ] =
    useState(false);


  const [
    sidebarCollapsed,
    setSidebarCollapsed,
  ] =
    useState(false);


  /*
   * Restaure l'état de la sidebar uniquement côté navigateur.
   *
   * Le premier rendu reste identique serveur/client,
   * puis l'état mémorisé est appliqué après hydratation.
   */
  useEffect(
    () => {

      try {

        const stored =
          window.localStorage.getItem(
            KORANA_SIDEBAR_STORAGE_KEY,
          );


        setSidebarCollapsed(
          stored === "1",
        );

      } catch {

        /*
         * L'interface reste fonctionnelle même si
         * localStorage n'est pas disponible.
         */
      }

    },
    [],
  );


  /*
   * Le document global ne scrolle pas lorsque Korana est ouvert.
   *
   * Le feed, la sidebar et les futurs workspaces
   * possèdent leurs propres zones de scroll.
   */
  useEffect(
    () => {

      const html =
        document.documentElement;

      const body =
        document.body;


      const previousHtmlOverflow =
        html.style.overflow;

      const previousBodyOverflow =
        body.style.overflow;

      const previousHtmlOverflowY =
        html.style.overflowY;

      const previousBodyOverflowY =
        body.style.overflowY;

      const previousHtmlOverscroll =
        html.style.overscrollBehavior;

      const previousBodyOverscroll =
        body.style.overscrollBehavior;


      html.style.overflow =
        "hidden";

      html.style.overflowY =
        "hidden";

      html.style.overscrollBehavior =
        "none";


      body.style.overflow =
        "hidden";

      body.style.overflowY =
        "hidden";

      body.style.overscrollBehavior =
        "none";


      return () => {

        html.style.overflow =
          previousHtmlOverflow;

        html.style.overflowY =
          previousHtmlOverflowY;

        html.style.overscrollBehavior =
          previousHtmlOverscroll;


        body.style.overflow =
          previousBodyOverflow;

        body.style.overflowY =
          previousBodyOverflowY;

        body.style.overscrollBehavior =
          previousBodyOverscroll;
      };

    },
    [],
  );


  useEffect(
    () => {

      function closeSearch(
        event: KeyboardEvent,
      ) {

        if (
          event.key === "Escape"
        ) {

          setShowSearch(
            false,
          );
        }
      }


      document.addEventListener(
        "keydown",
        closeSearch,
      );


      return () => {

        document.removeEventListener(
          "keydown",
          closeSearch,
        );
      };

    },
    [],
  );


  function toggleSidebar() {

    const next =
      !sidebarCollapsed;


    setSidebarCollapsed(
      next,
    );


    try {

      window.localStorage.setItem(
        KORANA_SIDEBAR_STORAGE_KEY,
        next
          ? "1"
          : "0",
      );

    } catch {

      /*
       * La persistance est une amélioration UX,
       * pas une dépendance fonctionnelle.
       */
    }
  }


  return (
    <div className="korana-theme flex h-dvh min-h-0 flex-col overflow-hidden">

      {/* =====================================================
          TOPBAR PRINCIPALE INDESY MIALY
      ===================================================== */}

      <div className="relative z-[120] flex-none border-b border-[#303947] bg-[var(--ds-bg)]">

        <Navbar
          onToggleSearch={() =>
            setShowSearch(
              (value) =>
                !value,
            )
          }
          showSearch={
            showSearch
          }
        />


        {showSearch ? (

          <div className="public-search-row">
            <GlobalSearchBar />
          </div>

        ) : null}

      </div>


      {/* =====================================================
          WORKSPACE KORANA
      ===================================================== */}

      <div
        className={[
          "korana-workspace",
          "mx-auto",
          "grid",
          "min-h-0",
          "w-full",
          "max-w-[1360px]",
          "flex-1",
          "grid-cols-1",
          "overflow-hidden",
          sidebarCollapsed
            ? "lg:grid-cols-[68px_minmax(0,1fr)]"
            : "lg:grid-cols-[208px_minmax(0,1fr)]",
        ].join(" ")}
      >

        {/* ===================================================
            LEFT SIDEBAR

            Le workspace global ne scrolle pas.
            Cette zone possède son propre overflow-y-auto.
        =================================================== */}

        <aside className="korana-left-sidebar hidden h-full min-h-0 overflow-hidden lg:block">

          <div
            className={[
              "korana-left-scroll",
              "h-full",
              "min-h-0",
              "overflow-x-hidden",
              "overflow-y-auto",
              "py-4",
              sidebarCollapsed
                ? "px-2"
                : "px-3",
            ].join(" ")}
          >

            {/* ===============================================
                MARQUE + COMPACTAGE
            =============================================== */}

            <div
              className={[
                "mb-3",
                "flex",
                "h-8",
                "items-center",
                "gap-2",
                sidebarCollapsed
                  ? "justify-between"
                  : "justify-between px-1",
              ].join(" ")}
            >

              <Link
                href="/korana"
                className="flex min-w-0 items-center gap-2 text-[#dfe5ec] transition hover:text-white"
                title="Indesy Korana"
              >

                <KoranaMark
                  size={
                    sidebarCollapsed
                      ? 25
                      : 23
                  }
                />


                {!sidebarCollapsed ? (

                  <span className="truncate text-[9px] font-black uppercase tracking-[0.16em]">
                    Korana
                  </span>

                ) : null}

              </Link>


              <button
                type="button"
                onClick={
                  toggleSidebar
                }
                className="grid h-6 w-6 shrink-0 place-items-center border border-[#465264]/65 text-[#8793a3] transition hover:border-[#ff1638]/55 hover:bg-[#ff1638]/[0.08] hover:text-[#ff4058]"
                aria-label={
                  sidebarCollapsed
                    ? "Déployer la barre Korana"
                    : "Compacter la barre Korana"
                }
                aria-expanded={
                  !sidebarCollapsed
                }
                title={
                  sidebarCollapsed
                    ? "Déployer"
                    : "Compacter"
                }
              >

                {sidebarCollapsed ? (

                  <PanelLeftOpen
                    size={14}
                    aria-hidden="true"
                  />

                ) : (

                  <PanelLeftClose
                    size={14}
                    aria-hidden="true"
                  />

                )}

              </button>

            </div>


            {/* ===============================================
                NAVIGATION PRINCIPALE
            =============================================== */}

            <nav
              className="space-y-1"
              aria-label="Navigation Indesy Korana"
            >

              {primaryNavigation.map(
                ({
                  label,
                  href,
                  icon: Icon,
                }) => {

                  const active =
                    isCurrentRoute(
                      pathname,
                      href,
                    );


                  return (
                    <Link
                      key={
                        label
                      }
                      href={
                        href
                      }
                      title={
                        sidebarCollapsed
                          ? label
                          : undefined
                      }
                      aria-label={
                        sidebarCollapsed
                          ? label
                          : undefined
                      }
                      aria-current={
                        active
                          ? "page"
                          : undefined
                      }
                      className={[
                        "korana-nav-item",
                        active
                          ? "korana-nav-item--active"
                          : "",
                        "relative",
                        "flex",
                        "h-10",
                        "items-center",
                        "text-[11px]",
                        "font-semibold",
                        "transition",
                        sidebarCollapsed
                          ? "justify-center px-0"
                          : "gap-3 px-2.5",
                        active
                          ? "text-white"
                          : "text-[#aab5c3]",
                      ].join(" ")}
                    >

                      {active ? (

                        <span
                          aria-hidden="true"
                          className="absolute bottom-2 left-0 top-2 w-[2px] bg-[#ff1638] shadow-[0_0_10px_rgba(255,22,56,0.55)]"
                        />

                      ) : null}


                      <Icon
                        size={16}
                        className={[
                          "shrink-0",
                          active
                            ? "text-[#ff4058]"
                            : "text-[#8997a9]",
                        ].join(" ")}
                        aria-hidden="true"
                      />


                      {!sidebarCollapsed ? (

                        <span className="truncate">
                          {label}
                        </span>

                      ) : null}

                    </Link>
                  );
                },
              )}

            </nav>


            <div className="my-4 h-px bg-[#303947]" />


            {/* ===============================================
                FUTURES FONCTIONS
            =============================================== */}

            {!sidebarCollapsed ? (

              <p className="mb-2 px-2 text-[7px] font-black uppercase tracking-[0.18em] text-[#7f8b9b]">
                Bientôt
              </p>

            ) : null}


            <div className="space-y-0.5">

              {futureNavigation.map(
                ({
                  label,
                  icon: Icon,
                }) => (

                  <div
                    key={
                      label
                    }
                    className={[
                      "flex",
                      "h-9",
                      "cursor-default",
                      "items-center",
                      "text-[10px]",
                      "font-semibold",
                      "text-[#697585]",
                      sidebarCollapsed
                        ? "justify-center px-0"
                        : "gap-3 px-2.5",
                    ].join(" ")}
                    title={
                      sidebarCollapsed
                        ? `${label} — bientôt disponible`
                        : "Disponible dans un prochain lot Korana"
                    }
                    aria-disabled="true"
                  >

                    <Icon
                      size={15}
                      className="shrink-0"
                      aria-hidden="true"
                    />


                    {!sidebarCollapsed ? (

                      <span className="truncate">
                        {label}
                      </span>

                    ) : null}

                  </div>

                ),
              )}

            </div>


            {/* ===============================================
                RETOUR ECOSYSTEME
            =============================================== */}

            <div className="mt-5 border-t border-[#303947] pt-3">

              <Link
                href="/"
                className={[
                  "flex",
                  "h-9",
                  "items-center",
                  "text-[9px]",
                  "font-semibold",
                  "text-[#94a0b0]",
                  "transition",
                  "hover:text-[#64a8ff]",
                  sidebarCollapsed
                    ? "justify-center px-0"
                    : "gap-2 px-2",
                ].join(" ")}
                title={
                  sidebarCollapsed
                    ? "Écosystème Indesy"
                    : undefined
                }
                aria-label={
                  sidebarCollapsed
                    ? "Écosystème Indesy"
                    : undefined
                }
              >

                <ArrowLeft
                  size={14}
                  className="shrink-0"
                  aria-hidden="true"
                />


                {!sidebarCollapsed ? (

                  <span>
                    Écosystème Indesy
                  </span>

                ) : null}

              </Link>

            </div>

          </div>

        </aside>


        {/* ===================================================
            CONTENT

            Toutes les routes /korana/* sont rendues ici.
            La sidebar et la topbar restent donc montées.
        =================================================== */}

        <main className="korana-workspace-content min-h-0 min-w-0 overflow-hidden">
          {children}
        </main>

      </div>
    </div>
  );
}
