"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  Briefcase,
  Check,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Plus,
  Settings,
  Shield,
  UserRound,
} from "lucide-react";

import {
  Avatar,
  Button,
} from "@/components/ui";

import {
  getWorkspaceDashboardPath,
  getWorkspaceLabel,
} from "@/modules/workspace-registry";

import {
  useRoleRequest,
} from "@/providers/roles/RoleRequestContext";

import {
  useAuth,
  useLogout,
  useRole,
} from "@/modules/auth";

import {
  getOfficialModuleIdFromPath,
  isOfficialAccountRole,
  isOfficialModuleVisible,
  OFFICIAL_FUNCTION_OPTIONS,
  useOfficialFunction,
} from "@/modules/officials/function-context";


interface WorkspaceOption {
  slug: string;

  label: string;

  kind:
    | "business"
    | "system";
}


function getPublicRoleLabel(slug: string, fallback: string) {
  const normalized = slug.trim().toLocaleLowerCase("fr");
  const labels: Record<string, string> = {
    coach: "Coach",
    entraineur: "Coach",
    "entraîneur": "Coach",
    fighter: "Combattant",
    combattant: "Combattant",
    referee: "Officiel",
    arbitre: "Officiel",
    official: "Officiel",
    officiel: "Officiel",
    seller: "Vendeur",
    vendeur: "Vendeur",
    organizer: "Organisateur",
    organisateur: "Organisateur",
    federation: "Fédération",
    ligue: "Ligue",
    club: "Club",
    sponsor: "Sponsor",
    fan: "Fan",
  };

  return labels[normalized] ?? fallback;
}


function pathMatchesWorkspace(
  pathname: string,
  roleSlug: string,
) {

  const dashboardPath =
    getWorkspaceDashboardPath(
      roleSlug,
    );


  if (
    !dashboardPath ||
    dashboardPath === "/dashboard"
  ) {

    return false;
  }


  return (
    pathname === dashboardPath ||
    pathname.startsWith(
      `${dashboardPath}/`,
    )
  );
}


