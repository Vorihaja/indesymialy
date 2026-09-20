"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  FolderTree,
  RefreshCw,
  Search,
  Tag,
} from "lucide-react";

import IndesyDualOrbitLoader from "@/components/loading/IndesyDualOrbitLoader";

import {
  useProducts,
} from "../hooks";

import {
  useCatalogCategories,
} from "../catalog/useCatalogCategories";


type UsageFilter =
  | "all"
  | "used"
  | "unused";


function normalize(
  value: string,
) {
  return value
    .trim()
    .toLocaleLowerCase(
      "fr",
    );
}


export function SellerCategoriesFeature() {
  const catalog =
    useCatalogCategories();

  const products =
    useProducts();

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    usageFilter,
    setUsageFilter,
  ] =
    useState<UsageFilter>(
      "all",
    );


  const parentMap =
    useMemo(
      () =>
        new Map(
          catalog.categories.map(
            (category) => [
              category.id,
              category.name,
            ],
          ),
        ),
      [
        catalog.categories,
      ],
    );


  const usage =
    useMemo(
      () => {
        const result =
          new Map<
            string,
            number
          >();

        for (
          const product of
          products.products
        ) {
          const keys =
            new Set<string>();

          if (
            product.categorySlug
          ) {
            keys.add(
              normalize(
                product.categorySlug,
              ),
            );
          }

          if (
            product.category
          ) {
            keys.add(
              normalize(
                product.category,
              ),
            );
          }

          for (
            const key of keys
          ) {
            result.set(
              key,
              (
                result.get(
                  key,
                ) ?? 0
              ) + 1,
            );
          }
        }

        return result;
      },
      [
        products.products,
      ],
    );


  function productCount(
    category:
      (typeof catalog.categories)[number],
  ) {
    return (
      usage.get(
        normalize(
          category.slug,
        ),
      ) ??
      usage.get(
        normalize(
          category.name,
        ),
      ) ??
      0
    );
  }


  const filtered =
    useMemo(
      () => {
        const needle =
          normalize(
            search,
          );

        return catalog.categories.filter(
          (category) => {
            const count =
              productCount(
                category,
              );

            if (
              usageFilter ===
                "used" &&
              count === 0
            ) {
              return false;
            }

            if (
              usageFilter ===
                "unused" &&
              count > 0
            ) {
              return false;
            }

            if (!needle) {
              return true;
            }

            const parentName =
              category.parentId
                ? parentMap.get(
                    category.parentId,
                  ) ?? ""
                : "";

            return normalize(
              [
                category.name,
                category.slug,
                category.description ??
                  "",
                parentName,
              ].join(" "),
            ).includes(
              needle,
            );
          },
        );
      },
      [
        catalog.categories,
        parentMap,
        search,
        usage,
        usageFilter,
      ],
    );


  const activeCount =
    catalog.categories.filter(
      (category) =>
        category.active,
    ).length;

  const rootCount =
    catalog.categories.filter(
      (category) =>
        !category.parentId,
    ).length;

  const usedCount =
    catalog.categories.filter(
      (category) =>
        productCount(
          category,
        ) > 0,
    ).length;


  if (
    catalog.loading ||
    products.loading
  ) {
    return (
      <div className="min-h-[360px] border border-[#303238] bg-[#111214]">
        <IndesyDualOrbitLoader
          variant="data"
          label="Chargement des catégories"
        />
      </div>
    );
  }


  return (
    <div className="grid gap-4">
      <header className="flex flex-col gap-3 border-b border-[#303238] pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#ed1b2f]">
            Catalogue
          </p>

          <h1 className="mt-1 text-[21px] font-semibold tracking-[-0.035em] text-zinc-100">
            Catégories
          </h1>

          <p className="mt-1 max-w-3xl text-[10px] leading-5 text-zinc-500">
            Référentiel officiel de la Marketplace Indesy.
            Utilisez ces catégories pour classer vos produits.
          </p>
        </div>

        <button
          type="button"
          onClick={
            () =>
              void catalog.refresh()
          }
          className="inline-flex h-9 items-center justify-center gap-2 border border-[#303238] bg-[#151619] px-3 text-[10px] font-semibold text-zinc-400 transition hover:border-[#454951] hover:text-white"
        >
          <RefreshCw
            size={13}
          />

          Actualiser
        </button>
      </header>


      <section className="border border-[#3d92ff]/20 bg-[#3d92ff]/5 px-4 py-3">
        <p className="text-[10px] leading-5 text-zinc-400">
          Les catégories sont communes à toute la Marketplace.
          Un vendeur peut les consulter et les attribuer à ses produits,
          mais leur création, leur suppression et leur structure sont
          administrées par Indesy Mialy.
        </p>
      </section>


      <section className="grid grid-cols-2 gap-px border border-[#303238] bg-[#303238] xl:grid-cols-4">
        <article className="bg-[#151619] p-4">
          <span className="text-[8px] font-bold uppercase tracking-[0.1em] text-zinc-500">
            Catégories
          </span>

          <strong className="mt-2 block text-[23px] text-zinc-100">
            {
              catalog.categories
                .length
            }
          </strong>
        </article>


        <article className="bg-[#151619] p-4">
          <span className="text-[8px] font-bold uppercase tracking-[0.1em] text-zinc-500">
            Racines
          </span>

          <strong className="mt-2 block text-[23px] text-zinc-100">
            {rootCount}
          </strong>
        </article>


        <article className="bg-[#151619] p-4">
          <span className="text-[8px] font-bold uppercase tracking-[0.1em] text-zinc-500">
            Actives
          </span>

          <strong className="mt-2 block text-[23px] text-emerald-400">
            {activeCount}
          </strong>
        </article>


        <article className="bg-[#151619] p-4">
          <span className="text-[8px] font-bold uppercase tracking-[0.1em] text-zinc-500">
            Utilisées
          </span>

          <strong className="mt-2 block text-[23px] text-[#3d92ff]">
            {usedCount}
          </strong>
        </article>
      </section>


      {catalog.error ? (
        <p
          role="alert"
          className="border border-red-500/30 bg-red-500/5 p-3 text-[10px] text-red-400"
        >
          {catalog.error}
        </p>
      ) : null}


      {products.error ? (
        <p
          role="alert"
          className="border border-amber-500/30 bg-amber-500/5 p-3 text-[10px] text-amber-300"
        >
          Les catégories sont disponibles, mais le comptage des produits
          n’a pas pu être chargé : {products.error}
        </p>
      ) : null}


      <section className="overflow-hidden border border-[#303238] bg-[#111214]">
        <div className="grid gap-3 border-b border-[#303238] p-3 lg:grid-cols-[minmax(0,1fr)_auto]">
          <label className="relative block">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"
            />

            <input
              value={search}
              onChange={
                (event) =>
                  setSearch(
                    event.target
                      .value,
                  )
              }
              placeholder="Rechercher une catégorie, un slug ou un parent..."
              className="h-9 w-full border border-[#303238] bg-[#0d0f12] pl-8 pr-3 text-[10px] text-zinc-200 outline-none focus:border-[#3d92ff]"
            />
          </label>


          <div className="flex flex-wrap gap-1">
            {(
              [
                [
                  "all",
                  "Toutes",
                ],
                [
                  "used",
                  "Utilisées",
                ],
                [
                  "unused",
                  "Non utilisées",
                ],
              ] as const
            ).map(
              (
                [
                  value,
                  label,
                ],
              ) => (
                <button
                  key={value}
                  type="button"
                  onClick={
                    () =>
                      setUsageFilter(
                        value,
                      )
                  }
                  className={
                    usageFilter ===
                    value
                      ? "h-9 border border-[#3d92ff] bg-[#3d92ff]/10 px-3 text-[9px] font-semibold text-[#7ab7ff]"
                      : "h-9 border border-[#303238] bg-[#151619] px-3 text-[9px] font-semibold text-zinc-500 hover:text-zinc-200"
                  }
                >
                  {label}
                </button>
              ),
            )}
          </div>
        </div>


        {filtered.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px]">
              <thead>
                <tr className="border-b border-[#303238] bg-[#151619] text-left text-[8px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                  <th className="px-4 py-3">
                    Catégorie
                  </th>

                  <th className="px-3 py-3">
                    Parent
                  </th>

                  <th className="px-3 py-3">
                    Produits
                  </th>

                  <th className="px-3 py-3">
                    Statut
                  </th>
                </tr>
              </thead>


              <tbody className="divide-y divide-[#292c31]">
                {filtered.map(
                  (category) => {
                    const count =
                      productCount(
                        category,
                      );

                    return (
                      <tr
                        key={
                          category.id
                        }
                        className="hover:bg-[#16181b]"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className="grid size-8 shrink-0 place-items-center border border-[#303238] bg-[#151619] text-zinc-600">
                              <Tag
                                size={12}
                              />
                            </span>

                            <div>
                              <strong className="text-[10px] font-semibold text-zinc-200">
                                {
                                  category.name
                                }
                              </strong>

                              <p className="mt-0.5 text-[8px] text-zinc-600">
                                {
                                  category.slug
                                }
                              </p>

                              {category.description ? (
                                <p className="mt-1 max-w-xl text-[8px] leading-4 text-zinc-600">
                                  {
                                    category.description
                                  }
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </td>


                        <td className="px-3 py-3 text-[9px] text-zinc-500">
                          {category.parentId ? (
                            parentMap.get(
                              category.parentId,
                            ) ??
                            "—"
                          ) : (
                            <span className="inline-flex items-center gap-1.5">
                              <FolderTree
                                size={11}
                              />

                              Racine
                            </span>
                          )}
                        </td>


                        <td className="px-3 py-3">
                          <span
                            className={
                              count > 0
                                ? "inline-flex min-w-7 justify-center border border-[#3d92ff]/30 bg-[#3d92ff]/10 px-2 py-1 text-[9px] font-semibold text-[#75b5ff]"
                                : "text-[9px] text-zinc-600"
                            }
                          >
                            {count}
                          </span>
                        </td>


                        <td className="px-3 py-3">
                          <span
                            className={
                              category.active
                                ? "border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[8px] font-bold uppercase text-emerald-400"
                                : "border border-zinc-700 bg-zinc-900 px-2 py-1 text-[8px] font-bold uppercase text-zinc-500"
                            }
                          >
                            {category.active
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center">
            <Tag
              size={25}
              className="mx-auto text-zinc-700"
            />

            <p className="mt-3 text-[10px] font-semibold text-zinc-500">
              Aucune catégorie correspondante.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}