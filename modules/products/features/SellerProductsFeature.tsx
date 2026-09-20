"use client";

import Link from "next/link";
import {
  useIndesyDialog,
} from "@/components/ui/indesy-dialog";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Archive,
  ArrowRight,
  Boxes,
  Edit3,
  ImageIcon,
  Package,
  Plus,
  RotateCcw,
  Search,
  Tag,
  Upload,
  XCircle,
} from "lucide-react";

import {
  ProductForm,
} from "../components/ProductForm";

import {
  useProducts,
} from "../hooks";

import type {
  ListingType,
  MarketplaceProduct,
  ProductStatus,
} from "../types";


type LifecycleAction =
  | "publish"
  | "deactivate"
  | "reactivate"
  | "archive";

type StockFilter =
  | "all"
  | "available"
  | "low"
  | "out";

type SortMode =
  | "recent"
  | "title"
  | "stock-asc"
  | "stock-desc";


const LOW_STOCK_THRESHOLD = 3;


const typeLabels: Record<
  ListingType,
  string
> = {
  sale: "Vente",
  rental: "Location",
  used: "Occasion",
};


const statusLabels: Record<
  ProductStatus,
  string
> = {
  draft: "Brouillon",
  published: "Publié",
  inactive: "Inactif",
  archived: "Archivé",
};


const statusStyles: Record<
  ProductStatus,
  string
> = {
  draft:
    "border-zinc-700 bg-zinc-900 text-zinc-400",

  published:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",

  inactive:
    "border-amber-500/30 bg-amber-500/10 text-amber-400",

  archived:
    "border-zinc-700 bg-zinc-950 text-zinc-600",
};


function formatMoney(
  value: number | null,
) {
  if (
    value === null ||
    !Number.isFinite(value)
  ) {
    return "—";
  }

  return `${value.toLocaleString(
    "fr-FR",
  )} Ar`;
}


function productPrice(
  product: MarketplaceProduct,
) {
  if (product.type === "rental") {
    return {
      primary: formatMoney(
        product.rentalPricePerDay,
      ),
      detail: "par jour",
    };
  }

  return {
    primary: formatMoney(
      product.salePrice,
    ),
    detail:
      product.type === "used"
        ? "occasion"
        : "vente",
  };
}


function productStockState(
  product: MarketplaceProduct,
) {
  if (product.stock <= 0) {
    return {
      label: "Rupture",
      className:
        "text-red-400",
    };
  }

  if (
    product.stock <=
    LOW_STOCK_THRESHOLD
  ) {
    return {
      label: "Stock faible",
      className:
        "text-amber-400",
    };
  }

  return {
    label: "Disponible",
    className:
      "text-emerald-400",
  };
}


function CatalogueLoadingState() {
  return (
    <div className="grid gap-3">
      <div className="h-16 animate-pulse border border-[#303238] bg-[#151619]" />

      <div className="grid grid-cols-2 gap-px bg-[#303238] md:grid-cols-3 xl:grid-cols-6">
        {Array.from({
          length: 6,
        }).map((_, index) => (
          <div
            key={index}
            className="h-[92px] animate-pulse bg-[#151619]"
          />
        ))}
      </div>

      <div className="h-14 animate-pulse border border-[#303238] bg-[#151619]" />

      <div className="h-72 animate-pulse border border-[#303238] bg-[#151619]" />
    </div>
  );
}


function CatalogueStat({
  label,
  value,
  detail,
  accent,
}: {
  label: string;
  value: number;
  detail: string;
  accent:
    | "neutral"
    | "green"
    | "blue"
    | "amber"
    | "red";
}) {
  const accentClass = {
    neutral:
      "before:bg-zinc-600",

    green:
      "before:bg-emerald-500",

    blue:
      "before:bg-[#087cff]",

    amber:
      "before:bg-amber-400",

    red:
      "before:bg-[#ed1b2f]",
  }[accent];

  return (
    <article
      className={`
        relative
        min-h-[92px]
        bg-[#151619]
        px-3
        py-3
        before:absolute
        before:inset-x-0
        before:top-0
        before:h-[2px]
        ${accentClass}
      `}
    >
      <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-500">
        {label}
      </p>

      <strong className="mt-2 block text-[22px] font-semibold tracking-[-0.035em] text-zinc-100">
        {value}
      </strong>

      <p className="mt-1 text-[8px] text-zinc-600">
        {detail}
      </p>
    </article>
  );
}


