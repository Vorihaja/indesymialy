"use client";

import Link from "next/link";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  AlertTriangle,
  BellRing,
  Boxes,
  CheckCircle2,
  ClipboardCheck,
  PackageCheck,
  RefreshCw,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  X,
} from "lucide-react";

import IndesyDualOrbitLoader from "@/components/loading/IndesyDualOrbitLoader";
import {
  useIndesyDialog,
} from "@/components/ui/indesy-dialog";

import {
  useAdvancedInventory,
} from "../advanced";

import type {
  AdvancedInventoryProduct,
  AdvancedStockMovement,
  InventoryPhysicalCountInput,
  StockMovementType,
} from "../advanced";

type StockTab =
  | "overview"
  | "products"
  | "movements"
  | "reservations"
  | "counts"
  | "alerts";

type ProductFilter =
  | "all"
  | "available"
  | "low"
  | "out";

type MovementFilter =
  | "all"
  | StockMovementType;

type EditorMode =
  | "adjust"
  | "threshold";

const tabs: Array<{
  id: StockTab;
  label: string;
}> = [
  {
    id: "overview",
    label: "Vue d’ensemble",
  },
  {
    id: "products",
    label: "Produits",
  },
  {
    id: "movements",
    label: "Mouvements",
  },
  {
    id: "reservations",
    label: "Réservations",
  },
  {
    id: "counts",
    label: "Inventaires",
  },
  {
    id: "alerts",
    label: "Alertes",
  },
];

const fieldClass =
  "h-9 border border-[#303238] bg-[#0d0f12] px-3 text-[9px] text-zinc-200 outline-none placeholder:text-zinc-700 focus:border-[#3d92ff]";

function movementLabel(
  type: StockMovementType,
) {
  switch (type) {
    case "in":
      return "Entrée";

    case "out":
      return "Sortie";

    case "reserve":
      return "Réservation";

    case "release":
      return "Libération";

    case "adjustment":
      return "Ajustement";
  }
}

function signedQuantity(
  movement:
    AdvancedStockMovement,
) {
  if (
    movement.type === "in" ||
    movement.type === "release"
  ) {
    return movement.quantity;
  }

  if (
    movement.type === "out" ||
    movement.type === "reserve"
  ) {
    return -movement.quantity;
  }

  return movement.quantity;
}

function stockState(
  product:
    AdvancedInventoryProduct,
) {
  if (
    product.available === 0
  ) {
    return {
      label: "Rupture",
      className:
        "border-red-500/30 bg-red-500/10 text-red-400",
    };
  }

  if (
    product.available <=
    product.lowStockThreshold
  ) {
    return {
      label: "Stock faible",
      className:
        "border-amber-500/30 bg-amber-500/10 text-amber-400",
    };
  }

  return {
    label: "Disponible",
    className:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  };
}

function shortId(
  value: string,
) {
  return value.length > 12
    ? value.slice(
        0,
        8,
      )
    : value;
}

