"use client";

import Link from "next/link";

import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CircleDollarSign,
  Package,
  Plus,
  ShoppingBag,
  ShoppingCart,
  Truck,
  Users,
  WalletCards,
} from "lucide-react";

import { SellerStats } from "../components/SellerStats";
import { useSellerDashboard } from "../hooks";

type SellerDashboardView =
  | "dashboard"
  | "revenue"
  | "customers";

type SellerDashboardFeatureProps = {
  view?: SellerDashboardView;
};

type QuickAction = {
  label: string;
  detail: string;
  href: string;
  icon: typeof Package;
};

const quickActions: QuickAction[] = [
  {
    label: "Catalogue",
    detail: "Produits, prix et disponibilité",
    href: "/dashboard/vendeur/products",
    icon: Package,
  },
  {
    label: "Commandes",
    detail: "Suivre le traitement des commandes",
    href: "/dashboard/vendeur/orders",
    icon: ShoppingCart,
  },
  {
    label: "Stock",
    detail: "Inventaire et niveaux disponibles",
    href: "/dashboard/vendeur/inventory",
    icon: Boxes,
  },
  {
    label: "Finances",
    detail: "Revenus et transactions",
    href: "/dashboard/vendeur/revenue",
    icon: WalletCards,
  },
];

function SellerPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-3 border-b border-[#303238] pb-3 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <span className="text-[8px] font-bold uppercase tracking-[0.16em] text-[#ed1b2f]">
          {eyebrow}
        </span>

        <h1 className="mt-1 text-[21px] font-semibold tracking-[-0.035em] text-zinc-100">
          {title}
        </h1>

        <p className="mt-1 max-w-3xl text-[10px] leading-5 text-zinc-500">
          {description}
        </p>
      </div>

      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      ) : null}
    </header>
  );
}

function SellerLoadingState() {
  return (
    <div className="grid gap-3">
      <div className="h-16 animate-pulse border border-[#303238] bg-[#151619]" />
      <div className="grid grid-cols-2 gap-px bg-[#303238] md:grid-cols-4 xl:grid-cols-7">
        {Array.from({ length: 7 }).map((_, index) => (
          <div
            key={index}
            className="h-[106px] animate-pulse bg-[#151619]"
          />
        ))}
      </div>
      <div className="grid gap-3 xl:grid-cols-[1.25fr_.75fr]">
        <div className="h-64 animate-pulse border border-[#303238] bg-[#151619]" />
        <div className="h-64 animate-pulse border border-[#303238] bg-[#151619]" />
      </div>
    </div>
  );
}

