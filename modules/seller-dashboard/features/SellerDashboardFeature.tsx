"use client";

import {
  ArrowRight,
  LoaderCircle,
  Package,
  ShoppingCart,
  UsersRound,
  WalletCards,
  Warehouse,
} from "lucide-react";
import Link from "next/link";

import { SellerStats } from "../components/SellerStats";
import { useSellerDashboard } from "../hooks";

type SellerDashboardView = "dashboard" | "revenue" | "customers";

type SellerDashboardFeatureProps = {
  view?: SellerDashboardView;
};

const shortcuts = [
  {
    label: "Produits",
    detail: "Catalogue et disponibilités",
    href: "/dashboard/vendeur/products",
    icon: Package,
  },
  {
    label: "Commandes",
    detail: "Préparation et suivi",
    href: "/dashboard/vendeur/orders",
    icon: ShoppingCart,
  },
  {
    label: "Stock",
    detail: "Inventaire et alertes",
    href: "/dashboard/vendeur/inventory",
    icon: Warehouse,
  },
  {
    label: "Revenus",
    detail: "Synthèse financière",
    href: "/dashboard/vendeur/revenue",
    icon: WalletCards,
  },
] as const;

function SellerPageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header className="border border-[#303238] bg-[#151619] p-4">
      <span className="text-[8px] font-bold uppercase tracking-[0.14em] text-[#3d92ff]">
        {eyebrow}
      </span>
      <h1 className="mt-1 text-[15px] font-semibold text-zinc-100">
        {title}
      </h1>
      <p className="mt-1 max-w-3xl text-[11px] leading-5 text-zinc-400">
        {description}
      </p>
    </header>
  );
}

export function SellerDashboardFeature({
  view = "dashboard",
}: SellerDashboardFeatureProps) {
  const data = useSellerDashboard();

  if (data.loading) {
    return (
      <section
        className="grid min-h-52 place-items-center border border-[#303238] bg-[#151619]"
        aria-label="Chargement du tableau de bord vendeur"
      >
        <span className="flex items-center gap-2 text-[11px] text-zinc-400">
          <LoaderCircle
            size={15}
            className="animate-spin text-[#087cff]"
            aria-hidden="true"
          />
          Chargement des statistiques vendeur…
        </span>
      </section>
    );
  }

  if (view === "customers") {
    return (
      <div className="grid gap-3">
        <SellerPageHeader
          eyebrow="Relations commerciales"
          title="Clients"
          description="Suivez les commandes et la valeur cumulée de chaque client de la boutique."
        />

        <section className="border border-[#303238] bg-[#151619]">
          <header className="flex min-h-12 items-center gap-3 border-b border-[#303238] px-3 py-2">
            <UsersRound size={15} className="text-[#3d92ff]" aria-hidden="true" />
            <div>
              <h2 className="text-[11px] font-semibold text-zinc-100">
                Répertoire clients
              </h2>
              <p className="text-[9px] text-zinc-500">
                {data.customers.length} client(s)
              </p>
            </div>
          </header>

          <div className="divide-y divide-[#292c31]">
            {data.customers.map((item) => (
              <article
                key={item.id}
                className="grid gap-2 px-3 py-3 text-[10px] sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto] sm:items-center"
              >
                <strong className="truncate text-zinc-200">{item.name}</strong>
                <span className="truncate text-zinc-500">{item.email}</span>
                <span className="text-zinc-400">
                  {item.orders} commande(s)
                </span>
                <span className="font-semibold text-zinc-200">
                  {item.totalSpent.toLocaleString("fr-FR")} Ar
                </span>
              </article>
            ))}

            {!data.customers.length && (
              <p className="px-3 py-10 text-center text-[10px] text-zinc-500">
                Aucun client.
              </p>
            )}
          </div>
        </section>
      </div>
    );
  }

  if (view === "revenue") {
    return (
      <div className="grid gap-3">
        <SellerPageHeader
          eyebrow="Pilotage financier"
          title="Revenus vendeur"
          description="Consultez les performances commerciales et le revenu provisoire de la boutique."
        />

        <SellerStats statistics={data.statistics} />

        <section className="border border-[#303238] bg-[#151619] p-4">
          <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-500">
            Revenu total provisoire
          </span>
          <strong className="mt-2 block text-[22px] font-semibold tracking-[-0.03em] text-zinc-100">
            {data.statistics.revenue.toLocaleString("fr-FR")} Ar
          </strong>
          <p className="mt-1 text-[10px] text-zinc-500">
            Montant consolidé à partir des ventes actuellement enregistrées.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <SellerPageHeader
        eyebrow="Espace vendeur"
        title="Marketplace vendeur"
        description="Ventes, locations, commandes, stock et revenus réunis dans votre espace opérationnel."
      />

      <SellerStats statistics={data.statistics} />

      <section className="border border-[#303238] bg-[#151619]">
        <header className="border-b border-[#303238] px-3 py-2">
          <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-500">
            Accès rapides
          </span>
          <h2 className="mt-0.5 text-[11px] font-semibold text-zinc-100">
            Opérations de la boutique
          </h2>
        </header>

        <div className="grid gap-px bg-[#292c31] sm:grid-cols-2 xl:grid-cols-4">
          {shortcuts.map(({ label, detail, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="group flex min-h-20 items-center gap-3 bg-[#111214] px-3 py-3 transition-colors hover:bg-[#17191d]"
            >
              <span className="grid h-8 w-8 flex-none place-items-center border border-[#343840] text-[#3d92ff] group-hover:border-[#087cff]">
                <Icon size={15} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block text-[10px] font-semibold text-zinc-200">
                  {label}
                </strong>
                <span className="mt-0.5 block truncate text-[9px] text-zinc-500">
                  {detail}
                </span>
              </span>
              <ArrowRight
                size={13}
                className="text-zinc-600 group-hover:text-[#3d92ff]"
                aria-hidden="true"
              />
            </Link>
          ))}
        </div>
      </section>

      <section className="border border-[#303238] bg-[#151619]">
        <header className="border-b border-[#303238] px-3 py-2">
          <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-500">
            Catalogue
          </span>
          <h2 className="mt-0.5 text-[11px] font-semibold text-zinc-100">
            Produits récents
          </h2>
        </header>

        <div className="divide-y divide-[#292c31]">
          {data.statistics.recentProducts.map((item) => (
            <p key={item.id} className="px-3 py-3 text-[10px] text-zinc-300">
              {item.title}
            </p>
          ))}

          {!data.statistics.recentProducts.length && (
            <p className="px-3 py-10 text-center text-[10px] text-zinc-500">
              Aucun produit récent.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