export default function AuthTopBar() {

  const [
    openPath,
    setOpenPath,
  ] =
    useState<string | null>(null);


  const ref =
    useRef<HTMLDivElement>(
      null,
    );


  const router =
    useRouter();


  const pathname =
    usePathname();


  const open =
    openPath === pathname;


  const {
    user,
    profile,
  } =
    useAuth();


  const {
    roles,
    systemRoles,
  } =
    useRole();


  const {
    logout,
  } =
    useLogout();


  const {
    openModal,
  } =
    useRoleRequest();


  const {
    officialFunction,
    setOfficialFunction,
  } =
    useOfficialFunction();


  // =========================================================
  // BUSINESS WORKSPACES
  // =========================================================

  const businessOptions =
    useMemo<WorkspaceOption[]>(
      () => {
        const canonicalOptions =
          new Map<string, WorkspaceOption>();

        for (const role of roles) {
          const slug =
            isOfficialAccountRole(
              role.slug,
            )
              ? "official"
              : role.slug;

          if (canonicalOptions.has(slug)) {
            continue;
          }

          canonicalOptions.set(
            slug,
            {
              slug,
              label:
                getPublicRoleLabel(
                  slug,
                  getWorkspaceLabel(slug) ??
                    role.label ??
                    slug,
                ),
              kind: "business",
            },
          );
        }

        return [
          ...canonicalOptions.values(),
        ];
      },
      [
        roles,
      ],
    );


  // =========================================================
  // SYSTEM WORKSPACES
  // =========================================================

  const systemOptions =
    useMemo<WorkspaceOption[]>(
      () =>
        systemRoles.map(
          (role) => ({
            slug:
              role.code,

            label:
              getWorkspaceLabel(
                role.code,
              ) ??
              role.label ??
              role.code,

            kind:
              "system",
          }),
        ),
      [
        systemRoles,
      ],
    );


  const options =
    useMemo(
      () => [
        ...businessOptions,
        ...systemOptions,
      ],
      [
        businessOptions,
        systemOptions,
      ],
    );


  // =========================================================
  // ACTIVE WORKSPACE
  //
  // L'URL reste la source de vérité.
  // =========================================================

  const active =
    useMemo(
      () => {

        const matched =
          options
            .filter(
              (option) =>
                pathMatchesWorkspace(
                  pathname,
                  option.slug,
                ),
            )
            .sort(
              (
                left,
                right,
              ) => {

                const leftPath =
                  getWorkspaceDashboardPath(
                    left.slug,
                  );


                const rightPath =
                  getWorkspaceDashboardPath(
                    right.slug,
                  );


                return (
                  rightPath.length -
                  leftPath.length
                );
              },
            )[0];


        if (
          matched
        ) {

          return matched;
        }


        return (
          businessOptions[0] ??
          systemOptions[0]
        );

      },
      [
        businessOptions,
        options,
        pathname,
        systemOptions,
      ],
    );


  // =========================================================
  // CLOSE MENU
  // =========================================================

  useEffect(() => {

    const pointer = (
      event: MouseEvent,
    ) => {

      if (
        ref.current &&
        !ref.current.contains(
          event.target as Node,
        )
      ) {

        setOpenPath(null);
      }
    };


    const key = (
      event: KeyboardEvent,
    ) => {

      if (
        event.key === "Escape"
      ) {

        setOpenPath(null);
      }
    };


    document.addEventListener(
      "mousedown",
      pointer,
    );


    document.addEventListener(
      "keydown",
      key,
    );


    return () => {

      document.removeEventListener(
        "mousedown",
        pointer,
      );


      document.removeEventListener(
        "keydown",
        key,
      );
    };

  }, []);



  // =========================================================
  // GUEST
  // =========================================================

  if (
    !user
  ) {

    return (
      <Button
        onClick={() =>
          router.push(
            "/auth",
          )
        }
        size="sm"
      >
        Connexion
      </Button>
    );
  }


  const email =
    user.email ??
    "";


  const name =
    email
      .split("@")[0] ||
    "Compte";


  const initials =
    name
      .replace(
        /[^a-zA-Z0-9]/g,
        "",
      )
      .slice(
        0,
        2,
      )
      .toUpperCase() ||
    "IM";


  const activeLabel =
    active
      ? getPublicRoleLabel(
          active.slug,
          active.label,
        )
      : "Membre";

  const activeOfficialFunctionLabel =
    OFFICIAL_FUNCTION_OPTIONS.find(
      (option) =>
        option.value ===
        officialFunction,
    )?.label ??
    officialFunction;

  const isOfficialWorkspace =
    active?.kind === "business" &&
    active.slug === "official";

  const displayName =
    profile?.fullName?.trim() ||
    name;


  const photoUrl =
    profile?.photoUrl?.trim() ||
    undefined;


  const displayInitials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(
        (part: string) =>
          part
            .charAt(0)
            .toUpperCase(),
      )
      .join("") ||
    initials;


  // =========================================================
  // NAVIGATION
  // =========================================================

  function openWorkspace(
    slug: string,
  ) {

    setOpenPath(null);


    router.push(
      getWorkspaceDashboardPath(
        slug,
      ),
    );
  }


  const signOut =
    async () => {

      setOpenPath(null);


      await logout();


      router.push(
        "/auth",
      );


      router.refresh();
    };


  // =========================================================
  // UI
  // =========================================================

  const menuItemClass =
    "flex min-h-9 w-full items-center gap-2.5 px-2.5 text-left text-[10px] font-semibold text-zinc-400 transition hover:bg-white/[0.045] hover:text-zinc-100";


  const sectionLabelClass =
    "px-2.5 pb-1 pt-2 text-[7px] font-black uppercase tracking-[0.16em] text-zinc-700";


  return (
    <div
      ref={
        ref
      }
      className="relative"
    >

      {/* =====================================================
          TOPBAR TRIGGER
      ===================================================== */}

      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={
          open
        }
        onClick={() =>
          setOpenPath(
            open ? null : pathname,
          )
        }
        className={[
          "group",
          "flex",
          "h-9",
          "items-center",
          "gap-2",
          "border",
          "px-2",
          "transition",
          open
            ? "border-white/[0.14] bg-white/[0.055]"
            : "border-transparent hover:border-white/[0.08] hover:bg-white/[0.03]",
        ].join(" ")}
      >

        <Avatar
          size="sm"
          src={photoUrl}
          alt={displayName}
          fallback={displayInitials}
          className="shrink-0"
        />


        {/* AUTH-TOPBAR-ACTIVE-ROLE-TAG */}
        <span className="hidden min-w-0 flex-col items-start sm:flex">

          <span className="max-w-[138px] truncate text-[10px] font-black leading-none text-zinc-200">
            {displayName}
          </span>

          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={`${active?.slug ?? "member"}-${isOfficialWorkspace ? activeOfficialFunctionLabel : "default"}`}
              className="public-account-role-tag mt-1 inline-flex max-w-[138px] truncate px-1.5 py-[2px] text-[7px] font-black uppercase leading-none tracking-[0.10em]"
              title={
                isOfficialWorkspace
                  ? `${activeLabel} - ${activeOfficialFunctionLabel}`
                  : activeLabel
              }
              initial={{ opacity: 0, y: 3, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -2, scale: 0.98 }}
              transition={{ duration: 0.18 }}
            >
              {activeLabel}
              {isOfficialWorkspace
                ? ` - ${activeOfficialFunctionLabel}`
                : ""}
            </motion.span>
          </AnimatePresence>

        </span>


        <ChevronDown
          size={13}
          className={[
            "text-zinc-600",
            "transition-transform",
            open
              ? "rotate-180"
              : "",
          ].join(" ")}
        />

      </button>


      {/* =====================================================
          MINIMAL ACCOUNT MENU
      ===================================================== */}

      {open ? (

        <div
          role="menu"
          className="
            absolute
            right-0
            top-[calc(100%+7px)]
            z-[300]
            w-[248px]
            overflow-hidden
            border
            border-white/[0.09]
            bg-[#0b0d11]/[0.98]
            shadow-[0_22px_65px_rgba(0,0,0,0.58)]
            backdrop-blur-xl
          "
        >

          {/* =================================================
              ACCOUNT ACTIONS
          ================================================= */}

          <div className="p-1.5">

            {active ? (

              <Link
                role="menuitem"
                href={
                  getWorkspaceDashboardPath(
                    active.slug,
                  )
                }
                onClick={() =>
                  setOpenPath(null)
                }
                className={
                  menuItemClass
                }
              >

                <LayoutDashboard
                  size={13}
                  className="text-zinc-600"
                />

                <span className="flex-1">
                  Mon espace
                </span>

              </Link>

            ) : null}


            <Link
              role="menuitem"
              href="/account"
              onClick={() =>
                setOpenPath(null)
              }
              className={
                menuItemClass
              }
            >

              <UserRound
                size={13}
                className="text-zinc-600"
              />

              <span className="flex-1">
                Mon compte
              </span>

            </Link>


            <Link
              role="menuitem"
              href="/account/preferences"
              onClick={() =>
                setOpenPath(null)
              }
              className={
                menuItemClass
              }
            >

              <Settings
                size={13}
                className="text-zinc-600"
              />

              <span className="flex-1">
                Paramètres
              </span>

            </Link>

          </div>


          {/* =================================================
              BUSINESS WORKSPACES
          ================================================= */}

          {businessOptions.length >
          0 ? (

            <div className="border-t border-white/[0.06] px-1.5 pb-1.5">

              <div className={
                sectionLabelClass
              }>
                Espaces
              </div>


              {businessOptions.map(
                (role) => {

                  const selected =
                    active?.slug ===
                      role.slug &&
                    active?.kind ===
                      "business";


                  return (
                    <button
                      key={
                        role.slug
                      }
                      type="button"
                      role="menuitem"
                      onClick={() =>
                        openWorkspace(
                          role.slug,
                        )
                      }
                      className={[
                        menuItemClass,
                        selected
                          ? "bg-[#2588ff]/[0.055] text-zinc-100"
                          : "",
                      ].join(" ")}
                    >

                      <Briefcase
                        size={12}
                        className={
                          selected
                            ? "text-[#4b9cff]"
                            : "text-zinc-700"
                        }
                      />


                      <span className="min-w-0 flex-1 truncate">
                        {role.label}
                      </span>


                      {selected ? (

                        <Check
                          size={12}
                          className="text-[#4b9cff]"
                        />

                      ) : null}

                    </button>
                  );
                },
              )}

            </div>

          ) : null}


          {isOfficialWorkspace ? (
            <div className="border-t border-white/[0.06] px-1.5 pb-1.5">
              <div className={
                sectionLabelClass
              }>
                Fonction
              </div>

              {OFFICIAL_FUNCTION_OPTIONS.map(
                (option) => {
                  const selected =
                    option.value ===
                    officialFunction;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="menuitemradio"
                      aria-checked={selected}
                      onClick={() => {
                        setOfficialFunction(
                          option.value,
                        );

                        const moduleId =
                          getOfficialModuleIdFromPath(
                            pathname,
                          );

                        if (
                          moduleId &&
                          !isOfficialModuleVisible(
                            option.value,
                            moduleId,
                          )
                        ) {
                          router.replace(
                            "/dashboard/officiel",
                          );
                        }

                        setOpenPath(null);
                      }}
                      className={[
                        menuItemClass,
                        selected
                          ? "bg-[#2588ff]/[0.055] text-zinc-100"
                          : "",
                      ].join(" ")}
                    >
                      <UserRound
                        size={12}
                        className={
                          selected
                            ? "text-[#4b9cff]"
                            : "text-zinc-700"
                        }
                      />

                      <span className="min-w-0 flex-1 truncate">
                        {option.label}
                      </span>

                      {selected ? (
                        <Check
                          size={12}
                          className="text-[#4b9cff]"
                        />
                      ) : null}
                    </button>
                  );
                },
              )}
            </div>
          ) : null}


          {/* =================================================
              SYSTEM ACCESS
          ================================================= */}

          {systemOptions.length >
          0 ? (

            <div className="border-t border-white/[0.06] px-1.5 pb-1.5">

              <div className={
                sectionLabelClass
              }>
                Système
              </div>


              {systemOptions.map(
                (role) => {

                  const selected =
                    active?.slug ===
                      role.slug &&
                    active?.kind ===
                      "system";


                  return (
                    <button
                      key={
                        role.slug
                      }
                      type="button"
                      role="menuitem"
                      onClick={() =>
                        openWorkspace(
                          role.slug,
                        )
                      }
                      className={[
                        menuItemClass,
                        selected
                          ? "bg-[#ff1638]/[0.055] text-zinc-100"
                          : "",
                      ].join(" ")}
                    >

                      <Shield
                        size={12}
                        className={
                          selected
                            ? "text-[#ff4058]"
                            : "text-zinc-700"
                        }
                      />


                      <span className="min-w-0 flex-1 truncate">
                        {role.label}
                      </span>


                      {selected ? (

                        <Check
                          size={12}
                          className="text-[#ff4058]"
                        />

                      ) : null}

                    </button>
                  );
                },
              )}

            </div>

          ) : null}


          {/* =================================================
              ROLE REQUEST
          ================================================= */}

          <div className="border-t border-white/[0.06] p-1.5">

            <button
              role="menuitem"
              type="button"
              onClick={() => {

                setOpenPath(null);


                openModal();
              }}
              className={
                menuItemClass
              }
            >

              <Plus
                size={13}
                className="text-zinc-600"
              />

              <span className="flex-1">
                Ajouter ou demander un rôle
              </span>

            </button>

          </div>


          {/* =================================================
              LOGOUT
          ================================================= */}

          <div className="border-t border-white/[0.06] bg-black/20 p-1.5">

            <button
              role="menuitem"
              type="button"
              onClick={() =>
                void signOut()
              }
              className="
                flex
                min-h-9
                w-full
                items-center
                gap-2.5
                px-2.5
                text-left
                text-[10px]
                font-semibold
                text-zinc-600
                transition
                hover:bg-[#ff1638]/[0.06]
                hover:text-[#ff4058]
              "
            >

              <LogOut
                size={13}
              />

              <span>
                Déconnexion
              </span>

            </button>

          </div>

        </div>

      ) : null}

    </div>
  );
}
