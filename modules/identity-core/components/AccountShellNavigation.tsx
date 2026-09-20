"use client";

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
  MonitorSmartphone,
  Settings2,
  ShieldCheck,
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
  items: AccountNavigationItem[];
};


const groups:
  AccountNavigationGroup[] = [
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
          label: "Rôles et accès",
          href: "/account/roles",
          icon: UsersRound,
        },
        {
          label: "Vérification",
          href: "/account/verification",
          icon: FileCheck2,
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


function isCurrentPath(
  pathname: string,
  href: string,
) {

  if (
    href === "/account"
  ) {

    return pathname ===
      "/account";
  }


  return (
    pathname === href ||
    pathname.startsWith(
      `${href}/`,
    )
  );
}


function NavigationLink({
  item,
  pathname,
  mobile = false,
}: {
  item: AccountNavigationItem;
  pathname: string;
  mobile?: boolean;
}) {

  const current =
    isCurrentPath(
      pathname,
      item.href,
    );


  const Icon =
    item.icon;


  return (
    <Link
      href={item.href}
      aria-current={
        current
          ? "page"
          : undefined
      }
      className={[
        "group",
        "flex",
        "min-w-0",
        "items-center",
        "gap-3",
        "border",
        "transition",

        mobile
          ? "min-h-11 px-3 py-2.5"
          : "min-h-10 px-3 py-2",

        current
          ? "border-[#3d92ff]/55 bg-[#3d92ff]/10 text-white"
          : "border-transparent text-zinc-500 hover:border-[#303844] hover:bg-white/[0.025] hover:text-zinc-200",
      ].join(" ")}
    >

      <Icon
        size={15}
        className={
          current
            ? "shrink-0 text-[#6aafff]"
            : "shrink-0 text-zinc-600 transition group-hover:text-zinc-400"
        }
      />


      <span className="min-w-0 flex-1 truncate text-[11px] font-semibold">
        {item.label}
      </span>


      {current ? (
        <span
          aria-hidden="true"
          className="h-1.5 w-1.5 shrink-0 bg-[#3d92ff]"
        />
      ) : null}

    </Link>
  );
}


export function AccountShellNavigation() {

  const pathname =
    usePathname();


  const allItems =
    groups.flatMap(
      (group) =>
        group.items,
    );


  const currentItem =
    allItems.find(
      (item) =>
        isCurrentPath(
          pathname,
          item.href,
        ),
    );


  return (
    <>

      <div className="mb-5 lg:hidden">

        <details className="group border border-[#303238] bg-[#101216]">

          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 px-4 text-[11px] font-semibold text-zinc-200">

            <span className="flex min-w-0 items-center gap-3">

              <ShieldCheck
                size={16}
                className="shrink-0 text-[#3d92ff]"
              />

              <span className="truncate">
                {currentItem?.label ??
                  "Navigation du compte"}
              </span>

            </span>


            <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-zinc-600 group-open:text-[#6aafff]">
              Menu
            </span>

          </summary>


          <nav
            aria-label="Navigation du compte"
            className="border-t border-[#303238] p-3"
          >

            {groups.map(
              (group) => (

                <section
                  key={group.label}
                  className="mb-4 last:mb-0"
                >

                  <p className="mb-1.5 px-2 text-[8px] font-bold uppercase tracking-[0.13em] text-zinc-700">
                    {group.label}
                  </p>


                  <div className="grid gap-1 sm:grid-cols-2">

                    {group.items.map(
                      (item) => (

                        <NavigationLink
                          key={item.href}
                          item={item}
                          pathname={pathname}
                          mobile
                        />

                      ),
                    )}

                  </div>

                </section>

              ),
            )}

          </nav>

        </details>

      </div>


      <aside className="hidden min-w-0 lg:block">

        <div className="border border-[#303238] bg-[#0e1014] p-3">

          <header className="border-b border-[#292c31] px-2 pb-4 pt-1">

            <p className="text-[8px] font-black uppercase tracking-[0.15em] text-[#3d92ff]">
              Espace personnel
            </p>


            <h2 className="mt-1.5 text-[14px] font-semibold text-white">
              Gestion du compte
            </h2>


            <p className="mt-1 text-[9px] leading-4 text-zinc-600">
              Identité, accès, préférences et données personnelles.
            </p>

          </header>


          <nav
            aria-label="Navigation du compte"
            className="pt-3"
          >

            {groups.map(
              (group) => (

                <section
                  key={group.label}
                  className="mb-5 last:mb-0"
                >

                  <p className="mb-1.5 px-2 text-[8px] font-bold uppercase tracking-[0.13em] text-zinc-700">
                    {group.label}
                  </p>


                  <div className="grid gap-0.5">

                    {group.items.map(
                      (item) => (

                        <NavigationLink
                          key={item.href}
                          item={item}
                          pathname={pathname}
                        />

                      ),
                    )}

                  </div>

                </section>

              ),
            )}

          </nav>

        </div>

      </aside>

    </>
  );
}