export function InventoryFeature() {
  const dialog = useIndesyDialog();
  const inventory =
    useAdvancedInventory();

  const data =
    inventory.data;

  const [
    tab,
    setTab,
  ] =
    useState<StockTab>(
      "overview",
    );

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    productFilter,
    setProductFilter,
  ] =
    useState<ProductFilter>(
      "all",
    );

  const [
    movementFilter,
    setMovementFilter,
  ] =
    useState<MovementFilter>(
      "all",
    );

  const [
    editorProduct,
    setEditorProduct,
  ] =
    useState<AdvancedInventoryProduct | null>(
      null,
    );

  const [
    editorMode,
    setEditorMode,
  ] =
    useState<EditorMode>(
      "adjust",
    );

  const [
    delta,
    setDelta,
  ] =
    useState("1");

  const [
    reason,
    setReason,
  ] =
    useState(
      "Réception marchandise",
    );

  const [
    threshold,
    setThreshold,
  ] =
    useState("0");

  const [
    formError,
    setFormError,
  ] =
    useState<string | null>(
      null,
    );

  const [
    countNote,
    setCountNote,
  ] =
    useState(
      "Inventaire physique",
    );

  const [
    countValues,
    setCountValues,
  ] =
    useState<Record<string, string>>(
      {},
    );

  useEffect(
    () => {
      if (
        !data?.activeCount
      ) {
        setCountValues(
          {},
        );

        return;
      }

      setCountValues(
        Object.fromEntries(
          data.activeCount.lines.map(
            (line) => [
              line.productId,

              line.countedPhysical ===
                null
                ? ""
                : String(
                    line.countedPhysical,
                  ),
            ],
          ),
        ),
      );
    },
    [
      data?.activeCount,
    ],
  );

  const productRows =
    useMemo(
      () => {
        if (!data) {
          return [];
        }

        const needle =
          search
            .trim()
            .toLocaleLowerCase(
              "fr",
            );

        return data.products.filter(
          (product) => {
            const out =
              product.available ===
              0;

            const low =
              !out &&
              product.available <=
                product.lowStockThreshold;

            if (
              productFilter ===
                "out" &&
              !out
            ) {
              return false;
            }

            if (
              productFilter ===
                "low" &&
              !low
            ) {
              return false;
            }

            if (
              productFilter ===
                "available" &&
              (
                out ||
                low
              )
            ) {
              return false;
            }

            return (
              !needle ||
              product.title
                .toLocaleLowerCase(
                  "fr",
                )
                .includes(
                  needle,
                )
            );
          },
        );
      },
      [
        data,
        productFilter,
        search,
      ],
    );

  const movementRows =
    useMemo(
      () => {
        if (!data) {
          return [];
        }

        const needle =
          search
            .trim()
            .toLocaleLowerCase(
              "fr",
            );

        return data.movements.filter(
          (movement) => {
            if (
              movementFilter !==
                "all" &&
              movement.type !==
                movementFilter
            ) {
              return false;
            }

            return (
              !needle ||
              [
                movement.productTitle,
                movement.reason,
                movement.orderId ??
                  "",
              ]
                .join(" ")
                .toLocaleLowerCase(
                  "fr",
                )
                .includes(
                  needle,
                )
            );
          },
        );
      },
      [
        data,
        movementFilter,
        search,
      ],
    );

  if (
    inventory.loading ||
    !data
  ) {
    return (
      <div className="min-h-[420px]">
        <IndesyDualOrbitLoader
          variant="data"
          label="Chargement de la gestion de stock"
        />
      </div>
    );
  }

  const physical =
    data.products.reduce(
      (
        sum,
        product,
      ) =>
        sum +
        product.physical,
      0,
    );

  const available =
    data.products.reduce(
      (
        sum,
        product,
      ) =>
        sum +
        product.available,
      0,
    );

  const reserved =
    data.products.reduce(
      (
        sum,
        product,
      ) =>
        sum +
        product.reserved,
      0,
    );

  const lowStock =
    data.products.filter(
      (product) =>
        product.available >
          0 &&
        product.available <=
          product.lowStockThreshold,
    );

  const outOfStock =
    data.products.filter(
      (product) =>
        product.available ===
        0,
    );

  const alertProducts =
    data.products.filter(
      (product) =>
        product.available ===
          0 ||
        product.available <=
          product.lowStockThreshold,
    );

  function openAdjust(
    product:
      AdvancedInventoryProduct,
  ) {
    setEditorProduct(
      product,
    );

    setEditorMode(
      "adjust",
    );

    setDelta("1");

    setReason(
      "Réception marchandise",
    );

    setFormError(
      null,
    );
  }

  function openThreshold(
    product:
      AdvancedInventoryProduct,
  ) {
    setEditorProduct(
      product,
    );

    setEditorMode(
      "threshold",
    );

    setThreshold(
      String(
        product.lowStockThreshold,
      ),
    );

    setFormError(
      null,
    );
  }

  function closeEditor() {
    if (
      inventory.mutating
    ) {
      return;
    }

    setEditorProduct(
      null,
    );

    setFormError(
      null,
    );
  }

  async function submitEditor(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!editorProduct) {
      return;
    }

    setFormError(
      null,
    );

    try {
      if (
        editorMode ===
        "adjust"
      ) {
        const amount =
          Number(
            delta,
          );

        if (
          !Number.isInteger(
            amount,
          ) ||
          amount === 0
        ) {
          throw new Error(
            "La variation doit être un entier différent de zéro.",
          );
        }

        await inventory.adjust(
          editorProduct.productId,
          amount,
          reason,
        );
      }
      else {
        const value =
          Number(
            threshold,
          );

        if (
          !Number.isInteger(
            value,
          ) ||
          value < 0
        ) {
          throw new Error(
            "Le seuil doit être un entier positif ou nul.",
          );
        }

        await inventory.setThreshold(
          editorProduct.productId,
          value,
        );
      }

      closeEditor();
    }
    catch (cause) {
      setFormError(
        cause instanceof Error
          ? cause.message
          : "Opération impossible.",
      );
    }
  }

  function physicalCountPayload():
    InventoryPhysicalCountInput[] {
    const count =
      data?.activeCount ?? null;

    if (!count) {
      return [];
    }

    return count.lines
      .map(
        (line) => {
          const raw =
            countValues[
              line.productId
            ] ??
            "";

          if (
            raw.trim() === ""
          ) {
            return null;
          }

          const value =
            Number(
              raw,
            );

          if (
            !Number.isInteger(
              value,
            ) ||
            value < 0
          ) {
            throw new Error(
              `Comptage invalide pour ${line.productTitle}.`,
            );
          }

          return {
            productId:
              line.productId,

            countedPhysical:
              value,
          };
        },
      )
      .filter(
        (
          item,
        ): item is
          InventoryPhysicalCountInput =>
            item !==
            null,
      );
  }

  async function savePhysicalCount() {
    const count =
      data?.activeCount ?? null;

    if (!count) {
      return;
    }

    await inventory.saveCount(
      count.id,
      physicalCountPayload(),
    );
  }

  async function finalizePhysicalCount() {
    const count =
      data?.activeCount ?? null;

    if (!count) {
      return;
    }

    const values =
      physicalCountPayload();

    if (
      values.length !==
      count.lines.length
    ) {
      await dialog.alert({
        title: "Inventaire incomplet",
        description:
          "Tous les produits doivent être comptés avant la validation.",
        tone: "warning",
      });

      return;
    }

    await inventory.saveCount(
      count.id,
      values,
    );

    const confirmed =
      await dialog.confirm({
        title:
          "Valider définitivement cet inventaire ?",
        description:
          "Les écarts modifieront le stock disponible sans toucher aux réservations.",
        confirmLabel:
          "Valider l’inventaire",
        cancelLabel: "Annuler",
        tone: "warning",
      });

    if (!confirmed) {
      return;
    }

    await inventory.finalizeCount(
      count.id,
    );
  }

  async function cancelPhysicalCount() {
    const count =
      data?.activeCount ?? null;

    if (!count) {
      return;
    }

    const confirmed =
      await dialog.confirm({
        title: "Annuler cet inventaire ?",
        description:
          "Aucun stock ne sera modifié.",
        confirmLabel:
          "Annuler l’inventaire",
        cancelLabel: "Conserver",
        tone: "danger",
      });

    if (!confirmed) {
      return;
    }

    await inventory
      .cancelCount(count.id)
      .catch(() => undefined);
  }

  return (
    <div className="grid gap-4 text-zinc-100">
      <header className="flex flex-col gap-3 border-b border-[#303238] pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[8px] font-bold uppercase tracking-[0.15em] text-[#3d92ff]">
            Opérations vendeur
          </p>

          <h1 className="mt-1 text-[22px] font-semibold tracking-[-0.035em] text-white">
            Gestion de stock
          </h1>

          <p className="mt-1 max-w-3xl text-[9px] leading-5 text-zinc-600">
            Stock physique, disponibilité Marketplace, réservations, mouvements, inventaires et alertes.
          </p>
        </div>

        <button
          type="button"
          disabled={
            inventory.mutating
          }
          onClick={
            () =>
              void inventory
                .refresh()
                .catch(
                  () => undefined,
                )
          }
          className="inline-flex h-8 items-center gap-1.5 border border-[#303238] bg-[#151619] px-3 text-[8px] font-semibold text-zinc-400 hover:border-[#3d92ff]/50 hover:text-white disabled:opacity-40"
        >
          <RefreshCw
            size={11}
          />

          Actualiser
        </button>
      </header>

      <nav className="flex gap-1 overflow-x-auto border-b border-[#303238]">
        {tabs.map(
          (item) => (
            <button
              key={
                item.id
              }
              type="button"
              onClick={
                () => {
                  setTab(
                    item.id,
                  );

                  setSearch("");
                }
              }
              className={
                tab === item.id
                  ? "shrink-0 border-b-2 border-[#ed1b2f] px-3 py-2 text-[8px] font-semibold text-white"
                  : "shrink-0 border-b-2 border-transparent px-3 py-2 text-[8px] font-semibold text-zinc-600 hover:text-zinc-300"
              }
            >
              {item.label}
            </button>
          ),
        )}
      </nav>

      {inventory.error ? (
        <div
          role="alert"
          className="border border-blue-500/30 bg-blue-500/5 px-3 py-2 text-[9px] text-blue-400"
        >
          {inventory.error}
        </div>
      ) : null}

      {tab === "overview" ? (
        <div className="grid gap-4">
          <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <article className="border border-[#303238] bg-[#111214] p-4">
              <p className="text-[7px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                Stock physique
              </p>

              <strong className="mt-2 block text-2xl text-white">
                {physical}
              </strong>

              <p className="mt-1 text-[8px] text-zinc-600">
                Disponible + réservé
              </p>
            </article>

            <article className="border border-[#303238] bg-[#111214] p-4">
              <p className="text-[7px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                Disponible
              </p>

              <strong className="mt-2 block text-2xl text-emerald-400">
                {available}
              </strong>
            </article>

            <article className="border border-[#303238] bg-[#111214] p-4">
              <p className="text-[7px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                Réservé
              </p>

              <strong className="mt-2 block text-2xl text-[#3d92ff]">
                {reserved}
              </strong>
            </article>

            <article className="border border-[#303238] bg-[#111214] p-4">
              <p className="text-[7px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                Alertes
              </p>

              <strong className="mt-2 block text-2xl text-amber-400">
                {alertProducts.length}
              </strong>
            </article>
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <article className="border border-[#303238] bg-[#111214]">
              <header className="border-b border-[#303238] px-4 py-3">
                <h2 className="text-[10px] font-semibold">
                  À traiter
                </h2>
              </header>

              <div className="divide-y divide-[#292c31]">
                <button
                  type="button"
                  onClick={
                    () =>
                      setTab(
                        "alerts",
                      )
                  }
                  className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-[#151619]"
                >
                  <span className="flex items-center gap-2 text-[9px] text-zinc-400">
                    <AlertTriangle
                      size={12}
                      className="text-red-400"
                    />

                    Produits en rupture
                  </span>

                  <strong className="text-[10px] text-red-400">
                    {outOfStock.length}
                  </strong>
                </button>

                <button
                  type="button"
                  onClick={
                    () =>
                      setTab(
                        "alerts",
                      )
                  }
                  className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-[#151619]"
                >
                  <span className="flex items-center gap-2 text-[9px] text-zinc-400">
                    <BellRing
                      size={12}
                      className="text-amber-400"
                    />

                    Stock faible
                  </span>

                  <strong className="text-[10px] text-amber-400">
                    {lowStock.length}
                  </strong>
                </button>

                <button
                  type="button"
                  onClick={
                    () =>
                      setTab(
                        "reservations",
                      )
                  }
                  className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-[#151619]"
                >
                  <span className="flex items-center gap-2 text-[9px] text-zinc-400">
                    <ShoppingCart
                      size={12}
                      className="text-[#3d92ff]"
                    />

                    Réservations actives
                  </span>

                  <strong className="text-[10px] text-[#72b2ff]">
                    {data.reservations.length}
                  </strong>
                </button>
              </div>
            </article>

            <article className="border border-[#303238] bg-[#111214]">
              <header className="border-b border-[#303238] px-4 py-3">
                <h2 className="text-[10px] font-semibold">
                  Derniers mouvements
                </h2>
              </header>

              <div className="divide-y divide-[#292c31]">
                {data.movements
                  .slice(
                    0,
                    6,
                  )
                  .map(
                    (movement) => {
                      const signed =
                        signedQuantity(
                          movement,
                        );

                      return (
                        <div
                          key={
                            movement.id
                          }
                          className="flex items-center justify-between gap-3 px-4 py-3"
                        >
                          <div>
                            <strong className="text-[8px] text-zinc-300">
                              {movement.productTitle}
                            </strong>

                            <p className="mt-1 text-[7px] text-zinc-600">
                              {movementLabel(
                                movement.type,
                              )}
                              {" · "}
                              {movement.reason}
                            </p>
                          </div>

                          <strong
                            className={
                              signed >= 0
                                ? "text-[10px] text-emerald-400"
                                : "text-[10px] text-red-400"
                            }
                          >
                            {signed > 0
                              ? "+"
                              : ""}
                            {signed}
                          </strong>
                        </div>
                      );
                    },
                  )}

                {!data.movements.length ? (
                  <p className="px-4 py-8 text-center text-[9px] text-zinc-600">
                    Aucun mouvement.
                  </p>
                ) : null}
              </div>
            </article>
          </section>
        </div>
      ) : null}

      {tab === "products" ? (
        <section className="border border-[#303238] bg-[#111214]">
          <div className="grid gap-2 border-b border-[#303238] p-3 sm:grid-cols-[1fr_190px]">
            <label className="relative">
              <Search
                size={12}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"
              />

              <input
                value={search}
                onChange={
                  (event) =>
                    setSearch(
                      event.target.value,
                    )
                }
                placeholder="Rechercher un produit..."
                className={`${fieldClass} w-full pl-8`}
              />
            </label>

            <select
              value={
                productFilter
              }
              onChange={
                (event) =>
                  setProductFilter(
                    event.target.value as
                      ProductFilter,
                  )
              }
              className={fieldClass}
            >
              <option value="all">
                Tous les stocks
              </option>

              <option value="available">
                Disponibles
              </option>

              <option value="low">
                Stock faible
              </option>

              <option value="out">
                Ruptures
              </option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[930px]">
              <thead>
                <tr className="border-b border-[#303238] bg-[#151619] text-left text-[7px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                  <th className="px-4 py-3">
                    Produit
                  </th>
                  <th className="px-3 py-3">
                    Physique
                  </th>
                  <th className="px-3 py-3">
                    Disponible
                  </th>
                  <th className="px-3 py-3">
                    Réservé
                  </th>
                  <th className="px-3 py-3">
                    Seuil
                  </th>
                  <th className="px-3 py-3">
                    État
                  </th>
                  <th className="px-4 py-3 text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#292c31]">
                {productRows.map(
                  (product) => {
                    const state =
                      stockState(
                        product,
                      );

                    return (
                      <tr
                        key={
                          product.productId
                        }
                        className="hover:bg-[#151619]"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="grid size-8 place-items-center border border-[#303238] text-zinc-600">
                              <Boxes
                                size={12}
                              />
                            </span>

                            <strong className="text-[9px] text-zinc-200">
                              {product.title}
                            </strong>
                          </div>
                        </td>

                        <td className="px-3 py-3 text-[10px] font-semibold text-white">
                          {product.physical}
                        </td>

                        <td className="px-3 py-3 text-[10px] font-semibold text-emerald-400">
                          {product.available}
                        </td>

                        <td className="px-3 py-3 text-[10px] font-semibold text-[#72b2ff]">
                          {product.reserved}
                        </td>

                        <td className="px-3 py-3 text-[9px] text-zinc-500">
                          {product.lowStockThreshold}
                        </td>

                        <td className="px-3 py-3">
                          <span
                            className={
                              "inline-flex border px-2 py-1 text-[8px] font-semibold " +
                              state.className
                            }
                          >
                            {state.label}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={
                                () =>
                                  openAdjust(
                                    product,
                                  )
                              }
                              className="h-8 border border-[#303238] px-2 text-[8px] font-semibold text-zinc-400 hover:border-[#3d92ff]/50 hover:text-white"
                            >
                              Ajuster
                            </button>

                            <button
                              type="button"
                              onClick={
                                () =>
                                  openThreshold(
                                    product,
                                  )
                              }
                              className="h-8 border border-[#303238] px-2 text-[8px] font-semibold text-zinc-400 hover:border-amber-500/40 hover:text-amber-300"
                            >
                              Seuil
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  },
                )}

                {!productRows.length ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-12 text-center text-[9px] text-zinc-600"
                    >
                      Aucun produit correspondant.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {tab === "movements" ? (
        <section className="border border-[#303238] bg-[#111214]">
          <div className="grid gap-2 border-b border-[#303238] p-3 sm:grid-cols-[1fr_190px]">
            <label className="relative">
              <Search
                size={12}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"
              />

              <input
                value={search}
                onChange={
                  (event) =>
                    setSearch(
                      event.target.value,
                    )
                }
                placeholder="Produit, motif ou commande..."
                className={`${fieldClass} w-full pl-8`}
              />
            </label>

            <select
              value={
                movementFilter
              }
              onChange={
                (event) =>
                  setMovementFilter(
                    event.target.value as
                      MovementFilter,
                  )
              }
              className={fieldClass}
            >
              <option value="all">
                Tous les mouvements
              </option>

              <option value="in">
                Entrées
              </option>

              <option value="out">
                Sorties
              </option>

              <option value="reserve">
                Réservations
              </option>

              <option value="release">
                Libérations
              </option>

              <option value="adjustment">
                Ajustements
              </option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-[#303238] bg-[#151619] text-left text-[7px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                  <th className="px-4 py-3">
                    Date
                  </th>
                  <th className="px-3 py-3">
                    Mouvement
                  </th>
                  <th className="px-3 py-3">
                    Produit
                  </th>
                  <th className="px-3 py-3">
                    Qté
                  </th>
                  <th className="px-3 py-3">
                    Motif
                  </th>
                  <th className="px-3 py-3">
                    Commande
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#292c31]">
                {movementRows.map(
                  (movement) => {
                    const signed =
                      signedQuantity(
                        movement,
                      );

                    return (
                      <tr
                        key={
                          movement.id
                        }
                        className="hover:bg-[#151619]"
                      >
                        <td className="px-4 py-3 text-[8px] text-zinc-600">
                          {new Date(
                            movement.createdAt,
                          ).toLocaleString(
                            "fr-FR",
                          )}
                        </td>

                        <td className="px-3 py-3 text-[8px] font-semibold text-zinc-300">
                          {movementLabel(
                            movement.type,
                          )}
                        </td>

                        <td className="px-3 py-3 text-[9px] font-semibold text-zinc-200">
                          {movement.productTitle}
                        </td>

                        <td
                          className={
                            signed >= 0
                              ? "px-3 py-3 text-[10px] font-semibold text-emerald-400"
                              : "px-3 py-3 text-[10px] font-semibold text-red-400"
                          }
                        >
                          {signed > 0
                            ? "+"
                            : ""}
                          {signed}
                        </td>

                        <td className="max-w-[320px] px-3 py-3 text-[8px] text-zinc-500">
                          {movement.reason}
                        </td>

                        <td className="px-3 py-3">
                          {movement.orderId ? (
                            <Link
                              href={`/dashboard/vendeur/orders/${movement.orderId}`}
                              className="text-[8px] font-semibold text-[#3d92ff] hover:text-[#72b2ff]"
                            >
                              {shortId(
                                movement.orderId,
                              )}
                            </Link>
                          ) : (
                            <span className="text-[8px] text-zinc-700">
                              —
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  },
                )}

                {!movementRows.length ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-12 text-center text-[9px] text-zinc-600"
                    >
                      Aucun mouvement correspondant.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {tab === "reservations" ? (
        <section className="border border-[#303238] bg-[#111214]">
          <header className="border-b border-[#303238] px-4 py-3">
            <h2 className="text-[10px] font-semibold">
              Stock immobilisé par les commandes
            </h2>

            <p className="mt-1 text-[8px] text-zinc-600">
              Les réservations sont libérées ou consommées uniquement par le workflow Commandes.
            </p>
          </header>

          {data.reservations.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px]">
                <thead>
                  <tr className="border-b border-[#303238] bg-[#151619] text-left text-[7px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                    <th className="px-4 py-3">
                      Commande
                    </th>
                    <th className="px-3 py-3">
                      Client
                    </th>
                    <th className="px-3 py-3">
                      Produit
                    </th>
                    <th className="px-3 py-3">
                      Réservé
                    </th>
                    <th className="px-3 py-3">
                      Statut
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#292c31]">
                  {data.reservations.map(
                    (reservation) => (
                      <tr
                        key={
                          reservation.key
                        }
                        className="hover:bg-[#151619]"
                      >
                        <td className="px-4 py-3">
                          <Link
                            href={`/dashboard/vendeur/orders/${reservation.orderId}`}
                            className="text-[8px] font-semibold text-[#3d92ff] hover:text-[#72b2ff]"
                          >
                            {shortId(
                              reservation.orderId,
                            )}
                          </Link>
                        </td>

                        <td className="px-3 py-3 text-[8px] text-zinc-500">
                          {reservation.customerName}
                        </td>

                        <td className="px-3 py-3 text-[9px] font-semibold text-zinc-200">
                          {reservation.productTitle}
                        </td>

                        <td className="px-3 py-3 text-[10px] font-semibold text-[#72b2ff]">
                          {reservation.quantity}
                        </td>

                        <td className="px-3 py-3 text-[8px] text-zinc-500">
                          {reservation.orderStatus}
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid min-h-52 place-items-center text-center">
              <div>
                <PackageCheck
                  size={24}
                  className="mx-auto text-zinc-700"
                />

                <p className="mt-3 text-[10px] text-zinc-500">
                  Aucune réservation active
                </p>
              </div>
            </div>
          )}
        </section>
      ) : null}

      {tab === "counts" ? (
        <div className="grid gap-4">
          {data.activeCount ? (
            <section className="border border-[#303238] bg-[#111214]">
              <header className="flex flex-col gap-3 border-b border-[#303238] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[7px] font-bold uppercase tracking-[0.1em] text-[#3d92ff]">
                    Inventaire en cours
                  </p>

                  <h2 className="mt-1 text-[11px] font-semibold text-white">
                    {data.activeCount.note ??
                      "Inventaire physique"}
                  </h2>

                  <p className="mt-1 text-[8px] text-zinc-600">
                    {data.activeCount.lines.filter(
                      (line) =>
                        line.countedPhysical !==
                        null,
                    ).length}
                    {" / "}
                    {data.activeCount.lines.length}
                    {" enregistrés"}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={
                      inventory.mutating
                    }
                    onClick={
                      () =>
                        void savePhysicalCount()
                          .catch(
                            () => undefined,
                          )
                    }
                    className="h-8 border border-[#303238] px-3 text-[8px] font-semibold text-zinc-300 hover:text-white disabled:opacity-40"
                  >
                    Enregistrer
                  </button>

                  <button
                    type="button"
                    disabled={
                      inventory.mutating
                    }
                    onClick={
                      () =>
                        void finalizePhysicalCount()
                          .catch(
                            () => undefined,
                          )
                    }
                    className="h-8 border border-emerald-500 bg-emerald-500 px-3 text-[8px] font-semibold text-black hover:bg-emerald-400 disabled:opacity-40"
                  >
                    Valider l’inventaire
                  </button>
                </div>
              </header>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px]">
                  <thead>
                    <tr className="border-b border-[#303238] bg-[#151619] text-left text-[7px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                      <th className="px-4 py-3">
                        Produit
                      </th>
                      <th className="px-3 py-3">
                        Théorique
                      </th>
                      <th className="px-3 py-3">
                        Disponible
                      </th>
                      <th className="px-3 py-3">
                        Réservé
                      </th>
                      <th className="px-3 py-3">
                        Compté
                      </th>
                      <th className="px-3 py-3">
                        Écart
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#292c31]">
                    {data.activeCount.lines.map(
                      (line) => {
                        const raw =
                          countValues[
                            line.productId
                          ] ??
                          "";

                        const counted =
                          raw === ""
                            ? null
                            : Number(
                                raw,
                              );

                        const difference =
                          counted === null ||
                          !Number.isFinite(
                            counted,
                          )
                            ? null
                            : counted -
                              line.theoreticalPhysical;

                        return (
                          <tr
                            key={
                              line.id
                            }
                          >
                            <td className="px-4 py-3 text-[9px] font-semibold text-zinc-200">
                              {line.productTitle}
                            </td>

                            <td className="px-3 py-3 text-[10px] text-white">
                              {line.theoreticalPhysical}
                            </td>

                            <td className="px-3 py-3 text-[9px] text-emerald-400">
                              {line.theoreticalAvailable}
                            </td>

                            <td className="px-3 py-3 text-[9px] text-[#72b2ff]">
                              {line.theoreticalReserved}
                            </td>

                            <td className="px-3 py-3">
                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={
                                  raw
                                }
                                onChange={
                                  (event) =>
                                    setCountValues(
                                      (
                                        current,
                                      ) => ({
                                        ...current,

                                        [line.productId]:
                                          event.target.value,
                                      }),
                                    )
                                }
                                className="h-8 w-24 border border-[#303238] bg-[#0d0f12] px-2 text-[9px] text-white outline-none focus:border-[#3d92ff]"
                              />
                            </td>

                            <td
                              className={
                                difference === null
                                  ? "px-3 py-3 text-[9px] text-zinc-700"
                                  : difference === 0
                                    ? "px-3 py-3 text-[9px] font-semibold text-emerald-400"
                                    : "px-3 py-3 text-[9px] font-semibold text-amber-400"
                              }
                            >
                              {difference === null
                                ? "—"
                                : difference > 0
                                  ? `+${difference}`
                                  : difference}
                            </td>
                          </tr>
                        );
                      },
                    )}
                  </tbody>
                </table>
              </div>

              <footer className="flex justify-end border-t border-[#303238] p-3">
                <button
                  type="button"
                  disabled={
                    inventory.mutating
                  }
                  onClick={() =>
                    void cancelPhysicalCount()
                  }
                  className="h-8 border border-red-500/30 px-3 text-[8px] font-semibold text-red-400 hover:bg-red-500/5 disabled:opacity-40"
                >
                  Annuler l’inventaire
                </button>
              </footer>
            </section>
          ) : (
            <section className="border border-[#303238] bg-[#111214] p-4">
              <div className="max-w-xl">
                <ClipboardCheck
                  size={24}
                  className="text-[#3d92ff]"
                />

                <h2 className="mt-3 text-[12px] font-semibold text-white">
                  Lancer un inventaire physique
                </h2>

                <p className="mt-2 text-[9px] leading-5 text-zinc-600">
                  Le stock théorique est figé au démarrage. Si le stock bouge pendant le comptage, la validation sera refusée afin d’éviter un rapprochement incorrect.
                </p>

                <input
                  value={
                    countNote
                  }
                  onChange={
                    (event) =>
                      setCountNote(
                        event.target.value,
                      )
                  }
                  placeholder="Libellé de l’inventaire"
                  className={`${fieldClass} mt-4 w-full`}
                />

                <button
                  type="button"
                  disabled={
                    inventory.mutating ||
                    !data.products.length
                  }
                  onClick={
                    () =>
                      void inventory
                        .startCount(
                          countNote,
                        )
                        .catch(
                          () => undefined,
                        )
                  }
                  className="mt-3 h-9 border border-[#ed1b2f] bg-[#ed1b2f] px-4 text-[8px] font-semibold text-white hover:bg-[#ff3045] disabled:opacity-40"
                >
                  Démarrer l’inventaire
                </button>
              </div>
            </section>
          )}

          <section className="border border-[#303238] bg-[#111214]">
            <header className="border-b border-[#303238] px-4 py-3">
              <h2 className="text-[10px] font-semibold">
                Historique des inventaires
              </h2>
            </header>

            <div className="divide-y divide-[#292c31]">
              {data.counts
                .filter(
                  (count) =>
                    count.status !==
                    "draft",
                )
                .map(
                  (count) => {
                    const discrepancies =
                      count.lines.filter(
                        (line) =>
                          line.appliedDelta !==
                          0,
                      ).length;

                    return (
                      <article
                        key={
                          count.id
                        }
                        className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <strong className="text-[9px] text-zinc-300">
                            {count.note ??
                              "Inventaire physique"}
                          </strong>

                          <p className="mt-1 text-[7px] text-zinc-600">
                            {new Date(
                              count.startedAt,
                            ).toLocaleString(
                              "fr-FR",
                            )}
                            {" · "}
                            {count.lines.length}
                            {" produits"}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[8px] text-zinc-500">
                            {discrepancies}
                            {" écart(s)"}
                          </span>

                          <span
                            className={
                              count.status ===
                              "completed"
                                ? "border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[7px] font-semibold text-emerald-400"
                                : "border border-zinc-700 px-2 py-1 text-[7px] font-semibold text-zinc-500"
                            }
                          >
                            {count.status ===
                            "completed"
                              ? "Validé"
                              : "Annulé"}
                          </span>
                        </div>
                      </article>
                    );
                  },
                )}

              {!data.counts.some(
                (count) =>
                  count.status !==
                  "draft",
              ) ? (
                <p className="px-4 py-8 text-center text-[9px] text-zinc-600">
                  Aucun inventaire archivé.
                </p>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}

      {tab === "alerts" ? (
        <section className="border border-[#303238] bg-[#111214]">
          <header className="border-b border-[#303238] px-4 py-3">
            <h2 className="text-[10px] font-semibold">
              Alertes de stock
            </h2>

            <p className="mt-1 text-[8px] text-zinc-600">
              Chaque produit possède son propre seuil.
            </p>
          </header>

          {alertProducts.length ? (
            <div className="divide-y divide-[#292c31]">
              {alertProducts.map(
                (product) => {
                  const state =
                    stockState(
                      product,
                    );

                  return (
                    <article
                      key={
                        product.productId
                      }
                      className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <BellRing
                            size={12}
                            className={
                              product.available === 0
                                ? "text-red-400"
                                : "text-amber-400"
                            }
                          />

                          <strong className="text-[9px] text-zinc-200">
                            {product.title}
                          </strong>
                        </div>

                        <p className="mt-1 text-[8px] text-zinc-600">
                          Disponible : {product.available}
                          {" · "}
                          Réservé : {product.reserved}
                          {" · "}
                          Seuil : {product.lowStockThreshold}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={
                            "border px-2 py-1 text-[8px] font-semibold " +
                            state.className
                          }
                        >
                          {state.label}
                        </span>

                        <button
                          type="button"
                          onClick={
                            () =>
                              openThreshold(
                                product,
                              )
                          }
                          className="h-8 border border-[#303238] px-3 text-[8px] font-semibold text-zinc-400 hover:text-white"
                        >
                          Seuil
                        </button>

                        <button
                          type="button"
                          onClick={
                            () =>
                              openAdjust(
                                product,
                              )
                          }
                          className="h-8 border border-[#303238] px-3 text-[8px] font-semibold text-zinc-400 hover:text-white"
                        >
                          Ajuster
                        </button>
                      </div>
                    </article>
                  );
                },
              )}
            </div>
          ) : (
            <div className="grid min-h-52 place-items-center text-center">
              <div>
                <CheckCircle2
                  size={24}
                  className="mx-auto text-emerald-500"
                />

                <p className="mt-3 text-[10px] font-semibold text-emerald-400">
                  Aucune alerte
                </p>
              </div>
            </div>
          )}
        </section>
      ) : null}

      {editorProduct ? (
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
              submitEditor
            }
            className="w-full max-w-lg border border-[#303238] bg-[#101114] shadow-2xl"
          >
            <header className="flex items-start justify-between border-b border-[#303238] p-4">
              <div>
                <p className="text-[7px] font-bold uppercase tracking-[0.12em] text-[#3d92ff]">
                  {editorMode === "adjust"
                    ? "Mouvement manuel"
                    : "Alerte de stock"}
                </p>

                <h2 className="mt-1 text-[11px] font-semibold text-white">
                  {editorProduct.title}
                </h2>

                <p className="mt-1 text-[8px] text-zinc-600">
                  Physique : {editorProduct.physical}
                  {" · "}
                  Disponible : {editorProduct.available}
                  {" · "}
                  Réservé : {editorProduct.reserved}
                </p>
              </div>

              <button
                type="button"
                disabled={
                  inventory.mutating
                }
                onClick={
                  closeEditor
                }
                className="grid size-8 place-items-center text-zinc-600 hover:text-white"
              >
                <X
                  size={14}
                />
              </button>
            </header>

            <div className="grid gap-4 p-4">
              {editorMode === "adjust" ? (
                <>
                  <label className="grid gap-1.5">
                    <span className="text-[7px] font-bold uppercase tracking-[0.08em] text-zinc-600">
                      Variation *
                    </span>

                    <input
                      required
                      type="number"
                      step="1"
                      value={
                        delta
                      }
                      onChange={
                        (event) =>
                          setDelta(
                            event.target.value,
                          )
                      }
                      className={fieldClass}
                    />

                    <span className="text-[8px] text-zinc-700">
                      Positif = entrée. Négatif = sortie.
                    </span>
                  </label>

                  <label className="grid gap-1.5">
                    <span className="text-[7px] font-bold uppercase tracking-[0.08em] text-zinc-600">
                      Motif *
                    </span>

                    <select
                      value={
                        reason
                      }
                      onChange={
                        (event) =>
                          setReason(
                            event.target.value,
                          )
                      }
                      className={fieldClass}
                    >
                      <option value="Réception marchandise">
                        Réception marchandise
                      </option>

                      <option value="Retour client">
                        Retour client
                      </option>

                      <option value="Casse ou produit endommagé">
                        Casse / endommagé
                      </option>

                      <option value="Perte">
                        Perte
                      </option>

                      <option value="Usage interne">
                        Usage interne
                      </option>

                      <option value="Correction manuelle">
                        Correction manuelle
                      </option>
                    </select>
                  </label>

                  <div className="border border-[#3d92ff]/20 bg-[#3d92ff]/5 p-3 text-[8px] leading-5 text-zinc-500">
                    Le mouvement modifie uniquement le stock disponible. Les réservations liées aux commandes restent protégées.
                  </div>
                </>
              ) : (
                <label className="grid gap-1.5">
                  <span className="text-[7px] font-bold uppercase tracking-[0.08em] text-zinc-600">
                    Seuil de stock faible *
                  </span>

                  <input
                    required
                    type="number"
                    min="0"
                    step="1"
                    value={
                      threshold
                    }
                    onChange={
                      (event) =>
                        setThreshold(
                          event.target.value,
                        )
                    }
                    className={fieldClass}
                  />
                </label>
              )}

              {formError ? (
                <p
                  role="alert"
                  className="border border-red-500/30 bg-red-500/5 px-3 py-2 text-[9px] text-red-400"
                >
                  {formError}
                </p>
              ) : null}
            </div>

            <footer className="flex justify-end gap-2 border-t border-[#303238] p-3">
              <button
                type="button"
                disabled={
                  inventory.mutating
                }
                onClick={
                  closeEditor
                }
                className="h-8 border border-[#303238] px-3 text-[8px] font-semibold text-zinc-500 hover:text-white"
              >
                Annuler
              </button>

              <button
                type="submit"
                disabled={
                  inventory.mutating
                }
                className="inline-flex h-8 items-center gap-1.5 border border-[#ed1b2f] bg-[#ed1b2f] px-4 text-[8px] font-semibold text-white hover:bg-[#ff3045] disabled:opacity-40"
              >
                <SlidersHorizontal
                  size={10}
                />

                {inventory.mutating
                  ? "Enregistrement…"
                  : "Enregistrer"}
              </button>
            </footer>
          </form>
        </div>
      ) : null}
    </div>
  );
}
