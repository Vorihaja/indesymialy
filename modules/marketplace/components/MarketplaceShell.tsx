"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Heart,
  History,
  PackageSearch,
  Search,
  ShoppingBag,
  Store,
} from "lucide-react";

const marketplaceLinks = [
  {
    href: "/marketplace",
    label: "Catalogue",
    icon: Store,
    isActive: (pathname: string) =>
      pathname === "/marketplace" ||
      pathname.startsWith("/marketplace/category/") ||
      pathname.startsWith("/marketplace/search") ||
      pathname.startsWith("/marketplace/products/"),
  },
  {
    href: "/marketplace/favorites",
    label: "Favoris",
    icon: Heart,
    isActive: (pathname: string) =>
      pathname.startsWith("/marketplace/favorites"),
  },
  {
    href: "/marketplace/cart",
    label: "Panier",
    icon: ShoppingBag,
    isActive: (pathname: string) =>
      pathname.startsWith("/marketplace/cart") ||
      pathname.startsWith("/marketplace/checkout"),
  },
  {
    href: "/marketplace/orders",
    label: "Commandes",
    icon: History,
    isActive: (pathname: string) =>
      pathname.startsWith("/marketplace/orders"),
  },
  {
    href: "/marketplace/rentals",
    label: "Locations",
    icon: PackageSearch,
    isActive: (pathname: string) =>
      pathname.startsWith("/marketplace/rentals"),
  },
] as const;

export function MarketplaceShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-[#090a0c] dark:text-zinc-100">
      <section
        data-marketplace-secondary-nav="true"
        className="sticky top-[var(--platform-header-height)] z-[calc(var(--ds-z-header)-1)] border-b border-zinc-200/90 bg-white/95 backdrop-blur dark:border-[#282b31] dark:bg-[#0d0f12]/95"
      >
        <div className="mx-auto flex max-w-[1500px] flex-col gap-2 px-3 py-2 sm:px-5 lg:flex-row lg:items-center">
          <div className="flex min-w-max items-center gap-3 lg:pr-3">
            <Link
              href="/marketplace"
              className="flex items-center gap-2"
            >
              <span className="grid size-8 place-items-center border border-[#ad1d2e] bg-[#c82335] text-white">
                <Store size={15} />
              </span>

              <span>
                <strong className="block text-[12px] leading-4">
                  Indesy Bazar
                </strong>

                <small className="block text-[7px] font-semibold uppercase tracking-[0.13em] text-zinc-500">
                  Marketplace Indesy
                </small>
              </span>
            </Link>
          </div>

          <form
            action="/marketplace/search"
            method="get"
            className="flex h-9 min-w-0 flex-1 items-center border border-zinc-300 bg-zinc-50 focus-within:border-[#c82335] dark:border-[#303238] dark:bg-[#111214]"
          >
            <Search
              size={13}
              className="mx-2 shrink-0 text-zinc-500"
            />

            <input
              name="q"
              type="search"
              aria-label="Rechercher dans Indesy Bazar"
              placeholder="Rechercher un équipement, un article ou une offre…"
              className="min-w-0 flex-1 bg-transparent px-1 text-[10px] outline-none placeholder:text-zinc-500"
            />

            <button
              type="submit"
              className="h-full border-l border-zinc-300 px-3 text-[8px] font-bold uppercase tracking-[0.08em] transition hover:bg-zinc-100 dark:border-[#303238] dark:hover:bg-[#191b1f]"
            >
              Rechercher
            </button>
          </form>

          <nav
            aria-label="Navigation Indesy Bazar"
            className="flex min-w-0 overflow-x-auto border border-zinc-200 bg-zinc-50 dark:border-[#282b31] dark:bg-[#0c0d0f]"
          >
            {marketplaceLinks.map((item) => {
              const Icon = item.icon;
              const active = item.isActive(pathname);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "flex h-9 flex-none items-center gap-1.5 border-r px-3 text-[8px] font-semibold transition",
                    "border-zinc-200 last:border-r-0 dark:border-[#282b31]",
                    active
                      ? "bg-[#c82335] text-white"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-[#17191d] dark:hover:text-white",
                  ].join(" ")}
                >
                  <Icon size={12} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </section>

      {children}
    </div>
  );
}
