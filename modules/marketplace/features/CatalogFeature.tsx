"use client";

import Link from "next/link";
import {
  ArrowRight,
  PackageCheck,
  ShieldCheck,
  Store,
  Truck,
} from "lucide-react";
import {
  useState,
} from "react";

import {
  Button,
  Loader,
  PublicEmpty,
  PublicFilterBar,
  PublicPage,
  SearchBar,
  Select,
} from "@/components/ui";

import {
  useMarketplaceStore,
  type MarketplaceProduct,
} from "@/modules/marketplace-core";

import {
  ProductCard,
} from "../components/ProductCard";

import {
  useCatalog,
} from "../hooks/useCatalog";

function getErrorMessage(
  cause: unknown,
  fallback: string,
) {
  return cause instanceof Error
    ? cause.message
    : fallback;
}

export function CatalogFeature({
  category,
  search,
}: {
  category?: string;
  search?: string;
}) {
  const catalog =
    useCatalog({
      category: category ?? "",
      search: search ?? "",
    });

  const store =
    useMarketplaceStore();

  const [
    actionMessage,
    setActionMessage,
  ] =
    useState("");

  const [
    actionError,
    setActionError,
  ] =
    useState("");

  const featured =
    catalog.result.items[0] ??
    catalog.result.popular[0] ??
    catalog.result.recent[0] ??
    null;

  const handleFavorite =
    async (
      product: MarketplaceProduct,
    ) => {
      try {
        setActionError("");
        setActionMessage("");

        const wasFavorite =
          catalog.favorites.includes(
            product.id,
          );

        await catalog.toggleFavorite(
          product.id,
        );

        setActionMessage(
          wasFavorite
            ? `${product.title} retiré des favoris.`
            : `${product.title} ajouté aux favoris.`,
        );
      } catch (cause) {
        setActionError(
          getErrorMessage(
            cause,
            "Impossible de modifier les favoris.",
          ),
        );
      }
    };

  const handleAdd =
    async (
      product: MarketplaceProduct,
    ) => {
      try {
        setActionError("");
        setActionMessage("");

        await store.run(
          () =>
            store.useCase.addToCart(
              product.id,
              1,
              "sale",
            ),
        );

        setActionMessage(
          `${product.title} ajouté au panier.`,
        );
      } catch (cause) {
        setActionError(
          getErrorMessage(
            cause,
            "Impossible d'ajouter le produit au panier.",
          ),
        );
      }
    };

  if (catalog.loading) {
    return (
      <div className="grid min-h-[520px] place-items-center">
        <Loader label="Chargement d'Indesy Bazar" />
      </div>
    );
  }

  if (catalog.error) {
    return (
      <div className="public-container py-8">
        <PublicEmpty
          title="Marketplace indisponible"
          description={catalog.error}
        />
      </div>
    );
  }

  return (
    <PublicPage>
      <section className="border-b border-zinc-200 bg-zinc-950 text-white dark:border-[#282b31] dark:bg-[#0b0c0e]">
        <div className="mx-auto grid max-w-[1500px] gap-px bg-[#2b2e34] lg:grid-cols-[1.2fr_.8fr]">
          <div className="flex min-h-[224px] flex-col justify-center bg-[#101114] p-4 sm:p-6">
            <span className="w-max border-l-2 border-[#ff1638] pl-2 text-[8px] font-bold uppercase tracking-[0.15em] text-[#ef5261]">
              Indesy Bazar · Marketplace officielle
            </span>

            <h1 className="mt-3 max-w-2xl text-[25px] font-semibold leading-[1.05] sm:text-[34px]">
              Achetez auprès de l&apos;écosystème combat malagasy.
            </h1>

            <p className="mt-3 max-w-2xl text-[10px] leading-[1.55] text-zinc-500 sm:text-[11px]">
              Équipements, articles, occasions et locations provenant directement du catalogue publié sur Indesy Mialy.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href="#catalogue"
                className="inline-flex h-9 items-center gap-2 border border-[#b91f30] bg-[#c82335] px-4 text-[9px] font-semibold text-white transition hover:bg-[#ad1d2e]"
              >
                Explorer le catalogue
                <ArrowRight size={12} />
              </a>

              <Link
                href="/marketplace/orders"
                className="inline-flex h-9 items-center gap-2 border border-[#383c44] px-4 text-[9px] font-semibold text-zinc-300 transition hover:bg-white/[0.04]"
              >
                Mes commandes
              </Link>
            </div>

            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-1.5 text-[8px] text-zinc-500">
              <span className="flex items-center gap-1.5">
                <PackageCheck
                  size={12}
                  className="text-[#61a5ff]"
                />

                {catalog.result.total} offre(s)
              </span>

              <span className="flex items-center gap-1.5">
                <ShieldCheck
                  size={12}
                  className="text-[#61a5ff]"
                />

                Catalogue persistant
              </span>

              <span className="flex items-center gap-1.5">
                <Truck
                  size={12}
                  className="text-[#61a5ff]"
                />

                Commandes intégrées
              </span>
            </div>
          </div>

          <div className="relative min-h-[220px] overflow-hidden bg-[#151619]">
            {featured?.images[0] ? (
              <>
                {/* Marketplace media can use persisted public or external URLs. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={featured.images[0]}
                  alt={featured.title}
                  className="absolute inset-0 h-full w-full object-cover"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/5" />

                <div className="absolute inset-x-0 bottom-0 p-5">
                  <span className="text-[7px] font-bold uppercase tracking-[0.14em] text-[#ef5261]">
                    Offre mise en avant
                  </span>

                  <strong className="mt-1 block max-w-xl text-[16px] leading-5">
                    {featured.title}
                  </strong>

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-[8px] text-zinc-300">
                    <span>
                      {featured.sellerName || "Vendeur"}
                    </span>

                    <span>
                      {featured.type === "rental"
                        ? `${(featured.rentalPricePerDay ?? 0).toLocaleString("fr-FR")} Ar/jour`
                        : `${(featured.salePrice ?? 0).toLocaleString("fr-FR")} Ar`}
                    </span>
                  </div>

                  <Link
                    href={`/marketplace/products/${featured.id}`}
                    className="mt-3 inline-flex h-8 items-center gap-2 border border-white/25 bg-black/50 px-3 text-[8px] font-semibold backdrop-blur transition hover:bg-black/70"
                  >
                    Voir l&apos;offre
                    <ArrowRight size={11} />
                  </Link>
                </div>
              </>
            ) : (
              <div className="grid h-full min-h-[220px] place-items-center">
                <div className="text-center text-zinc-600">
                  <Store
                    size={36}
                    className="mx-auto"
                  />

                  <strong className="mt-3 block text-[11px] text-zinc-400">
                    Catalogue prêt
                  </strong>

                  <span className="text-[8px]">
                    Les offres publiées apparaîtront ici.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <main
        id="catalogue"
        className="public-container py-5 sm:py-6"
      >
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="text-[8px] font-bold uppercase tracking-[0.13em] text-[#c82335]">
              Catalogue réel
            </span>

            <h2 className="mt-1 text-[19px] font-semibold">
              {category || search
                ? "Résultats de votre sélection"
                : "Toutes les offres publiées"}
            </h2>

            <p className="mt-1 text-[9px] text-zinc-500">
              {catalog.result.total} résultat(s)
            </p>
          </div>

          <Link
            href="/marketplace/favorites"
            className="text-[9px] font-semibold text-[#c82335] hover:underline"
          >
            Voir mes favoris
          </Link>
        </div>

        <PublicFilterBar className="mb-4 md:grid-cols-6">
          <SearchBar
            value={catalog.filters.search}
            onChange={(event) =>
              catalog.setFilters({
                ...catalog.filters,
                search: event.target.value,
                page: 1,
              })
            }
            placeholder="Rechercher un produit"
            aria-label="Rechercher dans le catalogue"
            className="md:col-span-2"
          />

          <Select
            value={catalog.filters.type}
            onChange={(event) =>
              catalog.setFilters({
                ...catalog.filters,
                type:
                  event.target.value as typeof catalog.filters.type,
                page: 1,
              })
            }
            aria-label="Type de transaction"
          >
            <option value="all">
              Tous types
            </option>

            <option value="sale">
              Vente
            </option>

            <option value="rental">
              Location
            </option>

            <option value="used">
              Occasion
            </option>
          </Select>

          <input
            value={catalog.filters.category}
            onChange={(event) =>
              catalog.setFilters({
                ...catalog.filters,
                category: event.target.value,
                page: 1,
              })
            }
            placeholder="Catégorie"
            aria-label="Filtrer par catégorie"
            className="ds-input"
          />

          <input
            value={catalog.filters.location}
            onChange={(event) =>
              catalog.setFilters({
                ...catalog.filters,
                location: event.target.value,
                page: 1,
              })
            }
            placeholder="Localisation"
            aria-label="Filtrer par localisation"
            className="ds-input"
          />

          <Select
            value={catalog.filters.sort}
            onChange={(event) =>
              catalog.setFilters({
                ...catalog.filters,
                sort:
                  event.target.value as typeof catalog.filters.sort,
              })
            }
            aria-label="Trier les produits"
          >
            <option value="recent">
              Récents
            </option>

            <option value="popular">
              Populaires
            </option>

            <option value="price-asc">
              Prix croissant
            </option>

            <option value="price-desc">
              Prix décroissant
            </option>
          </Select>
        </PublicFilterBar>

        {(actionMessage || actionError) && (
          <div
            role="status"
            aria-live="polite"
            className={[
              "mb-4 border px-3 py-2 text-[9px]",
              actionError
                ? "border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
                : "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300",
            ].join(" ")}
          >
            {actionError || actionMessage}
          </div>
        )}

        {catalog.result.items.length ? (
          <div className="grid grid-cols-1 justify-start gap-3 sm:grid-cols-[repeat(auto-fill,minmax(280px,320px))]">
            {catalog.result.items.map(
              (product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  favorite={
                    catalog.favorites.includes(
                      product.id,
                    )
                  }
                  onFavorite={() =>
                    void handleFavorite(
                      product,
                    )
                  }
                  onAdd={() =>
                    void handleAdd(
                      product,
                    )
                  }
                />
              ),
            )}
          </div>
        ) : (
          <PublicEmpty
            title="Aucun produit publié"
            description="Modifiez vos filtres pour élargir la sélection."
          />
        )}

        {catalog.result.pageCount > 1 && (
          <nav
            className="mt-8 flex items-center justify-center gap-3"
            aria-label="Pagination du catalogue"
          >
            <Button
              variant="outline"
              size="sm"
              disabled={
                catalog.filters.page <= 1
              }
              onClick={() =>
                catalog.setFilters({
                  ...catalog.filters,
                  page:
                    catalog.filters.page -
                    1,
                })
              }
            >
              Précédent
            </Button>

            <span
              className="ds-caption"
              aria-current="page"
            >
              {catalog.result.page}
              /
              {catalog.result.pageCount}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={
                catalog.filters.page >=
                catalog.result.pageCount
              }
              onClick={() =>
                catalog.setFilters({
                  ...catalog.filters,
                  page:
                    catalog.filters.page +
                    1,
                })
              }
            >
              Suivant
            </Button>
          </nav>
        )}
      </main>
    </PublicPage>
  );
}