export function SellerDashboardFeature({
  view = "dashboard",
}: SellerDashboardFeatureProps) {
  const data = useSellerDashboard();

  if (data.loading) {
    return <SellerLoadingState />;
  }

  if (view === "customers") {
    const customerRevenue =
      data.customers.reduce(
        (sum, customer) =>
          sum + customer.totalSpent,
        0,
      );

    return (
      <div className="grid gap-3">
        <SellerPageHeader
          eyebrow="Relation client"
          title="Clients"
          description="Consultez les clients ayant généré une activité commerciale dans votre espace vendeur."
        />

        <section className="grid gap-px bg-[#303238] sm:grid-cols-3">
          <article className="bg-[#151619] p-4">
            <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-500">
              Clients
            </span>
            <strong className="mt-2 block text-[24px] font-semibold text-zinc-100">
              {data.customers.length}
            </strong>
          </article>

          <article className="bg-[#151619] p-4">
            <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-500">
              Commandes
            </span>
            <strong className="mt-2 block text-[24px] font-semibold text-zinc-100">
              {data.customers.reduce(
                (sum, customer) =>
                  sum + customer.orders,
                0,
              )}
            </strong>
          </article>

          <article className="bg-[#151619] p-4">
            <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-500">
              Volume clients
            </span>
            <strong className="mt-2 block text-[18px] font-semibold text-zinc-100">
              {customerRevenue.toLocaleString("fr-FR")} Ar
            </strong>
          </article>
        </section>

        <section className="border border-[#303238] bg-[#111214]">
          <header className="border-b border-[#303238] px-4 py-3">
            <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-500">
              Portefeuille
            </span>
            <h2 className="mt-1 text-[12px] font-semibold text-zinc-100">
              Clients enregistrés
            </h2>
          </header>

          {data.customers.length ? (
            <div className="divide-y divide-[#292c31]">
              {data.customers.map((customer) => (
                <article
                  key={customer.id}
                  className="grid gap-3 px-4 py-3 md:grid-cols-[1fr_180px_180px] md:items-center"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-semibold text-zinc-200">
                      {customer.name}
                    </p>
                    <p className="mt-0.5 truncate text-[9px] text-zinc-500">
                      {customer.email}
                    </p>
                  </div>

                  <div>
                    <span className="text-[8px] uppercase tracking-[0.1em] text-zinc-600">
                      Commandes
                    </span>
                    <p className="mt-0.5 text-[11px] font-medium text-zinc-300">
                      {customer.orders}
                    </p>
                  </div>

                  <div>
                    <span className="text-[8px] uppercase tracking-[0.1em] text-zinc-600">
                      Dépenses
                    </span>
                    <p className="mt-0.5 text-[11px] font-medium text-zinc-300">
                      {customer.totalSpent.toLocaleString("fr-FR")} Ar
                    </p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="px-4 py-12 text-center text-[10px] text-zinc-500">
              Aucun client enregistré.
            </div>
          )}
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
          description="Lecture consolidée de l’activité commerciale actuellement enregistrée."
        />

        <SellerStats statistics={data.statistics} />

        <section className="grid gap-px bg-[#303238] lg:grid-cols-[1.4fr_1fr]">
          <article className="bg-[#151619] p-5">
            <span className="text-[8px] font-bold uppercase tracking-[0.14em] text-emerald-500">
              Revenu total
            </span>

            <strong className="mt-3 block text-[32px] font-semibold tracking-[-0.04em] text-zinc-50">
              {data.statistics.revenue.toLocaleString("fr-FR")} Ar
            </strong>

            <p className="mt-2 text-[10px] leading-5 text-zinc-500">
              Montant consolidé à partir des opérations commerciales actuellement disponibles.
            </p>
          </article>

          <div className="grid grid-cols-3 gap-px bg-[#303238]">
            <article className="bg-[#151619] p-4">
              <ShoppingBag
                size={15}
                className="text-emerald-500"
              />
              <span className="mt-4 block text-[8px] uppercase tracking-[0.1em] text-zinc-500">
                Ventes
              </span>
              <strong className="mt-1 block text-[20px] font-semibold text-zinc-100">
                {data.statistics.sales}
              </strong>
            </article>

            <article className="bg-[#151619] p-4">
              <Truck
                size={15}
                className="text-[#087cff]"
              />
              <span className="mt-4 block text-[8px] uppercase tracking-[0.1em] text-zinc-500">
                Locations
              </span>
              <strong className="mt-1 block text-[20px] font-semibold text-zinc-100">
                {data.statistics.rentals}
              </strong>
            </article>

            <article className="bg-[#151619] p-4">
              <ShoppingCart
                size={15}
                className="text-zinc-400"
              />
              <span className="mt-4 block text-[8px] uppercase tracking-[0.1em] text-zinc-500">
                Commandes
              </span>
              <strong className="mt-1 block text-[20px] font-semibold text-zinc-100">
                {data.statistics.orders}
              </strong>
            </article>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <SellerPageHeader
        eyebrow="Vue d'ensemble"
        title="Cockpit commercial"
        description="Suivez l’état de votre catalogue, vos commandes, vos stocks, vos clients et votre activité financière depuis un seul écran."
        actions={
          <>
            <Link
              href="/dashboard/vendeur/products/new"
              className="inline-flex h-8 items-center gap-1.5 border border-[#ed1b2f] bg-[#ed1b2f] px-3 text-[9px] font-semibold text-white transition hover:bg-[#ff3045]"
            >
              <Plus size={13} />
              Nouveau produit
            </Link>

            <Link
              href="/dashboard/vendeur/orders"
              className="inline-flex h-8 items-center gap-1.5 border border-[#34373d] bg-[#181a1e] px-3 text-[9px] font-semibold text-zinc-300 transition hover:border-zinc-500 hover:text-white"
            >
              Voir les commandes
              <ArrowRight size={12} />
            </Link>
          </>
        }
      />

      <SellerStats statistics={data.statistics} />

      <div className="grid gap-3 xl:grid-cols-[1.25fr_.75fr]">
        <section className="border border-[#303238] bg-[#111214]">
          <header className="flex items-center justify-between border-b border-[#303238] px-4 py-3">
            <div>
              <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                Pilotage
              </span>
              <h2 className="mt-1 text-[12px] font-semibold text-zinc-100">
                Priorités opérationnelles
              </h2>
            </div>

            <span className="text-[8px] uppercase tracking-[0.1em] text-zinc-600">
              Temps réel
            </span>
          </header>

          <div className="divide-y divide-[#292c31]">
            <Link
              href="/dashboard/vendeur/inventory"
              className="group flex items-center gap-3 px-4 py-4 transition hover:bg-[#17191c]"
            >
              <span
                className={`grid size-8 shrink-0 place-items-center border ${
                  data.statistics.lowStock > 0
                    ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
                    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                }`}
              >
                <AlertTriangle size={14} />
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold text-zinc-200">
                  Stock
                </p>
                <p className="mt-0.5 text-[9px] text-zinc-500">
                  {data.statistics.lowStock > 0
                    ? `${data.statistics.lowStock} référence(s) avec un stock faible`
                    : "Aucune alerte de stock faible"}
                </p>
              </div>

              <ArrowRight
                size={13}
                className="text-zinc-600 transition group-hover:text-zinc-300"
              />
            </Link>

            <Link
              href="/dashboard/vendeur/orders"
              className="group flex items-center gap-3 px-4 py-4 transition hover:bg-[#17191c]"
            >
              <span className="grid size-8 shrink-0 place-items-center border border-[#087cff]/30 bg-[#087cff]/10 text-[#4ba2ff]">
                <ShoppingCart size={14} />
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold text-zinc-200">
                  Commandes
                </p>
                <p className="mt-0.5 text-[9px] text-zinc-500">
                  {data.statistics.orders} commande(s) enregistrée(s)
                </p>
              </div>

              <ArrowRight
                size={13}
                className="text-zinc-600 transition group-hover:text-zinc-300"
              />
            </Link>

            <Link
              href="/dashboard/vendeur/revenue"
              className="group flex items-center gap-3 px-4 py-4 transition hover:bg-[#17191c]"
            >
              <span className="grid size-8 shrink-0 place-items-center border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                <CircleDollarSign size={14} />
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold text-zinc-200">
                  Activité financière
                </p>
                <p className="mt-0.5 text-[9px] text-zinc-500">
                  {data.statistics.revenue.toLocaleString("fr-FR")} Ar enregistrés
                </p>
              </div>

              <ArrowRight
                size={13}
                className="text-zinc-600 transition group-hover:text-zinc-300"
              />
            </Link>
          </div>
        </section>

        <section className="border border-[#303238] bg-[#111214]">
          <header className="border-b border-[#303238] px-4 py-3">
            <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-500">
              Activité
            </span>
            <h2 className="mt-1 text-[12px] font-semibold text-zinc-100">
              Mix commercial
            </h2>
          </header>

          <div className="grid grid-cols-2 gap-px bg-[#292c31]">
            <article className="bg-[#151619] p-4">
              <ShoppingBag
                size={15}
                className="text-emerald-500"
              />
              <span className="mt-5 block text-[8px] uppercase tracking-[0.1em] text-zinc-500">
                Ventes
              </span>
              <strong className="mt-1 block text-[22px] font-semibold text-zinc-100">
                {data.statistics.sales}
              </strong>
            </article>

            <article className="bg-[#151619] p-4">
              <Truck
                size={15}
                className="text-[#087cff]"
              />
              <span className="mt-5 block text-[8px] uppercase tracking-[0.1em] text-zinc-500">
                Locations
              </span>
              <strong className="mt-1 block text-[22px] font-semibold text-zinc-100">
                {data.statistics.rentals}
              </strong>
            </article>

            <article className="bg-[#151619] p-4">
              <Package
                size={15}
                className="text-zinc-400"
              />
              <span className="mt-5 block text-[8px] uppercase tracking-[0.1em] text-zinc-500">
                Produits
              </span>
              <strong className="mt-1 block text-[22px] font-semibold text-zinc-100">
                {data.statistics.products}
              </strong>
            </article>

            <article className="bg-[#151619] p-4">
              <Users
                size={15}
                className="text-zinc-400"
              />
              <span className="mt-5 block text-[8px] uppercase tracking-[0.1em] text-zinc-500">
                Clients
              </span>
              <strong className="mt-1 block text-[22px] font-semibold text-zinc-100">
                {data.statistics.customers}
              </strong>
            </article>
          </div>
        </section>
      </div>

      <section className="border border-[#303238] bg-[#111214]">
        <header className="border-b border-[#303238] px-4 py-3">
          <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-500">
            Raccourcis
          </span>
          <h2 className="mt-1 text-[12px] font-semibold text-zinc-100">
            Opérations principales
          </h2>
        </header>

        <div className="grid gap-px bg-[#292c31] sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map(
            ({
              label,
              detail,
              href,
              icon: Icon,
            }) => (
              <Link
                key={href}
                href={href}
                className="group bg-[#151619] p-4 transition hover:bg-[#1a1c20]"
              >
                <div className="flex items-start justify-between">
                  <span className="grid size-8 place-items-center border border-[#34373d] bg-[#111214] text-zinc-400">
                    <Icon size={14} />
                  </span>

                  <ArrowRight
                    size={13}
                    className="text-zinc-700 transition group-hover:translate-x-0.5 group-hover:text-[#ed1b2f]"
                  />
                </div>

                <h3 className="mt-4 text-[11px] font-semibold text-zinc-200">
                  {label}
                </h3>

                <p className="mt-1 text-[9px] leading-4 text-zinc-500">
                  {detail}
                </p>
              </Link>
            ),
          )}
        </div>
      </section>

      <div className="grid gap-3 xl:grid-cols-[1.2fr_.8fr]">
        <section className="border border-[#303238] bg-[#111214]">
          <header className="flex items-center justify-between border-b border-[#303238] px-4 py-3">
            <div>
              <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                Catalogue
              </span>
              <h2 className="mt-1 text-[12px] font-semibold text-zinc-100">
                Produits récents
              </h2>
            </div>

            <Link
              href="/dashboard/vendeur/products"
              className="inline-flex items-center gap-1 text-[9px] font-medium text-zinc-500 transition hover:text-zinc-200"
            >
              Tout voir
              <ArrowRight size={11} />
            </Link>
          </header>

          {data.statistics.recentProducts.length ? (
            <div className="divide-y divide-[#292c31]">
              {data.statistics.recentProducts
                .slice(0, 5)
                .map((product) => (
                  <Link
                    key={product.id}
                    href={`/dashboard/vendeur/products/${product.id}`}
                    className="group flex items-center gap-3 px-4 py-3 transition hover:bg-[#17191c]"
                  >
                    <span className="grid size-8 shrink-0 place-items-center border border-[#34373d] bg-[#151619] text-zinc-500">
                      <Package size={14} />
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[10px] font-medium text-zinc-300">
                        {product.title}
                      </p>
                      <p className="mt-0.5 text-[8px] uppercase tracking-[0.1em] text-zinc-600">
                        Produit
                      </p>
                    </div>

                    <ArrowRight
                      size={12}
                      className="text-zinc-700 transition group-hover:text-zinc-300"
                    />
                  </Link>
                ))}
            </div>
          ) : (
            <div className="grid min-h-44 place-items-center px-4 text-center">
              <div>
                <Package
                  size={20}
                  className="mx-auto text-zinc-700"
                />
                <p className="mt-3 text-[10px] font-medium text-zinc-400">
                  Aucun produit récent
                </p>
                <p className="mt-1 text-[9px] text-zinc-600">
                  Ajoutez un premier produit à votre catalogue.
                </p>
              </div>
            </div>
          )}
        </section>

        <section className="border border-[#303238] bg-[#111214]">
          <header className="flex items-center justify-between border-b border-[#303238] px-4 py-3">
            <div>
              <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                Relation client
              </span>
              <h2 className="mt-1 text-[12px] font-semibold text-zinc-100">
                Aperçu clients
              </h2>
            </div>

            <Link
              href="/dashboard/vendeur/customers"
              className="inline-flex items-center gap-1 text-[9px] font-medium text-zinc-500 transition hover:text-zinc-200"
            >
              Tout voir
              <ArrowRight size={11} />
            </Link>
          </header>

          {data.customers.length ? (
            <div className="divide-y divide-[#292c31]">
              {data.customers
                .slice(0, 5)
                .map((customer) => (
                  <div
                    key={customer.id}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <span className="grid size-8 shrink-0 place-items-center border border-[#34373d] bg-[#151619] text-zinc-500">
                      <Users size={13} />
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[10px] font-medium text-zinc-300">
                        {customer.name}
                      </p>
                      <p className="mt-0.5 truncate text-[8px] text-zinc-600">
                        {customer.orders} commande(s)
                      </p>
                    </div>

                    <span className="shrink-0 text-[9px] font-medium text-zinc-400">
                      {customer.totalSpent.toLocaleString("fr-FR")} Ar
                    </span>
                  </div>
                ))}
            </div>
          ) : (
            <div className="grid min-h-44 place-items-center px-4 text-center">
              <div>
                <Users
                  size={20}
                  className="mx-auto text-zinc-700"
                />
                <p className="mt-3 text-[10px] font-medium text-zinc-400">
                  Aucun client
                </p>
                <p className="mt-1 text-[9px] text-zinc-600">
                  Les clients apparaîtront ici après leurs commandes.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}