"use client";

import Link from "next/link";

import {
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  AlertTriangle,
  ArrowRight,
  Pencil,
  RefreshCw,
  Search,
  WalletCards,
  X,
} from "lucide-react";

import IndesyDualOrbitLoader from "@/components/loading/IndesyDualOrbitLoader";

import {
  useProducts,
} from "../hooks";

import type {
  MarketplaceProduct,
  ProductInput,
} from "../types";


type PricingFilter =
  | "all"
  | "sale"
  | "rental"
  | "used"
  | "incomplete";


function money(
  value:
    number | null,
) {
  return value === null
    ? "—"
    : `${value.toLocaleString(
        "fr-FR",
      )} Ar`;
}


function isIncomplete(
  product:
    MarketplaceProduct,
) {
  return product.type ===
    "rental"
    ? product
        .rentalPricePerDay ===
        null
    : product.salePrice ===
        null;
}


function productInput(
  product:
    MarketplaceProduct,
  pricing: {
    salePrice:
      number | null;

    rentalPricePerDay:
      number | null;

    depositAmount:
      number | null;
  },
): ProductInput {
  return {
    title:
      product.title,

    description:
      product.description,

    type:
      product.type,

    category:
      product.category,

    categorySlug:
      product.categorySlug,

    salePrice:
      pricing.salePrice,

    rentalPricePerDay:
      pricing.rentalPricePerDay,

    depositAmount:
      pricing.depositAmount,

    stock:
      product.stock,

    condition:
      product.condition,

    images:
      product.images,

    sellerId:
      product.sellerId,

    sellerName:
      product.sellerName,

    location:
      product.location,

    status:
      product.status,
  };
}


function parseOptionalAmount(
  value: string,
) {
  const normalized =
    value.trim();

  if (!normalized) {
    return null;
  }

  const amount =
    Number(
      normalized,
    );

  return Number.isFinite(
    amount,
  )
    ? amount
    : null;
}


