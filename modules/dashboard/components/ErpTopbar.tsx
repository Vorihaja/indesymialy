"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Command,
  Menu,
  MessageSquareText,
  Radio,
  Search,
  ShieldCheck,
} from "lucide-react";

import {
  Breadcrumb,
  Dialog,
  IconButton,
  ThemeToggle,
} from "@/components/ui";

import AuthTopBar from "@/components/navigation/AuthTopBar";
import GlobalSearchBar from "@/components/navigation/GlobalSearchBar";
import TopbarNotifications from "@/components/navigation/topbar-notifications";

import {
  getWorkspaceDefinition,
  resolveWorkspaceRole,
} from "@/modules/platform-workspaces/config";

import { useDashboardContext } from "../hooks";

export function ErpTopbar() {
  const pathname =
    usePathname();

  const role =
    resolveWorkspaceRole(pathname);

  const workspace = role
    ? getWorkspaceDefinition(role)
    : null;

  const {
    sidebarOpen,
    toggleSidebar,
  } = useDashboardContext();

  const [searchOpen, setSearchOpen] =
    useState(false);

  useEffect(() => {
    const shortcut = (
      event: KeyboardEvent,
    ) => {
      if (
        (event.metaKey ||
          event.ctrlKey) &&
        event.key.toLowerCase() ===
          "k"
      ) {
        event.preventDefault();
        setSearchOpen(true);
      }
    };

    document.addEventListener(
      "keydown",
      shortcut,
    );

    return () =>
      document.removeEventListener(
        "keydown",
        shortcut,
      );
  }, []);

  const messages =
    workspace?.navigation.find(
      (item) =>
        item.section ===
        "messages",
    )?.href || "/messages";

  const live =
    workspace?.navigation.find(
      (item) =>
        item.section ===
        "fight-live",
    )?.href;

  return (
    <>
      <header
        className="
          erp-topbar
          !h-16
          border-b
          border-[var(--ds-border)]
          bg-[color-mix(in_srgb,var(--ds-bg)_90%,transparent)]
          backdrop-blur-2xl
        "
      >
        <div className="erp-topbar-inner">
          {/* LEFT */}
          <div className="erp-topbar-left">
            <IconButton
              className="public-mobile-button"
              variant="ghost"
              aria-label="Ouvrir le menu"
              aria-expanded={
                sidebarOpen
              }
              onClick={
                toggleSidebar
              }
            >
              <Menu size={19} />
            </IconButton>

            <div className="hidden min-w-[150px] border-r border-[var(--ds-border)] pr-5 md:block">
              <span className="block text-[7px] font-black uppercase tracking-[0.2em] text-[var(--ds-primary)]">
                Centre de contrôle
              </span>

              <strong className="mt-1 block truncate text-[11px] font-black uppercase tracking-[0.05em] text-[var(--ds-text)]">
                {workspace?.label ??
                  "Indesy Mialy"}
              </strong>
            </div>

            <div className="hidden lg:block">
              <Breadcrumb />
            </div>
          </div>

          {/* CENTER SEARCH */}
          <button
            type="button"
            className="
              erp-topbar-search
              group
              hidden
              min-h-10
              items-center
              gap-3
              border
              border-[var(--ds-border)]
              bg-[var(--ds-surface)]
              px-4
              text-[10px]
              font-bold
              text-[var(--ds-muted)]
              transition
              hover:border-[color-mix(in_srgb,var(--ds-primary)_40%,var(--ds-border))]
              hover:text-[var(--ds-text)]
              xl:flex
            "
            onClick={() =>
              setSearchOpen(true)
            }
            aria-haspopup="dialog"
          >
            <Search
              size={15}
              className="text-[var(--ds-primary)]"
            />

            <span className="flex-1 text-left">
              Rechercher dans Indesy Mialy
            </span>

            <kbd className="flex items-center gap-1 border border-[var(--ds-border)] bg-[var(--ds-bg)] px-2 py-1 text-[8px] font-black uppercase tracking-wider">
              <Command size={10} />
              K
            </kbd>
          </button>

          {/* ACTIONS */}
          <div className="erp-topbar-actions">
            {/* STATUS */}
            <div className="optional-mobile hidden items-center gap-2 border border-[var(--ds-border)] px-3 py-2 xl:flex">
              <ShieldCheck
                size={13}
                className="text-emerald-500"
              />

              <div className="leading-none">
                <span className="block text-[7px] font-black uppercase tracking-[0.14em] text-[var(--ds-muted)]">
                  Système
                </span>

                <strong className="mt-1 block text-[8px] font-black uppercase tracking-[0.1em] text-emerald-500">
                  Opérationnel
                </strong>
              </div>
            </div>

            {live && (
              <Link
                className="
                  optional-mobile
                  relative
                  flex
                  min-h-9
                  items-center
                  gap-2
                  overflow-hidden
                  border
                  border-[color-mix(in_srgb,var(--ds-primary)_42%,var(--ds-border))]
                  bg-[color-mix(in_srgb,var(--ds-primary)_8%,transparent)]
                  px-3
                  text-[9px]
                  font-black
                  uppercase
                  tracking-[0.12em]
                  text-[var(--ds-primary)]
                  transition
                  hover:bg-[var(--ds-primary)]
                  hover:text-white
                "
                href={live}
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--ds-primary)] opacity-40" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--ds-primary)]" />
                </span>

                <Radio
                  size={15}
                  aria-hidden="true"
                />

                <span className="topbar-role">
                  Combat en direct
                </span>
              </Link>
            )}

            <IconButton
              variant="ghost"
              aria-label="Recherche"
              onClick={() =>
                setSearchOpen(true)
              }
            >
              <Search size={17} />
            </IconButton>

            <Link
              className="ds-button ds-ghost ds-icon-button"
              href={messages}
              aria-label="Messages"
            >
              <MessageSquareText
                size={17}
              />
            </Link>

            <TopbarNotifications />

            <ThemeToggle compact />

            <AuthTopBar />
          </div>
        </div>

        {/* SIGNAL LINE */}
        <div
          className="absolute inset-x-0 bottom-[-1px] h-[2px] bg-gradient-to-r from-[var(--ds-primary)] via-transparent to-[var(--ds-secondary)] opacity-60"
          aria-hidden="true"
        />
      </header>

      <Dialog
        open={searchOpen}
        onClose={() =>
          setSearchOpen(false)
        }
        title="Recherche globale"
      >
        <GlobalSearchBar />
      </Dialog>
    </>
  );
}
