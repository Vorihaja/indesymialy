"use client";

import Link from "next/link";
import {
  usePathname,
  useRouter,
} from "next/navigation";

import type {
  LucideIcon,
} from "lucide-react";

import {
  Bell,
  ChevronLeft,
  ChevronRight,
  CircleGauge,
  LogOut,
  MessageSquare,
  Radio,
  Settings,
  X,
} from "lucide-react";

import {
  ErpStatus,
  IconButton,
  Loader,
} from "@/components/ui";

import {
  useLogout,
} from "@/modules/auth";

import {
  getWorkspaceDefinition,
  resolveWorkspaceRole,
} from "@/modules/platform-workspaces/config";

import {
  NotificationUnreadBadge,
} from "@/modules/communication-core/features/CommunicationFeatures";

import {
  useDashboardContext,
} from "../hooks";

export function ErpSidebar() {
  const pathname =
    usePathname();

  const router =
    useRouter();

  const role =
    resolveWorkspaceRole(pathname);

  const workspace = role
    ? getWorkspaceDefinition(role)
    : null;

  const { logout } =
    useLogout();

  const {
    sidebarOpen,
    sidebarCollapsed,
    setSidebarOpen,
    toggleCollapsed,
  } = useDashboardContext();

  const close = () =>
    setSidebarOpen(false);

  const active = (
    href: string,
  ) =>
    pathname === href ||
    pathname.startsWith(
      `${href}/`,
    );

  const find = (
    section: string,
  ) =>
    workspace?.navigation.find(
      (item) =>
        item.section === section,
    )?.href;

  const dashboardHref =
    workspace?.basePath ??
    "/dashboard";

  const signOut =
    async () => {
      await logout();

      router.push("/auth");
      router.refresh();
    };

  const navItem = ({
    href,
    label,
    icon: Icon,
    badge,
    live,
  }: {
    href: string;
    label: string;
    icon: LucideIcon;
    badge?: boolean;
    live?: boolean;
  }) => {
    const selected =
      active(href);

    return (
      <Link
        href={href}
        onClick={close}
        title={
          sidebarCollapsed
            ? label
            : undefined
        }
        aria-current={
          selected
            ? "page"
            : undefined
        }
        className={`group relative flex min-h-9 items-center gap-2.5 border border-transparent px-3 text-[11px] font-semibold transition-colors ${
          selected
            ? "bg-[var(--ds-hover)] text-[var(--erp-text)]"
            : "text-[var(--erp-muted)] hover:bg-[var(--ds-hover)] hover:text-[var(--erp-text)]"
        } ${
          sidebarCollapsed
            ? "justify-center"
            : ""
        }`}
      >
        <Icon
          size={15}
          className={
            selected || live
              ? "text-[var(--erp-sport)]"
              : "text-[var(--erp-muted)]"
          }
          aria-hidden="true"
        />

        {!sidebarCollapsed && (
          <>
            <span className="min-w-0 flex-1 truncate">
              {label}
            </span>

            {badge && (
              <NotificationUnreadBadge />
            )}
          </>
        )}
      </Link>
    );
  };

  const messagesHref =
    find("messages");

  const notificationsHref =
    find("notifications");

  const settingsHref =
    find("settings");

  const liveHref =
    find("fight-live");

  return (
    <>
      <aside
        className="erp-sidebar"
        data-open={sidebarOpen}
        data-collapsed={
          sidebarCollapsed
        }
        data-role={
          role ?? undefined
        }
      >
        <div className="flex min-h-[54px] flex-none items-center border-b border-[var(--erp-border)] px-3">
          {workspace ? (
            sidebarCollapsed ? (
              <ErpStatus
                tone="success"
                aria-label="Opérationnel"
              />
            ) : (
              <div className="min-w-0">
                <span className="block text-[8px] font-bold uppercase tracking-[0.14em] text-[var(--erp-muted)]">
                  Espace
                </span>

                <strong className="mt-0.5 block truncate text-[12px] font-bold uppercase tracking-[0.03em] text-[var(--erp-text)]">
                  {workspace.label}
                </strong>
              </div>
            )
          ) : (
            <Loader label="Chargement" />
          )}

          <IconButton
            className="public-mobile-button ml-auto"
            variant="ghost"
            aria-label="Fermer le menu"
            onClick={close}
          >
            <X size={16} />
          </IconButton>
        </div>

        <div className="erp-sidebar-scroll flex min-h-0 flex-1 flex-col">
          {!sidebarCollapsed && (
            <div className="flex min-h-8 flex-none items-center border-b border-[var(--erp-border)] px-3">
              <ErpStatus tone="success">
                Opérationnel
              </ErpStatus>
            </div>
          )}

          <nav
            className="grid flex-none gap-px py-2"
            aria-label={`Navigation ${
              workspace?.label ??
              "ERP"
            }`}
          >
            {navItem({
              href: dashboardHref,
              label: "Vue d’ensemble",
              icon: CircleGauge,
            })}
          </nav>

          {!sidebarCollapsed &&
            workspace && (
              <div className="flex-none border-y border-[var(--erp-border)] bg-[var(--erp-panel-muted)] px-3 py-2.5">
                <span className="block text-[8px] font-bold uppercase tracking-[0.12em] text-[var(--erp-muted)]">
                  Contexte métier
                </span>

                <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-[var(--erp-text-secondary)]">
                  {
                    workspace.description
                  }
                </p>
              </div>
            )}

          <nav
            className="grid flex-none gap-px py-2"
            aria-label="Accès contextuels"
          >
            {messagesHref &&
              navItem({
                href: messagesHref,
                label: "Messages",
                icon: MessageSquare,
                badge: true,
              })}

            {notificationsHref &&
              navItem({
                href:
                  notificationsHref,
                label: "Alertes",
                icon: Bell,
              })}

            {liveHref &&
              navItem({
                href: liveHref,
                label:
                  "Poste de contrôle",
                icon: Radio,
                live: true,
              })}

            {settingsHref &&
              navItem({
                href: settingsHref,
                label: "Paramètres",
                icon: Settings,
              })}
          </nav>
        </div>

        <div className="grid flex-none gap-px border-t border-[var(--erp-border)] py-2">
          <button
            type="button"
            className="flex min-h-9 items-center gap-2.5 px-3 text-[10px] font-semibold text-[var(--erp-muted)] transition-colors hover:bg-[var(--ds-hover)] hover:text-[var(--erp-text)]"
            onClick={
              toggleCollapsed
            }
            title={
              sidebarCollapsed
                ? "Déployer"
                : "Réduire"
            }
          >
            {sidebarCollapsed ? (
              <ChevronRight
                size={15}
                className="mx-auto"
              />
            ) : (
              <>
                <ChevronLeft
                  size={15}
                />
                <span>
                  Réduire
                </span>
              </>
            )}
          </button>

          <button
            type="button"
            className="flex min-h-9 items-center gap-2.5 px-3 text-[10px] font-semibold text-[var(--erp-danger)] transition-colors hover:bg-red-500/10"
            onClick={() =>
              void signOut()
            }
            title="Déconnexion"
          >
            <LogOut
              size={15}
              className={
                sidebarCollapsed
                  ? "mx-auto"
                  : ""
              }
            />

            {!sidebarCollapsed && (
              <span>
                Déconnexion
              </span>
            )}
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          className="erp-sidebar-backdrop"
          aria-label="Fermer le menu"
          onClick={close}
        />
      )}
    </>
  );
}