export function SellerPricingFeature() {
  const data =
    useProducts();

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    filter,
    setFilter,
  ] =
    useState<PricingFilter>(
      "all",
    );

  const [
    editing,
    setEditing,
  ] =
    useState<MarketplaceProduct | null>(
      null,
    );

  const [
    salePrice,
    setSalePrice,
  ] =
    useState("");

  const [
    rentalPrice,
    setRentalPrice,
  ] =
    useState("");

  const [
    deposit,
    setDeposit,
  ] =
    useState("");

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    localError,
    setLocalError,
  ] =
    useState<string | null>(
      null,
    );

  const [
    notice,
    setNotice,
  ] =
    useState<string | null>(
      null,
    );


  const products =
    useMemo(
      () => {
        const needle =
          search
            .trim()
            .toLocaleLowerCase(
              "fr",
            );

        return data.products.filter(
          (product) => {
            if (
              filter ===
                "sale" &&
              product.type !==
                "sale"
            ) {
              return false;
            }

            if (
              filter ===
                "rental" &&
              product.type !==
                "rental"
            ) {
              return false;
            }

            if (
              filter ===
                "used" &&
              product.type !==
                "used"
            ) {
              return false;
            }

            if (
              filter ===
                "incomplete" &&
              !isIncomplete(
                product,
              )
            ) {
              return false;
            }

            if (!needle) {
              return true;
            }

            return [
              product.title,
              product.category,
              product.type,
            ]
              .join(" ")
              .toLocaleLowerCase(
                "fr",
              )
              .includes(
                needle,
              );
          },
        );
      },
      [
        data.products,
        filter,
        search,
      ],
    );


  const sales =
    data.products.filter(
      (product) =>
        product.type !==
          "rental" &&
        product.salePrice !==
          null,
    );


  const rentals =
    data.products.filter(
      (product) =>
        product.type ===
          "rental" &&
        product.rentalPricePerDay !==
          null,
    );


  const averageSale:
    number | null =
      sales.length
        ? Math.round(
            sales.reduce(
              (
                sum,
                product,
              ) =>
                sum +
                (
                  product.salePrice ??
                  0
                ),
              0,
            ) /
              sales.length,
          )
        : null;


  const averageRental:
    number | null =
      rentals.length
        ? Math.round(
            rentals.reduce(
              (
                sum,
                product,
              ) =>
                sum +
                (
                  product
                    .rentalPricePerDay ??
                  0
                ),
              0,
            ) /
              rentals.length,
          )
        : null;


  const missing =
    data.products.filter(
      isIncomplete,
    ).length;


  function openEditor(
    product:
      MarketplaceProduct,
  ) {
    setEditing(
      product,
    );

    setSalePrice(
      product.salePrice ===
        null
        ? ""
        : String(
            product.salePrice,
          ),
    );

    setRentalPrice(
      product
        .rentalPricePerDay ===
        null
        ? ""
        : String(
            product
              .rentalPricePerDay,
          ),
    );

    setDeposit(
      product.depositAmount ===
        null
        ? ""
        : String(
            product.depositAmount,
          ),
    );

    setLocalError(
      null,
    );

    setNotice(
      null,
    );
  }


  function closeEditor() {
    if (saving) {
      return;
    }

    setEditing(
      null,
    );

    setLocalError(
      null,
    );
  }


  async function savePricing(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!editing) {
      return;
    }

    setLocalError(
      null,
    );

    setNotice(
      null,
    );


    const nextSalePrice =
      parseOptionalAmount(
        salePrice,
      );

    const nextRentalPrice =
      parseOptionalAmount(
        rentalPrice,
      );

    const nextDeposit =
      parseOptionalAmount(
        deposit,
      );


    if (
      editing.type ===
        "rental"
    ) {
      if (
        nextRentalPrice ===
          null ||
        nextRentalPrice <
          0
      ) {
        setLocalError(
          "Le tarif de location par jour est obligatoire et doit être positif ou nul.",
        );

        return;
      }
    }
    else if (
      nextSalePrice ===
        null ||
      nextSalePrice <
        0
    ) {
      setLocalError(
        "Le prix de vente est obligatoire et doit être positif ou nul.",
      );

      return;
    }


    if (
      nextDeposit !==
        null &&
      nextDeposit <
        0
    ) {
      setLocalError(
        "La caution ne peut pas être négative.",
      );

      return;
    }


    setSaving(
      true,
    );

    try {
      await data.update(
        editing.id,
        productInput(
          editing,
          {
            salePrice:
              editing.type ===
              "rental"
                ? null
                : nextSalePrice,

            rentalPricePerDay:
              editing.type ===
              "rental"
                ? nextRentalPrice
                : null,

            depositAmount:
              editing.type ===
              "rental"
                ? nextDeposit
                : null,
          },
        ),
      );

      setEditing(
        null,
      );

      setNotice(
        `Tarif de « ${editing.title} » mis à jour.`,
      );
    }
    catch (cause) {
      setLocalError(
        cause instanceof Error
          ? cause.message
          : "Impossible de mettre à jour le tarif.",
      );
    }
    finally {
      setSaving(
        false,
      );
    }
  }


  if (data.loading) {
    return (
      <div className="min-h-[360px] border border-[#303238] bg-[#111214]">
        <IndesyDualOrbitLoader
          variant="data"
          label="Chargement des tarifs"
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
            Tarifs
          </h1>

          <p className="mt-1 max-w-3xl text-[10px] leading-5 text-zinc-500">
            Gérez directement les prix de vente,
            les tarifs de location et les cautions
            appliqués sur la Marketplace.
          </p>
        </div>


        <button
          type="button"
          onClick={
            () =>
              void data.refresh()
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
          Les montants affichés ici sont les tarifs réels
          utilisés par la Marketplace et le checkout.
          Les promotions et remises commerciales seront
          gérées séparément dans le module Promotions.
        </p>
      </section>


      <section className="grid grid-cols-2 gap-px border border-[#303238] bg-[#303238] lg:grid-cols-4">
        <article className="bg-[#151619] p-4">
          <span className="text-[8px] uppercase tracking-[0.1em] text-zinc-500">
            Produits tarifés
          </span>

          <strong className="mt-2 block text-[22px] text-zinc-100">
            {
              data.products.length -
              missing
            }
          </strong>
        </article>


        <article className="bg-[#151619] p-4">
          <span className="text-[8px] uppercase tracking-[0.1em] text-zinc-500">
            Prix vente moyen
          </span>

          <strong className="mt-2 block text-[16px] text-emerald-400">
            {
              money(
                averageSale,
              )
            }
          </strong>
        </article>


        <article className="bg-[#151619] p-4">
          <span className="text-[8px] uppercase tracking-[0.1em] text-zinc-500">
            Location / jour moyenne
          </span>

          <strong className="mt-2 block text-[16px] text-[#3d92ff]">
            {
              money(
                averageRental,
              )
            }
          </strong>
        </article>


        <article className="bg-[#151619] p-4">
          <span className="text-[8px] uppercase tracking-[0.1em] text-zinc-500">
            Tarifs incomplets
          </span>

          <strong
            className={
              `mt-2 block text-[22px] ${
                missing
                  ? "text-amber-400"
                  : "text-emerald-400"
              }`
            }
          >
            {missing}
          </strong>
        </article>
      </section>


      {data.error ? (
        <p
          role="alert"
          className="border border-red-500/30 bg-red-500/5 p-3 text-[10px] text-red-400"
        >
          {data.error}
        </p>
      ) : null}


      {notice ? (
        <p
          role="status"
          className="border border-emerald-500/30 bg-emerald-500/5 p-3 text-[10px] text-emerald-400"
        >
          {notice}
        </p>
      ) : null}


      <section className="overflow-hidden border border-[#303238] bg-[#111214]">
        <div className="grid gap-2 border-b border-[#303238] p-3 lg:grid-cols-[minmax(0,1fr)_180px]">
          <label className="relative block">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"
            />

            <input
              value={
                search
              }
              onChange={
                (event) =>
                  setSearch(
                    event.target.value,
                  )
              }
              placeholder="Rechercher un produit..."
              className="h-9 w-full border border-[#303238] bg-[#0d0f12] pl-8 pr-3 text-[10px] text-zinc-200 outline-none focus:border-[#3d92ff]"
            />
          </label>


          <select
            value={
              filter
            }
            onChange={
              (event) =>
                setFilter(
                  event.target
                    .value as
                    PricingFilter,
                )
            }
            className="h-9 border border-[#303238] bg-[#0d0f12] px-3 text-[9px] text-zinc-400 outline-none focus:border-[#3d92ff]"
          >
            <option value="all">
              Tous les tarifs
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

            <option value="incomplete">
              Tarifs incomplets
            </option>
          </select>
        </div>


        {products.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead>
                <tr className="border-b border-[#303238] bg-[#151619] text-left text-[8px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                  <th className="px-4 py-3">
                    Produit
                  </th>

                  <th className="px-3 py-3">
                    Type
                  </th>

                  <th className="px-3 py-3">
                    Vente
                  </th>

                  <th className="px-3 py-3">
                    Location / jour
                  </th>

                  <th className="px-3 py-3">
                    Caution
                  </th>

                  <th className="px-3 py-3">
                    État tarifaire
                  </th>

                  <th className="px-4 py-3 text-right">
                    Actions
                  </th>
                </tr>
              </thead>


              <tbody className="divide-y divide-[#292c31]">
                {products.map(
                  (product) => {
                    const incomplete =
                      isIncomplete(
                        product,
                      );

                    return (
                      <tr
                        key={
                          product.id
                        }
                        className="hover:bg-[#16181b]"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className="grid size-8 shrink-0 place-items-center border border-[#303238] text-zinc-600">
                              <WalletCards
                                size={12}
                              />
                            </span>

                            <div>
                              <strong className="text-[10px] text-zinc-200">
                                {
                                  product.title
                                }
                              </strong>

                              <p className="mt-0.5 text-[8px] text-zinc-600">
                                {
                                  product.category ||
                                  "Sans catégorie"
                                }
                              </p>
                            </div>
                          </div>
                        </td>


                        <td className="px-3 py-3 text-[9px] text-zinc-400">
                          {product.type ===
                          "sale"
                            ? "Vente"
                            : product.type ===
                                "rental"
                              ? "Location"
                              : "Occasion"}
                        </td>


                        <td className="px-3 py-3 text-[10px] font-semibold text-zinc-300">
                          {
                            money(
                              product.salePrice,
                            )
                          }
                        </td>


                        <td className="px-3 py-3 text-[10px] font-semibold text-zinc-300">
                          {
                            money(
                              product.rentalPricePerDay,
                            )
                          }
                        </td>


                        <td className="px-3 py-3 text-[10px] text-zinc-400">
                          {
                            money(
                              product.depositAmount,
                            )
                          }
                        </td>


                        <td className="px-3 py-3">
                          {incomplete ? (
                            <span className="inline-flex items-center gap-1.5 border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[8px] font-semibold text-amber-400">
                              <AlertTriangle
                                size={10}
                              />

                              Incomplet
                            </span>
                          ) : (
                            <span className="border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[8px] font-semibold text-emerald-400">
                              Tarif actif
                            </span>
                          )}
                        </td>


                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={
                                () =>
                                  openEditor(
                                    product,
                                  )
                              }
                              className="inline-flex h-8 items-center gap-1.5 border border-[#3d92ff]/40 bg-[#3d92ff]/5 px-2.5 text-[8px] font-semibold text-[#70afff] hover:bg-[#3d92ff]/10"
                            >
                              <Pencil
                                size={10}
                              />

                              Modifier le tarif
                            </button>


                            <Link
                              href={`/dashboard/vendeur/products/${product.id}`}
                              className="inline-flex h-8 items-center gap-1 border border-[#303238] px-2.5 text-[8px] font-semibold text-zinc-500 hover:border-[#454951] hover:text-zinc-200"
                            >
                              Fiche produit

                              <ArrowRight
                                size={10}
                              />
                            </Link>
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
          <div className="grid min-h-56 place-items-center px-6 text-center">
            <div>
              <WalletCards
                size={24}
                className="mx-auto text-zinc-700"
              />

              <p className="mt-3 text-[10px] font-semibold text-zinc-500">
                Aucun tarif correspondant.
              </p>
            </div>
          </div>
        )}
      </section>


      {editing ? (
        <div
          className="fixed inset-0 z-[10000] grid place-items-center bg-black/75 p-4 backdrop-blur-sm"
          onMouseDown={
            (event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                closeEditor();
              }
            }
          }
        >
          <form
            onSubmit={
              savePricing
            }
            className="w-full max-w-lg overflow-hidden border border-[#303238] bg-[#0d0f12] shadow-2xl"
          >
            <header className="flex items-start justify-between border-b border-[#303238] bg-[#111214] px-4 py-3">
              <div>
                <p className="text-[8px] font-bold uppercase tracking-[0.13em] text-[#3d92ff]">
                  Tarification
                </p>

                <h2 className="mt-1 text-[13px] font-semibold text-zinc-100">
                  {
                    editing.title
                  }
                </h2>

                <p className="mt-1 text-[8px] text-zinc-600">
                  {editing.type ===
                  "rental"
                    ? "Produit en location"
                    : editing.type ===
                        "used"
                      ? "Produit d’occasion"
                      : "Produit en vente"}
                </p>
              </div>


              <button
                type="button"
                aria-label="Fermer"
                disabled={
                  saving
                }
                onClick={
                  closeEditor
                }
                className="grid size-8 place-items-center text-zinc-600 hover:text-white disabled:opacity-40"
              >
                <X
                  size={15}
                />
              </button>
            </header>


            <div className="grid gap-4 p-4">
              {editing.type !==
              "rental" ? (
                <label className="grid gap-1.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                  Prix de vente *

                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      required
                      value={
                        salePrice
                      }
                      disabled={
                        saving
                      }
                      onChange={
                        (event) =>
                          setSalePrice(
                            event.target
                              .value,
                          )
                      }
                      className="h-10 w-full border border-[#303238] bg-[#111214] px-3 pr-12 text-[11px] text-zinc-100 outline-none focus:border-[#3d92ff]"
                    />

                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-zinc-600">
                      Ar
                    </span>
                  </div>
                </label>
              ) : (
                <>
                  <label className="grid gap-1.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                    Location / jour *

                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        required
                        value={
                          rentalPrice
                        }
                        disabled={
                          saving
                        }
                        onChange={
                          (event) =>
                            setRentalPrice(
                              event.target
                                .value,
                            )
                        }
                        className="h-10 w-full border border-[#303238] bg-[#111214] px-3 pr-12 text-[11px] text-zinc-100 outline-none focus:border-[#3d92ff]"
                      />

                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-zinc-600">
                        Ar
                      </span>
                    </div>
                  </label>


                  <label className="grid gap-1.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                    Caution

                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={
                          deposit
                        }
                        disabled={
                          saving
                        }
                        onChange={
                          (event) =>
                            setDeposit(
                              event.target
                                .value,
                            )
                        }
                        placeholder="Facultatif"
                        className="h-10 w-full border border-[#303238] bg-[#111214] px-3 pr-12 text-[11px] text-zinc-100 outline-none placeholder:text-zinc-700 focus:border-[#3d92ff]"
                      />

                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-zinc-600">
                        Ar
                      </span>
                    </div>
                  </label>


                  <div className="border border-[#303238] bg-[#111214] p-3">
                    <p className="text-[8px] leading-4 text-zinc-500">
                      La caution est distincte du tarif journalier.
                      Elle reste enregistrée avec le produit
                      et peut être utilisée lors du processus de location.
                    </p>
                  </div>
                </>
              )}


              {localError ? (
                <p
                  role="alert"
                  className="border border-red-500/30 bg-red-500/5 px-3 py-2 text-[9px] leading-4 text-red-400"
                >
                  {localError}
                </p>
              ) : null}
            </div>


            <footer className="flex items-center justify-end gap-2 border-t border-[#303238] bg-[#111214] px-4 py-3">
              <button
                type="button"
                disabled={
                  saving
                }
                onClick={
                  closeEditor
                }
                className="h-9 border border-[#303238] px-4 text-[9px] font-semibold text-zinc-500 hover:text-white disabled:opacity-40"
              >
                Annuler
              </button>


              <button
                type="submit"
                disabled={
                  saving
                }
                className="h-9 border border-[#ed1b2f] bg-[#ed1b2f] px-4 text-[9px] font-semibold text-white hover:bg-[#ff3045] disabled:cursor-wait disabled:opacity-50"
              >
                {saving
                  ? "Enregistrement…"
                  : "Enregistrer le tarif"}
              </button>
            </footer>
          </form>
        </div>
      ) : null}
    </div>
  );
}