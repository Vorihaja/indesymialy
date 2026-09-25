"use client";

import Link from "next/link";
import {
  ArrowRight,
  Heart,
  MapPin,
  PackageCheck,
  ShoppingCart,
  Store,
} from "lucide-react";

import type {
  MarketplaceProduct,
} from "../types";

const typeLabels: Record<
  MarketplaceProduct["type"],
  string
> = {
  sale: "Vente",
  rental: "Location",
  used: "Occasion",
};

export function ProductCard({
  product,
  favorite,
  onFavorite,
  onAdd,
}: {
  product: MarketplaceProduct;
  favorite: boolean;
  onFavorite: () => void;
  onAdd: () => void;
}) {
  const price =
    product.type === "rental"
      ? `${(product.rentalPricePerDay ?? 0).toLocaleString("fr-FR")} Ar/jour`
      : `${(product.salePrice ?? 0).toLocaleString("fr-FR")} Ar`;

  const detailHref =
    `/marketplace/products/${product.id}`;

  return (
    <article
      data-marketplace-offer-card="overlay"
      className="group relative isolate aspect-[4/3] w-full overflow-hidden border border-zinc-300/70 bg-[#111214] shadow-sm transition duration-300 hover:-translate-y-1 hover:border-zinc-400 hover:shadow-2xl dark:border-[#303238] dark:hover:border-[#555a64] sm:aspect-[16/11] sm:max-w-[320px]"
    >
      <Link
        href={detailHref}
        className="absolute inset-0 z-0 block overflow-hidden bg-[#0d0f12]"
        aria-label={`Voir ${product.title}`}
      >
        {product.images[0] ? (
          <>
            {/* Marketplace media can use persisted public or external URLs. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.images[0]}
              alt={product.title}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.045]"
            />
          </>
        ) : (
          <div className="grid h-full place-items-center text-zinc-600">
            <div className="text-center">
              <Store
                size={30}
                className="mx-auto"
              />

              <span className="mt-2 block text-[8px]">
                Image indisponible
              </span>
            </div>
          </div>
        )}
      </Link>

      <div
        data-marketplace-card-gradient="true"
        className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black via-black/75 to-black/5"
        aria-hidden="true"
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-2 p-2.5">
        <div className="flex flex-wrap gap-1.5">
          <span className="border border-white/15 bg-black/75 px-2 py-1 text-[7px] font-bold uppercase tracking-[0.1em] text-white backdrop-blur">
            {typeLabels[product.type]}
          </span>

          {product.stock > 0 && (
            <span className="border border-emerald-400/30 bg-emerald-950/80 px-2 py-1 text-[7px] font-bold uppercase tracking-[0.08em] text-emerald-200 backdrop-blur">
              Disponible
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onFavorite}
          aria-label={
            favorite
              ? `Retirer ${product.title} des favoris`
              : `Ajouter ${product.title} aux favoris`
          }
          aria-pressed={favorite}
          className={[
            "pointer-events-auto grid size-8 shrink-0 place-items-center border backdrop-blur transition",
            favorite
              ? "border-[#ef5261] bg-[#c82335] text-white"
              : "border-white/25 bg-black/55 text-white hover:border-[#ef5261] hover:bg-[#c82335]",
          ].join(" ")}
        >
          <Heart
            size={13}
            fill={favorite ? "currentColor" : "none"}
          />
        </button>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 p-3 text-white">
        <Link
          href={detailHref}
          className="pointer-events-auto line-clamp-2 text-[13px] font-semibold leading-[1.3] transition hover:text-[#ff6677]"
        >
          {product.title}
        </Link>

        <div className="mt-1 flex min-w-0 items-center gap-1.5 text-[8px] text-zinc-300">
          <Store
            size={10}
            className="shrink-0 text-zinc-400"
          />

          <span className="truncate">
            {product.sellerName || "Vendeur"}
          </span>
        </div>

        <div className="mt-1 flex min-w-0 items-center gap-3 text-[7px] text-zinc-400">
          {product.location && (
            <span className="flex min-w-0 items-center gap-1">
              <MapPin
                size={9}
                className="shrink-0"
              />

              <span className="truncate">
                {product.location}
              </span>
            </span>
          )}

          <span className="flex shrink-0 items-center gap-1">
            <PackageCheck size={9} />
            {product.stock > 0
              ? `${product.stock} en stock`
              : "Stock épuisé"}
          </span>
        </div>

        <strong className="mt-2 block text-[15px] leading-none text-white">
          {price}
        </strong>

        <div className="mt-2.5 flex items-center gap-2">
          <Link
            href={detailHref}
            className="pointer-events-auto inline-flex h-8 items-center gap-2 border border-white/25 bg-black/45 px-3 text-[8px] font-semibold text-white backdrop-blur transition hover:border-[#ef5261] hover:bg-[#c82335]"
          >
            Voir l&apos;offre
            <ArrowRight size={11} />
          </Link>

          {product.type !== "rental" && (
            <button
              type="button"
              onClick={onAdd}
              disabled={product.stock <= 0}
              aria-label={
                product.stock > 0
                  ? `Ajouter ${product.title} au panier`
                  : `${product.title} est épuisé`
              }
              className="pointer-events-auto grid size-8 place-items-center border border-[#ef5261] bg-[#c82335] text-white transition hover:bg-[#ad1d2e] disabled:cursor-not-allowed disabled:border-zinc-600 disabled:bg-zinc-800 disabled:text-zinc-500"
            >
              <ShoppingCart size={13} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
