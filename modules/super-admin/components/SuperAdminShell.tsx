"use client";

import Link from "next/link";

import {
  usePathname,
} from "next/navigation";

import {
  Activity,
  BarChart3,
  Building2,
  ChartNoAxesCombined,
  Database,
  Globe2,
  KeyRound,
  LogOut,
  MessagesSquare,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Target,
  Trophy,
  UserCog,
  Users,
  WalletCards,
} from "lucide-react";

import {
  useLogout,
} from "@/modules/auth/hooks";

import {
  SuperAdminPeriodProvider,
  useSuperAdminPeriod,
} from "../context/super-admin-period-context";

import type {
  AnalyticsPeriodDays,
} from "../types";

const analyticsNavigation = [

  {
    label:
      "Vue d’ensemble",

    href:
      "/vh-teck",

    icon:
      BarChart3,
  },

  {
    label:
      "Croissance",

    href:
      "/vh-teck/growth",

    icon:
      ChartNoAxesCombined,
  },

  {
    label:
      "Utilisateurs",

    href:
      "/vh-teck/users",

    icon:
      Users,
  },

  {
    label:
      "Sport",

    href:
      "/vh-teck/sport",

    icon:
      Trophy,
  },

  {
    label:
      "Business",

    href:
      "/vh-teck/business",

    icon:
      WalletCards,
  },

  {
    label:
      "Marketplace",

    href:
      "/vh-teck/marketplace",

    icon:
      ShoppingBag,
  },

  {
    label:
      "Community",

    href:
      "/vh-teck/community",

    icon:
      MessagesSquare,
  },

  {
    label:
      "Organisations",

    href:
      "/vh-teck/organizations",

    icon:
      Building2,
  },

  {
    label:
      "Géographie",

    href:
      "/vh-teck/geography",

    icon:
      Globe2,
  },

  {
    label:
      "Performance",

    href:
      "/vh-teck/performance",

    icon:
      Target,
  },

  {
    label:
      "Système",

    href:
      "/vh-teck/system",

    icon:
      Database,
  },
];

const governanceNavigation = [

  {
    label:
      "Administrateurs",

    href:
      "/vh-teck/administrators",

    icon:
      UserCog,
  },

  {
    label:
      "Permissions",

    href:
      "/vh-teck/permissions",

    icon:
      KeyRound,
  },

  {
    label:
      "Access Logs",

    href:
      "/vh-teck/access-logs",

    icon:
      Activity,
  },
];


function NavigationItem({
  label,
  href,
  Icon,
}: {
  label: string;
  href: string;
  Icon: typeof BarChart3;
}) {

  const pathname =
    usePathname();

  const active =
    href === "/vh-teck"
      ? pathname === href
      : pathname === href ||
        pathname.startsWith(
          `${href}/`,
        );

  return (
    <Link
      href={href}
      className={[
        "flex items-center gap-3 border-l-2 px-4 py-2.5 text-xs font-semibold transition",

        active
          ? "border-[#2588ff] bg-[#171a20] text-white"
          : "border-transparent text-zinc-500 hover:bg-[#14161b] hover:text-zinc-200",

      ].join(" ")}
    >

      <Icon
        size={16}
        className={
          active
            ? "text-[#2588ff]"
            : ""
        }
      />

      {label}

    </Link>
  );
}


function SuperAdminTopbar() {

  const {
    days,
    setDays,
    refresh,
  } =
    useSuperAdminPeriod();

  const {
    logout,
  } =
    useLogout();

  return (
    <header className="sticky top-0 z-30 flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-[#272a31] bg-[#090a0d]/95 px-5 py-3 backdrop-blur">

      <div>

        <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#2588ff]">
          Indesy Control Center
        </p>

        <p className="mt-0.5 text-xs text-zinc-600">
          Données Supabase en production
        </p>

      </div>


      <div className="flex flex-wrap items-center gap-2">

        <select
          value={days}
          onChange={
            (event) =>
              setDays(
                Number(
                  event.target.value,
                ) as AnalyticsPeriodDays,
              )
          }
          className="h-9 border border-[#30343c] bg-[#111318] px-3 text-xs text-zinc-300 outline-none focus:border-[#2588ff]"
          aria-label="Période Analytics"
        >

          <option value={7}>
            7 derniers jours
          </option>

          <option value={30}>
            30 derniers jours
          </option>

          <option value={90}>
            90 derniers jours
          </option>

          <option value={365}>
            12 derniers mois
          </option>

        </select>


        <button
          type="button"
          onClick={refresh}
          className="inline-flex h-9 items-center gap-2 border border-[#30343c] px-3 text-xs font-semibold text-zinc-300 hover:border-[#2588ff] hover:text-white"
        >

          <RefreshCw
            size={14}
          />

          Actualiser

        </button>


        <div className="hidden h-6 w-px bg-[#30343c] sm:block" />


        <div className="flex h-9 items-center gap-2 border border-[#30343c] bg-[#111318] px-3">

          <ShieldCheck
            size={15}
            className="text-emerald-400"
          />

          <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-300">
            Super Admin
          </span>

        </div>


        <button
          type="button"
          onClick={
            () =>
              logout()
          }
          className="flex h-9 w-9 items-center justify-center border border-[#30343c] text-zinc-500 hover:border-red-500/50 hover:text-red-400"
          aria-label="Déconnexion"
        >

          <LogOut
            size={15}
          />

        </button>

      </div>

    </header>
  );
}


function ShellContent({
  children,
}: {
  children:
    React.ReactNode;
}) {

  return (
    <div className="flex min-h-screen bg-[#090a0d] text-white">

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[250px] overflow-y-auto border-r border-[#272a31] bg-[#0c0d10] lg:block">

        <div className="border-b border-[#272a31] px-5 py-5">

          <div className="flex items-center gap-3">

            <div className="flex h-9 w-9 items-center justify-center border border-[#2588ff]/50 bg-[#2588ff]/10">

              <ShieldCheck
                size={18}
                className="text-[#2588ff]"
              />

            </div>

            <div>

              <p className="text-sm font-black tracking-[0.12em] text-white">
                INDESY
              </p>

              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-600">
                Control Center
              </p>

            </div>

          </div>

        </div>


        <nav className="py-5">

          <p className="px-5 pb-2 text-[9px] font-black uppercase tracking-[0.18em] text-zinc-700">
            Analytics
          </p>


          {analyticsNavigation.map(
            (item) => (

              <NavigationItem
                key={
                  item.href
                }
                label={
                  item.label
                }
                href={
                  item.href
                }
                Icon={
                  item.icon
                }
              />

            ),
          )}


          <div className="mx-5 my-5 h-px bg-[#272a31]" />


          <p className="px-5 pb-2 text-[9px] font-black uppercase tracking-[0.18em] text-zinc-700">
            Gouvernance
          </p>


          {governanceNavigation.map(
            (item) => (

              <NavigationItem
                key={
                  item.href
                }
                label={
                  item.label
                }
                href={
                  item.href
                }
                Icon={
                  item.icon
                }
              />

            ),
          )}

        </nav>

      </aside>


      <div className="min-w-0 flex-1 lg:ml-[250px]">

        <SuperAdminTopbar />

        <main className="mx-auto w-full max-w-[1800px] p-4 sm:p-6 xl:p-8">

          {children}

        </main>

      </div>

    </div>
  );
}


export function SuperAdminShell({
  children,
}: {
  children:
    React.ReactNode;
}) {

  return (
    <SuperAdminPeriodProvider>

      <ShellContent>

        {children}

      </ShellContent>

    </SuperAdminPeriodProvider>
  );
}
