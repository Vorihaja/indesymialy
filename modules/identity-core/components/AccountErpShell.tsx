"use client";

import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

import Link from "next/link";

import {
  usePathname,
} from "next/navigation";

import {
  Bell,
  Building2,
  Eye,
  FileCheck2,
  History,
  LayoutDashboard,
  LifeBuoy,
  LockKeyhole,
  Menu,
  MonitorSmartphone,
  PanelLeftClose,
  PanelLeftOpen,
  Settings2,
  UserRound,
  UsersRound,
  type LucideIcon,
} from "lucide-react";


type AccountNavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};


type AccountNavigationGroup = {
  label: string;
  items: readonly AccountNavigationItem[];
};


const ACCOUNT_NAVIGATION:
  readonly AccountNavigationGroup[] = [

    {
      label: "Mon compte",

      items: [
        {
          label: "Vue d’ensemble",
          href: "/account",
          icon: LayoutDashboard,
        },
        {
          label: "Profil",
          href: "/account/profile",
          icon: UserRound,
        },
        {
          label: "Rôles",
          href: "/account/roles",
          icon: UsersRound,
        },
        {
          label: "Organisations",
          href: "/account/organizations",
          icon: Building2,
        },
      ],
    },

    {
      label: "Sécurité & confidentialité",

      items: [
        {
          label: "Sécurité",
          href: "/account/security",
          icon: LockKeyhole,
        },
        {
          label: "Confidentialité",
          href: "/account/privacy",
          icon: Eye,
        },
        {
          label: "Sessions",
          href: "/account/sessions",
          icon: MonitorSmartphone,
        },
      ],
    },

    {
      label: "Préférences",

      items: [
        {
          label: "Préférences",
          href: "/account/preferences",
          icon: Settings2,
        },
        {
          label: "Notifications",
          href: "/account/notifications",
          icon: Bell,
        },
      ],
    },

    {
      label: "Assistance & données",

      items: [
        {
          label: "Support",
          href: "/account/support",
          icon: LifeBuoy,
        },
        {
          label: "Consentements",
          href: "/account/consents",
          icon: FileCheck2,
        },
        {
          label: "Activité",
          href: "/account/activity",
          icon: History,
        },
      ],
    },

  ];


function isCurrentRoute(
  pathname: string,
  href: string,
) {

  if (
    href === "/account"
  ) {
    return (
      pathname === "/account"
    );
  }


  return (
    pathname === href ||
    pathname.startsWith(
      `${href}/`,
    )
  );
}


export function AccountErpShell({
  children,
}: {
  children: ReactNode;
}) {

  const pathname =
    usePathname();


  const [
    collapsed,
    setCollapsed,
  ] =
    useState(false);


  const [
    mobileOpen,
    setMobileOpen,
  ] =
    useState(false);


  useEffect(
    () => {

      setMobileOpen(
        false,
      );

    },
    [
      pathname,
    ],
  );


  return (

    <section
      className="account-erp-shell"
      aria-label="Gestion du compte Indesy"
    >

      {/* ===================================================
          BOUTON MENU MOBILE
      =================================================== */}

      <button
        type="button"
        onClick={
          () =>
            setMobileOpen(
              true,
            )
        }
        className="account-erp-mobile-trigger"
        aria-label="Ouvrir la navigation du compte"
        aria-expanded={
          mobileOpen
        }
      >
        <Menu
          size={17}
        />
      </button>


      {/* ===================================================
          SIDEBAR
      =================================================== */}

      <aside
        className="account-erp-sidebar"
        data-open={
          mobileOpen
        }
        data-collapsed={
          collapsed
        }
        aria-label="Navigation du compte"
      >

        {/* =================================================
            TITRE SIDEBAR + BOUTON COMPACTER
        ================================================= */}

        <div className="account-erp-sidebar-head">

          <div className="account-erp-sidebar-symbol">

            <UserRound
              size={16}
            />

          </div>


          <div className="account-erp-sidebar-identity account-erp-collapsible-label">

            <span>
              Espace personnel
            </span>

            <strong>
              Mon compte
            </strong>

          </div>


          <button
            type="button"
            onClick={
              () =>
                setCollapsed(
                  (value) =>
                    !value,
                )
            }
            className="account-erp-sidebar-collapse"
            aria-label={
              collapsed
                ? "Déployer la sidebar"
                : "Compacter la sidebar"
            }
            title={
              collapsed
                ? "Déployer la sidebar"
                : "Compacter la sidebar"
            }
          >

            {collapsed ? (

              <PanelLeftOpen
                size={16}
              />

            ) : (

              <PanelLeftClose
                size={16}
              />

            )}

          </button>

        </div>


        {/* =================================================
            NAVIGATION SCROLLABLE
        ================================================= */}

        <div className="account-erp-sidebar-scroll">

          <nav
            aria-label="Sections du compte"
          >

            {ACCOUNT_NAVIGATION.map(
              (
                group,
                groupIndex,
              ) => (

                <section
                  key={
                    group.label
                  }
                  className={
                    groupIndex > 0
                      ? "account-erp-nav-group account-erp-nav-group-separated"
                      : "account-erp-nav-group"
                  }
                >

                  <p className="account-erp-nav-group-label account-erp-collapsible-label">
                    {group.label}
                  </p>


                  <div className="account-erp-nav-items">

                    {group.items.map(
                      (
                        {
                          label,
                          href,
                          icon: Icon,
                        },
                      ) => {

                        const active =
                          isCurrentRoute(
                            pathname,
                            href,
                          );


                        return (

                          <Link
                            key={href}
                            href={href}
                            onClick={
                              () =>
                                setMobileOpen(
                                  false,
                                )
                            }
                            aria-current={
                              active
                                ? "page"
                                : undefined
                            }
                            title={
                              collapsed
                                ? label
                                : undefined
                            }
                            className={
                              active
                                ? "account-erp-nav-link account-erp-nav-link-active"
                                : "account-erp-nav-link"
                            }
                          >

                            <Icon
                              size={17}
                              className="account-erp-nav-icon"
                              aria-hidden="true"
                            />


                            <span className="account-erp-nav-label account-erp-collapsible-label">
                              {label}
                            </span>


                            {active ? (

                              <span
                                className="account-erp-nav-active-dot account-erp-collapsible-label"
                                aria-hidden="true"
                              />

                            ) : null}

                          </Link>

                        );

                      },
                    )}

                  </div>

                </section>

              ),
            )}

          </nav>

        </div>


        {/* =================================================
            BAS SIDEBAR
        ================================================= */}

        <div className="account-erp-sidebar-bottom">

          <Link
            href="/"
            className="account-erp-return-link"
            title="Retour à Indesy Mialy"
          >

            <span className="account-erp-return-symbol">
              ←
            </span>

            <span className="account-erp-collapsible-label">
              Retour à Indesy Mialy
            </span>

          </Link>

        </div>

      </aside>


      {/* ===================================================
          BACKDROP MOBILE
      =================================================== */}

      {mobileOpen ? (

        <button
          type="button"
          className="account-erp-backdrop"
          onClick={
            () =>
              setMobileOpen(
                false,
              )
          }
          aria-label="Fermer la navigation du compte"
        />

      ) : null}


      {/* ===================================================
          WORKSPACE
      =================================================== */}

      <div
        className="account-erp-workspace"
        data-collapsed={
          collapsed
        }
        role="main"
      >

        <div className="account-erp-workspace-inner">

          <div className="account-erp-content">
            {children}
          </div>

        </div>

      </div>

    </section>

  );
}