export function SellerProductsFeature({
  mode = "list",
  productId,
}: {
  mode?:
    | "list"
    | "new"
    | "detail";

  productId?: string;
}) {
  const dialog = useIndesyDialog();
  const data =
    useProducts();

  const [
    editing,
    setEditing,
  ] =
    useState<MarketplaceProduct | null>(
      null,
    );

  const [
    selected,
    setSelected,
  ] =
    useState<MarketplaceProduct | null>(
      null,
    );

  const [
    detailLoading,
    setDetailLoading,
  ] =
    useState(
      mode === "detail",
    );

  const [
    detailError,
    setDetailError,
  ] =
    useState<string | null>(
      null,
    );

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<
      ProductStatus | "all"
    >("all");

  const [
    typeFilter,
    setTypeFilter,
  ] =
    useState<
      ListingType | "all"
    >("all");

  const [
    stockFilter,
    setStockFilter,
  ] =
    useState<StockFilter>(
      "all",
    );

  const [
    sortMode,
    setSortMode,
  ] =
    useState<SortMode>(
      "recent",
    );

  const [
    busyProductId,
    setBusyProductId,
  ] =
    useState<string | null>(
      null,
    );

  const [
    lifecycleError,
    setLifecycleError,
  ] =
    useState<string | null>(
      null,
    );


  useEffect(() => {
    if (
      mode !== "detail" ||
      !productId
    ) {
      setDetailLoading(false);
      return;
    }

    let active =
      true;

    setDetailLoading(true);
    setDetailError(null);

    void data
      .detail(productId)
      .then((product) => {
        if (active) {
          setSelected(
            product,
          );
        }
      })
      .catch((cause: unknown) => {
        if (!active) {
          return;
        }

        setDetailError(
          cause instanceof Error
            ? cause.message
            : "Impossible de charger le produit.",
        );
      })
      .finally(() => {
        if (active) {
          setDetailLoading(
            false,
          );
        }
      });

    return () => {
      active =
        false;
    };
  }, [
    mode,
    productId,
  ]);


  const stats =
    useMemo(() => {
      const products =
        data.products;

      return {
        total:
          products.length,

        published:
          products.filter(
            (product) =>
              product.status ===
              "published",
          ).length,

        draft:
          products.filter(
            (product) =>
              product.status ===
              "draft",
          ).length,

        inactive:
          products.filter(
            (product) =>
              product.status ===
              "inactive",
          ).length,

        archived:
          products.filter(
            (product) =>
              product.status ===
              "archived",
          ).length,

        lowStock:
          products.filter(
            (product) =>
              product.stock > 0 &&
              product.stock <=
                LOW_STOCK_THRESHOLD,
          ).length,
      };
    }, [
      data.products,
    ]);


  const filteredProducts =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLocaleLowerCase(
            "fr",
          );

      const filtered =
        data.products.filter(
          (product) => {
            if (
              statusFilter !==
                "all" &&
              product.status !==
                statusFilter
            ) {
              return false;
            }

            if (
              typeFilter !==
                "all" &&
              product.type !==
                typeFilter
            ) {
              return false;
            }

            if (
              stockFilter ===
                "available" &&
              product.stock <=
                LOW_STOCK_THRESHOLD
            ) {
              return false;
            }

            if (
              stockFilter ===
                "low" &&
              !(
                product.stock >
                  0 &&
                product.stock <=
                  LOW_STOCK_THRESHOLD
              )
            ) {
              return false;
            }

            if (
              stockFilter ===
                "out" &&
              product.stock > 0
            ) {
              return false;
            }

            if (
              !normalizedSearch
            ) {
              return true;
            }

            const searchable =
              [
                product.title,
                product.category,
                product.location,
                product.sellerName,
                typeLabels[
                  product.type
                ],
                statusLabels[
                  product.status
                ],
              ]
                .join(" ")
                .toLocaleLowerCase(
                  "fr",
                );

            return searchable.includes(
              normalizedSearch,
            );
          },
        );

      return [...filtered].sort(
        (left, right) => {
          if (
            sortMode ===
            "title"
          ) {
            return left.title.localeCompare(
              right.title,
              "fr",
            );
          }

          if (
            sortMode ===
            "stock-asc"
          ) {
            return (
              left.stock -
              right.stock
            );
          }

          if (
            sortMode ===
            "stock-desc"
          ) {
            return (
              right.stock -
              left.stock
            );
          }

          return (
            new Date(
              right.updatedAt,
            ).getTime() -
            new Date(
              left.updatedAt,
            ).getTime()
          );
        },
      );
    }, [
      data.products,
      search,
      sortMode,
      statusFilter,
      stockFilter,
      typeFilter,
    ]);


  async function runLifecycle(
    product: MarketplaceProduct,
    action: LifecycleAction,
  ) {
    if (
      busyProductId
    ) {
      return;
    }

    if (
      action ===
      "archive"
    ) {
      const confirmed =
        await dialog.confirm({
          title:
            `Archiver « ${product.title} » ?`,
          description:
            "Le produit ne sera plus actif dans le catalogue.",
          confirmLabel: "Archiver",
          cancelLabel: "Annuler",
          tone: "danger",
        });

      if (!confirmed) {
        return;
      }
    }

    setLifecycleError(
      null,
    );

    setBusyProductId(
      product.id,
    );

    try {
      switch (action) {
        case "publish":
          await data.publish(
            product.id,
          );
          break;

        case "deactivate":
          await data.deactivate(
            product.id,
          );
          break;

        case "reactivate":
          await data.reactivate(
            product.id,
          );
          break;

        case "archive":
          await data.archive(
            product.id,
          );
          break;
      }

      if (
        editing?.id ===
        product.id
      ) {
        setEditing(null);
      }
    }
    catch (cause) {
      setLifecycleError(
        cause instanceof Error
          ? cause.message
          : "Impossible de modifier le cycle de vie du produit.",
      );
    }
    finally {
      setBusyProductId(
        null,
      );
    }
  }


  if (
    data.loading
  ) {
    return (
      <CatalogueLoadingState />
    );
  }


  if (
    data.error
  ) {
    return (
      <div
        role="alert"
        className="border border-blue-500/30 bg-blue-500/5 p-5"
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-red-400">
          Catalogue indisponible
        </p>

        <p className="mt-2 text-[11px] text-red-300/80">
          {data.error}
        </p>
      </div>
    );
  }


  if (
    mode === "new"
  ) {
    return (
      <div className="grid gap-4">
        <header className="flex flex-col gap-3 border-b border-[#303238] pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[8px] font-bold uppercase tracking-[0.15em] text-[#ed1b2f]">
              Catalogue
            </p>

            <h1 className="mt-1 text-[21px] font-semibold tracking-[-0.035em] text-zinc-100">
              Nouveau produit
            </h1>

            <p className="mt-1 text-[10px] text-zinc-500">
              Créez une nouvelle référence dans votre catalogue vendeur.
            </p>
          </div>

          <Link
            href="/dashboard/vendeur/products"
            className="inline-flex h-8 items-center gap-1.5 border border-[#34373d] bg-[#181a1e] px-3 text-[9px] font-semibold text-zinc-300 transition hover:border-zinc-500 hover:text-white"
          >
            Retour au catalogue
          </Link>
        </header>

        <ProductForm
          onSubmit={
            data.create
          }
        />
      </div>
    );
  }


  if (
    mode === "detail"
  ) {
    if (
      detailLoading
    ) {
      return (
        <CatalogueLoadingState />
      );
    }

    if (
      detailError
    ) {
      return (
        <p
          role="alert"
          className="border border-red-500/30 bg-red-500/5 p-5 text-[11px] text-red-400"
        >
          {detailError}
        </p>
      );
    }

    if (
      !selected
    ) {
      return (
        <div className="grid min-h-60 place-items-center border border-dashed border-[#303238] bg-[#101114] px-6 text-center">
          <div>
            <Package
              size={22}
              className="mx-auto text-zinc-700"
            />

            <p className="mt-3 text-[11px] font-semibold text-zinc-400">
              Produit introuvable
            </p>

            <Link
              href="/dashboard/vendeur/products"
              className="mt-3 inline-flex items-center gap-1 text-[9px] font-semibold text-[#3d92ff]"
            >
              Retour au catalogue
              <ArrowRight
                size={11}
              />
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="grid gap-4">
        <header className="flex flex-col gap-3 border-b border-[#303238] pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[8px] font-bold uppercase tracking-[0.15em] text-[#ed1b2f]">
              Catalogue
            </p>

            <h1 className="mt-1 text-[21px] font-semibold tracking-[-0.035em] text-zinc-100">
              {selected.title}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={`border px-2 py-1 text-[8px] font-bold uppercase tracking-[0.08em] ${statusStyles[selected.status]}`}
              >
                {statusLabels[
                  selected.status
                ]}
              </span>

              <span className="text-[9px] text-zinc-500">
                {
                  typeLabels[
                    selected.type
                  ]
                }
              </span>
            </div>
          </div>

          <Link
            href="/dashboard/vendeur/products"
            className="inline-flex h-8 items-center gap-1.5 border border-[#34373d] bg-[#181a1e] px-3 text-[9px] font-semibold text-zinc-300 transition hover:border-zinc-500 hover:text-white"
          >
            Retour au catalogue
          </Link>
        </header>

        <ProductForm
          initial={selected}
          onSubmit={async (
            input,
          ) => {
            await data.update(
              selected.id,
              input,
            );

            const refreshed =
              await data.detail(
                selected.id,
              );

            if (refreshed) {
              setSelected(
                refreshed,
              );
            }
          }}
        />
      </div>
    );
  }


  return (
    <div className="grid gap-3">
      <header className="flex flex-col gap-3 border-b border-[#303238] pb-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[8px] font-bold uppercase tracking-[0.15em] text-[#ed1b2f]">
            Catalogue
          </p>

          <h1 className="mt-1 text-[21px] font-semibold tracking-[-0.035em] text-zinc-100">
            Produits
          </h1>

          <p className="mt-1 max-w-3xl text-[10px] leading-5 text-zinc-500">
            Gérez vos références, leur disponibilité et leur cycle de publication.
          </p>
        </div>

        <Link
          href="/dashboard/vendeur/products/new"
          className="inline-flex h-8 items-center gap-1.5 border border-[#ed1b2f] bg-[#ed1b2f] px-3 text-[9px] font-semibold text-white transition hover:bg-[#ff3045]"
        >
          <Plus
            size={13}
          />
          Nouveau produit
        </Link>
      </header>


      <section className="grid grid-cols-2 gap-px overflow-hidden border border-[#303238] bg-[#303238] md:grid-cols-3 xl:grid-cols-6">
        <CatalogueStat
          label="Produits"
          value={stats.total}
          detail="Total catalogue"
          accent="neutral"
        />

        <CatalogueStat
          label="Publiés"
          value={stats.published}
          detail="Visibles"
          accent="green"
        />

        <CatalogueStat
          label="Brouillons"
          value={stats.draft}
          detail="À finaliser"
          accent="blue"
        />

        <CatalogueStat
          label="Inactifs"
          value={stats.inactive}
          detail="Hors publication"
          accent="amber"
        />

        <CatalogueStat
          label="Archivés"
          value={stats.archived}
          detail="Historique"
          accent="neutral"
        />

        <CatalogueStat
          label="Stock faible"
          value={stats.lowStock}
          detail={`≤ ${LOW_STOCK_THRESHOLD} unités`}
          accent={
            stats.lowStock > 0
              ? "red"
              : "green"
          }
        />
      </section>


      {lifecycleError ? (
        <div
          role="alert"
          className="border border-blue-500/30 bg-blue-500/5 px-3 py-2 text-[10px] text-blue-400"
        >
          {lifecycleError}
        </div>
      ) : null}


      {editing ? (
        <section className="border border-[#3d92ff]/30 bg-[#11151a]">
          <header className="flex items-center justify-between border-b border-[#303238] px-4 py-3">
            <div>
              <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#3d92ff]">
                Modification
              </p>

              <h2 className="mt-1 text-[12px] font-semibold text-zinc-100">
                {editing.title}
              </h2>
            </div>

            <button
              type="button"
              onClick={() =>
                setEditing(
                  null,
                )
              }
              className="text-[9px] font-medium text-zinc-500 transition hover:text-white"
            >
              Fermer
            </button>
          </header>

          <div className="p-4">
            <ProductForm
              initial={editing}
              onSubmit={async (
                input,
              ) => {
                await data.update(
                  editing.id,
                  input,
                );

                setEditing(
                  null,
                );
              }}
            />
          </div>
        </section>
      ) : null}


      <section className="border border-[#303238] bg-[#111214]">
        <div className="grid gap-2 border-b border-[#303238] p-3 lg:grid-cols-[minmax(220px,1fr)_150px_150px_150px_150px]">
          <label className="relative">
            <Search
              size={13}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"
            />

            <input
              value={search}
              onChange={(
                event,
              ) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Rechercher un produit..."
              className="h-8 w-full border border-[#303238] bg-[#0d0f12] pl-8 pr-3 text-[10px] text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-[#3d92ff]"
            />
          </label>

          <select
            value={
              statusFilter
            }
            onChange={(
              event,
            ) =>
              setStatusFilter(
                event.target
                  .value as
                  | ProductStatus
                  | "all",
              )
            }
            className="h-8 border border-[#303238] bg-[#0d0f12] px-2 text-[9px] text-zinc-400 outline-none focus:border-[#3d92ff]"
          >
            <option value="all">
              Tous les statuts
            </option>

            <option value="published">
              Publiés
            </option>

            <option value="draft">
              Brouillons
            </option>

            <option value="inactive">
              Inactifs
            </option>

            <option value="archived">
              Archivés
            </option>
          </select>

          <select
            value={
              typeFilter
            }
            onChange={(
              event,
            ) =>
              setTypeFilter(
                event.target
                  .value as
                  | ListingType
                  | "all",
              )
            }
            className="h-8 border border-[#303238] bg-[#0d0f12] px-2 text-[9px] text-zinc-400 outline-none focus:border-[#3d92ff]"
          >
            <option value="all">
              Tous les types
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
          </select>

          <select
            value={
              stockFilter
            }
            onChange={(
              event,
            ) =>
              setStockFilter(
                event.target
                  .value as StockFilter,
              )
            }
            className="h-8 border border-[#303238] bg-[#0d0f12] px-2 text-[9px] text-zinc-400 outline-none focus:border-[#3d92ff]"
          >
            <option value="all">
              Tous les stocks
            </option>

            <option value="available">
              Disponible
            </option>

            <option value="low">
              Stock faible
            </option>

            <option value="out">
              Rupture
            </option>
          </select>

          <select
            value={
              sortMode
            }
            onChange={(
              event,
            ) =>
              setSortMode(
                event.target
                  .value as SortMode,
              )
            }
            className="h-8 border border-[#303238] bg-[#0d0f12] px-2 text-[9px] text-zinc-400 outline-none focus:border-[#3d92ff]"
          >
            <option value="recent">
              Plus récents
            </option>

            <option value="title">
              Nom A–Z
            </option>

            <option value="stock-asc">
              Stock croissant
            </option>

            <option value="stock-desc">
              Stock décroissant
            </option>
          </select>
        </div>


        <div className="flex items-center justify-between border-b border-[#303238] px-4 py-2">
          <p className="text-[8px] uppercase tracking-[0.1em] text-zinc-600">
            {filteredProducts.length} résultat(s)
          </p>

          {(
            search ||
            statusFilter !==
              "all" ||
            typeFilter !==
              "all" ||
            stockFilter !==
              "all"
          ) ? (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter(
                  "all",
                );
                setTypeFilter(
                  "all",
                );
                setStockFilter(
                  "all",
                );
                setSortMode(
                  "recent",
                );
              }}
              className="text-[8px] font-semibold uppercase tracking-[0.08em] text-zinc-500 transition hover:text-zinc-200"
            >
              Réinitialiser
            </button>
          ) : null}
        </div>


        {filteredProducts.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#303238] bg-[#151619] text-[8px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                  <th className="px-4 py-3">
                    Produit
                  </th>

                  <th className="px-3 py-3">
                    Catégorie
                  </th>

                  <th className="px-3 py-3">
                    Type
                  </th>

                  <th className="px-3 py-3">
                    Prix
                  </th>

                  <th className="px-3 py-3">
                    Stock
                  </th>

                  <th className="px-3 py-3">
                    Statut
                  </th>

                  <th className="px-4 py-3 text-right">
                    Actions
                  </th>
                </tr>
              </thead>


              <tbody className="divide-y divide-[#292c31]">
                {filteredProducts.map(
                  (
                    product,
                  ) => {
                    const price =
                      productPrice(
                        product,
                      );

                    const stockState =
                      productStockState(
                        product,
                      );

                    const busy =
                      busyProductId ===
                      product.id;

                    const firstImage =
                      product.images[
                        0
                      ];

                    return (
                      <tr
                        key={
                          product.id
                        }
                        className="bg-[#111214] transition hover:bg-[#16181b]"
                      >
                        <td className="px-4 py-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="grid size-10 shrink-0 place-items-center overflow-hidden border border-[#303238] bg-[#17191c]">
                              {firstImage ? (
                                <img
                                  src={
                                    firstImage
                                  }
                                  alt=""
                                  className="size-full object-cover"
                                />
                              ) : (
                                <ImageIcon
                                  size={
                                    15
                                  }
                                  className="text-zinc-700"
                                />
                              )}
                            </div>

                            <div className="min-w-0">
                              <Link
                                href={`/dashboard/vendeur/products/${product.id}`}
                                className="block max-w-[250px] truncate text-[10px] font-semibold text-zinc-200 transition hover:text-white"
                              >
                                {
                                  product.title
                                }
                              </Link>

                              <p className="mt-1 max-w-[250px] truncate text-[8px] text-zinc-600">
                                {product.location ||
                                  "Localisation non renseignée"}
                              </p>
                            </div>
                          </div>
                        </td>


                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1.5 text-[9px] text-zinc-400">
                            <Tag
                              size={
                                10
                              }
                              className="text-zinc-700"
                            />

                            <span className="max-w-[140px] truncate">
                              {product.category ||
                                "Sans catégorie"}
                            </span>
                          </div>
                        </td>


                        <td className="px-3 py-3">
                          <span className="text-[9px] font-medium text-zinc-400">
                            {
                              typeLabels[
                                product
                                  .type
                              ]
                            }
                          </span>
                        </td>


                        <td className="px-3 py-3">
                          <p className="text-[10px] font-semibold text-zinc-300">
                            {
                              price.primary
                            }
                          </p>

                          <p className="mt-0.5 text-[8px] text-zinc-600">
                            {
                              price.detail
                            }
                          </p>
                        </td>


                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <Boxes
                              size={
                                12
                              }
                              className={
                                stockState.className
                              }
                            />

                            <div>
                              <p className="text-[10px] font-semibold text-zinc-300">
                                {
                                  product.stock
                                }
                              </p>

                              <p
                                className={`mt-0.5 text-[8px] ${stockState.className}`}
                              >
                                {
                                  stockState.label
                                }
                              </p>
                            </div>
                          </div>
                        </td>


                        <td className="px-3 py-3">
                          <span
                            className={`inline-flex border px-2 py-1 text-[8px] font-bold uppercase tracking-[0.07em] ${statusStyles[product.status]}`}
                          >
                            {
                              statusLabels[
                                product
                                  .status
                              ]
                            }
                          </span>
                        </td>


                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/dashboard/vendeur/products/${product.id}`}
                              title="Ouvrir"
                              className="grid size-7 place-items-center border border-[#303238] bg-[#151619] text-zinc-500 transition hover:border-zinc-500 hover:text-white"
                            >
                              <ArrowRight
                                size={
                                  12
                                }
                              />
                            </Link>


                            {product.status !==
                            "archived" ? (
                              <button
                                type="button"
                                title="Modifier"
                                disabled={
                                  busy
                                }
                                onClick={() =>
                                  setEditing(
                                    product,
                                  )
                                }
                                className="grid size-7 place-items-center border border-[#303238] bg-[#151619] text-zinc-500 transition hover:border-[#3d92ff]/60 hover:text-[#3d92ff] disabled:opacity-40"
                              >
                                <Edit3
                                  size={
                                    11
                                  }
                                />
                              </button>
                            ) : null}


                            {product.status ===
                            "draft" ? (
                              <button
                                type="button"
                                title="Publier"
                                disabled={
                                  busy
                                }
                                onClick={() =>
                                  void runLifecycle(
                                    product,
                                    "publish",
                                  )
                                }
                                className="grid size-7 place-items-center border border-emerald-500/30 bg-emerald-500/5 text-emerald-400 transition hover:bg-emerald-500/10 disabled:opacity-40"
                              >
                                <Upload
                                  size={
                                    11
                                  }
                                />
                              </button>
                            ) : null}


                            {product.status ===
                            "published" ? (
                              <button
                                type="button"
                                title="Désactiver"
                                disabled={
                                  busy
                                }
                                onClick={() =>
                                  void runLifecycle(
                                    product,
                                    "deactivate",
                                  )
                                }
                                className="grid size-7 place-items-center border border-amber-500/30 bg-amber-500/5 text-amber-400 transition hover:bg-amber-500/10 disabled:opacity-40"
                              >
                                <XCircle
                                  size={
                                    11
                                  }
                                />
                              </button>
                            ) : null}


                            {product.status ===
                            "inactive" ? (
                              <button
                                type="button"
                                title="Réactiver"
                                disabled={
                                  busy
                                }
                                onClick={() =>
                                  void runLifecycle(
                                    product,
                                    "reactivate",
                                  )
                                }
                                className="grid size-7 place-items-center border border-[#3d92ff]/30 bg-[#3d92ff]/5 text-[#3d92ff] transition hover:bg-[#3d92ff]/10 disabled:opacity-40"
                              >
                                <RotateCcw
                                  size={
                                    11
                                  }
                                />
                              </button>
                            ) : null}


                            {product.status !==
                            "archived" ? (
                              <button
                                type="button"
                                title="Archiver"
                                disabled={
                                  busy
                                }
                                onClick={() =>
                                  void runLifecycle(
                                    product,
                                    "archive",
                                  )
                                }
                                className="grid size-7 place-items-center border border-[#303238] bg-[#151619] text-zinc-600 transition hover:border-red-500/30 hover:text-red-400 disabled:opacity-40"
                              >
                                <Archive
                                  size={
                                    11
                                  }
                                />
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid min-h-64 place-items-center px-6 text-center">
            <div>
              <Package
                size={24}
                className="mx-auto text-zinc-700"
              />

              <p className="mt-4 text-[11px] font-semibold text-zinc-400">
                Aucun produit correspondant
              </p>

              <p className="mt-1 max-w-sm text-[9px] leading-4 text-zinc-600">
                Modifiez vos filtres ou ajoutez une nouvelle référence au catalogue.
              </p>

              <Link
                href="/dashboard/vendeur/products/new"
                className="mt-4 inline-flex h-8 items-center gap-1.5 border border-[#ed1b2f] bg-[#ed1b2f] px-3 text-[9px] font-semibold text-white"
              >
                <Plus
                  size={
                    12
                  }
                />

                Nouveau produit
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
