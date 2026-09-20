"use client";

import {
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  Boxes,
  Edit3,
  Plus,
  Search,
  Tag,
  X,
} from "lucide-react";

import {
  useProducts,
} from "../hooks";

import {
  useProductVariants,
} from "../variants/useProductVariants";

import type {
  ProductVariant,
  ProductVariantInput,
} from "../variants/types";

type StatusFilter =
  | "all"
  | "active"
  | "inactive";

type AttributeRow = {
  id: string;
  key: string;
  value: string;
};

function createAttributeRow(
  key = "",
  value = "",
): AttributeRow {
  return {
    id: crypto.randomUUID(),
    key,
    value,
  };
}

function attributesToRows(
  attributes:
    Record<string, string>,
): AttributeRow[] {
  const rows =
    Object.entries(attributes).map(
      ([key, value]) =>
        createAttributeRow(
          key,
          value,
        ),
    );

  return rows.length
    ? rows
    : [createAttributeRow()];
}

function rowsToAttributes(
  rows: AttributeRow[],
) {
  return Object.fromEntries(
    rows
      .map(
        (row) => [
          row.key.trim(),
          row.value.trim(),
        ],
      )
      .filter(
        ([key, value]) =>
          Boolean(key) &&
          Boolean(value),
      ),
  );
}

export function SellerVariantsFeature() {
  const products =
    useProducts();

  const variants =
    useProductVariants();

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<StatusFilter>("all");

  const [
    editorOpen,
    setEditorOpen,
  ] =
    useState(false);

  const [
    editing,
    setEditing,
  ] =
    useState<ProductVariant | null>(null);

  const [
    productId,
    setProductId,
  ] =
    useState("");

  const [
    sku,
    setSku,
  ] =
    useState("");

  const [
    label,
    setLabel,
  ] =
    useState("");

  const [
    isActive,
    setIsActive,
  ] =
    useState(true);

  const [
    sortOrder,
    setSortOrder,
  ] =
    useState("0");

  const [
    attributeRows,
    setAttributeRows,
  ] =
    useState<AttributeRow[]>([
      createAttributeRow(),
    ]);

  const [
    formError,
    setFormError,
  ] =
    useState<string | null>(null);

  const productMap =
    useMemo(
      () =>
        new Map(
          products.products.map(
            (product) => [
              product.id,
              product,
            ],
          ),
        ),
      [products.products],
    );

  const filtered =
    useMemo(() => {
      const needle =
        search
          .trim()
          .toLocaleLowerCase("fr");

      return variants.variants.filter(
        (variant) => {
          if (
            statusFilter ===
              "active" &&
            !variant.isActive
          ) {
            return false;
          }

          if (
            statusFilter ===
              "inactive" &&
            variant.isActive
          ) {
            return false;
          }

          if (!needle) {
            return true;
          }

          const product =
            productMap.get(
              variant.productId,
            );

          return [
            product?.title ?? "",
            variant.sku,
            variant.label,
            ...Object.entries(
              variant.attributes,
            ).flat(),
          ]
            .join(" ")
            .toLocaleLowerCase("fr")
            .includes(needle);
        },
      );
    }, [
      productMap,
      search,
      statusFilter,
      variants.variants,
    ]);

  const activeCount =
    variants.variants.filter(
      (variant) =>
        variant.isActive,
    ).length;

  const inactiveCount =
    variants.variants.length -
    activeCount;

  const productsWithVariants =
    new Set(
      variants.variants.map(
        (variant) =>
          variant.productId,
      ),
    ).size;

  function closeEditor() {
    setEditorOpen(false);
    setEditing(null);
    setFormError(null);
  }

  function openCreate() {
    setEditing(null);

    setProductId(
      products.products[0]?.id ??
        "",
    );

    setSku("");
    setLabel("");
    setIsActive(true);

    setSortOrder(
      String(
        variants.variants.length,
      ),
    );

    setAttributeRows([
      createAttributeRow(),
    ]);

    setFormError(null);
    setEditorOpen(true);
  }

  function openEdit(
    variant: ProductVariant,
  ) {
    setEditing(variant);
    setProductId(
      variant.productId,
    );
    setSku(variant.sku);
    setLabel(variant.label);
    setIsActive(
      variant.isActive,
    );
    setSortOrder(
      String(
        variant.sortOrder,
      ),
    );
    setAttributeRows(
      attributesToRows(
        variant.attributes,
      ),
    );
    setFormError(null);
    setEditorOpen(true);
  }

  function updateAttribute(
    id: string,
    patch:
      Partial<AttributeRow>,
  ) {
    setAttributeRows(
      (current) =>
        current.map(
          (row) =>
            row.id === id
              ? {
                  ...row,
                  ...patch,
                }
              : row,
        ),
    );
  }

  async function submit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setFormError(null);

    const order =
      Number(sortOrder);

    const input:
      ProductVariantInput = {
        productId,
        sku,
        label,
        attributes:
          rowsToAttributes(
            attributeRows,
          ),
        isActive,
        sortOrder:
          Number.isInteger(order) &&
          order >= 0
            ? order
            : 0,
      };

    try {
      if (editing) {
        await variants.update(
          editing.id,
          input,
        );
      }
      else {
        await variants.create(
          input,
        );
      }

      closeEditor();
    }
    catch (cause) {
      setFormError(
        cause instanceof Error
          ? cause.message
          : "Impossible d’enregistrer la variante.",
      );
    }
  }

  if (
    products.loading ||
    variants.loading
  ) {
    return (
      <div className="h-64 animate-pulse border border-[#303238] bg-[#151619]" />
    );
  }

  return (
    <div className="grid gap-3">
      <header className="flex flex-col gap-3 border-b border-[#303238] pb-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[8px] font-bold uppercase tracking-[0.15em] text-[#ed1b2f]">
            Catalogue
          </p>

          <h1 className="mt-1 text-[21px] font-semibold tracking-[-0.035em] text-zinc-100">
            Variantes
          </h1>

          <p className="mt-1 max-w-3xl text-[10px] leading-5 text-zinc-500">
            Déclinaisons commerciales de vos produits : taille, couleur, poids, format ou toute autre caractéristique. Le stock et les prix restent gérés au niveau du produit.
          </p>
        </div>

        <button
          type="button"
          disabled={
            !products.products.length
          }
          onClick={openCreate}
          className="inline-flex h-8 items-center gap-1.5 border border-[#ed1b2f] bg-[#ed1b2f] px-3 text-[9px] font-semibold text-white transition hover:bg-[#ff3045] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus size={12} />
          Nouvelle variante
        </button>
      </header>

      <section className="grid grid-cols-2 gap-px border border-[#303238] bg-[#303238] lg:grid-cols-4">
        <article className="bg-[#151619] p-4">
          <span className="text-[8px] uppercase tracking-[0.1em] text-zinc-500">
            Variantes
          </span>

          <strong className="mt-2 block text-[23px] text-zinc-100">
            {variants.variants.length}
          </strong>
        </article>

        <article className="bg-[#151619] p-4">
          <span className="text-[8px] uppercase tracking-[0.1em] text-zinc-500">
            Actives
          </span>

          <strong className="mt-2 block text-[23px] text-emerald-400">
            {activeCount}
          </strong>
        </article>

        <article className="bg-[#151619] p-4">
          <span className="text-[8px] uppercase tracking-[0.1em] text-zinc-500">
            Inactives
          </span>

          <strong className="mt-2 block text-[23px] text-amber-400">
            {inactiveCount}
          </strong>
        </article>

        <article className="bg-[#151619] p-4">
          <span className="text-[8px] uppercase tracking-[0.1em] text-zinc-500">
            Produits concernés
          </span>

          <strong className="mt-2 block text-[23px] text-[#3d92ff]">
            {productsWithVariants}
          </strong>
        </article>
      </section>

      {variants.error ? (
        <p
          role="alert"
          className="border border-red-500/30 bg-red-500/5 px-3 py-2 text-[9px] text-red-400"
        >
          {variants.error}
        </p>
      ) : null}

      {editorOpen ? (
        <section className="border border-[#3d92ff]/30 bg-[#11151a]">
          <header className="flex items-center justify-between border-b border-[#303238] px-4 py-3">
            <div>
              <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#3d92ff]">
                {editing
                  ? "Modification"
                  : "Création"}
              </p>

              <h2 className="mt-1 text-[12px] font-semibold text-zinc-100">
                {editing
                  ? editing.label
                  : "Nouvelle variante"}
              </h2>
            </div>

            <button
              type="button"
              onClick={closeEditor}
              className="grid size-7 place-items-center text-zinc-500 hover:text-white"
            >
              <X size={14} />
            </button>
          </header>

          <form
            onSubmit={submit}
            className="grid gap-4 p-4"
          >
            <div className="grid gap-3 lg:grid-cols-2">
              <label className="grid gap-1.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                Produit

                <select
                  required
                  value={productId}
                  onChange={(
                    event,
                  ) =>
                    setProductId(
                      event.target.value,
                    )
                  }
                  className="h-9 border border-[#303238] bg-[#0d0f12] px-3 text-[10px] normal-case text-zinc-200 outline-none focus:border-[#3d92ff]"
                >
                  <option value="">
                    Sélectionner
                  </option>

                  {products.products.map(
                    (product) => (
                      <option
                        key={product.id}
                        value={product.id}
                      >
                        {product.title}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label className="grid gap-1.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                SKU

                <input
                  required
                  value={sku}
                  onChange={(
                    event,
                  ) =>
                    setSku(
                      event.target.value,
                    )
                  }
                  placeholder="RSH-M-BL"
                  className="h-9 border border-[#303238] bg-[#0d0f12] px-3 text-[10px] normal-case text-zinc-200 outline-none placeholder:text-zinc-700 focus:border-[#3d92ff]"
                />
              </label>

              <label className="grid gap-1.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                Libellé

                <input
                  required
                  value={label}
                  onChange={(
                    event,
                  ) =>
                    setLabel(
                      event.target.value,
                    )
                  }
                  placeholder="M · Bleu"
                  className="h-9 border border-[#303238] bg-[#0d0f12] px-3 text-[10px] normal-case text-zinc-200 outline-none placeholder:text-zinc-700 focus:border-[#3d92ff]"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                  Ordre

                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={sortOrder}
                    onChange={(
                      event,
                    ) =>
                      setSortOrder(
                        event.target.value,
                      )
                    }
                    className="h-9 border border-[#303238] bg-[#0d0f12] px-3 text-[10px] normal-case text-zinc-200 outline-none focus:border-[#3d92ff]"
                  />
                </label>

                <label className="grid gap-1.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                  Statut

                  <select
                    value={
                      isActive
                        ? "active"
                        : "inactive"
                    }
                    onChange={(
                      event,
                    ) =>
                      setIsActive(
                        event.target.value ===
                          "active",
                      )
                    }
                    className="h-9 border border-[#303238] bg-[#0d0f12] px-3 text-[10px] normal-case text-zinc-200 outline-none focus:border-[#3d92ff]"
                  >
                    <option value="active">
                      Active
                    </option>

                    <option value="inactive">
                      Inactive
                    </option>
                  </select>
                </label>
              </div>
            </div>

            <section className="border border-[#303238] bg-[#0d0f12]">
              <header className="flex items-center justify-between border-b border-[#303238] px-3 py-2">
                <div>
                  <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-zinc-500">
                    Attributs
                  </p>

                  <p className="mt-1 text-[8px] text-zinc-700">
                    Ex. Taille = M, Couleur = Bleu, Poids = 7 oz.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setAttributeRows(
                      (current) => [
                        ...current,
                        createAttributeRow(),
                      ],
                    )
                  }
                  className="inline-flex h-7 items-center gap-1 border border-[#303238] px-2 text-[8px] font-semibold text-zinc-500 hover:text-white"
                >
                  <Plus size={10} />
                  Attribut
                </button>
              </header>

              <div className="grid gap-2 p-3">
                {attributeRows.map(
                  (row) => (
                    <div
                      key={row.id}
                      className="grid gap-2 sm:grid-cols-[1fr_1fr_28px]"
                    >
                      <input
                        value={row.key}
                        onChange={(
                          event,
                        ) =>
                          updateAttribute(
                            row.id,
                            {
                              key:
                                event.target.value,
                            },
                          )
                        }
                        placeholder="Attribut"
                        className="h-8 border border-[#303238] bg-[#111214] px-2 text-[9px] text-zinc-300 outline-none focus:border-[#3d92ff]"
                      />

                      <input
                        value={row.value}
                        onChange={(
                          event,
                        ) =>
                          updateAttribute(
                            row.id,
                            {
                              value:
                                event.target.value,
                            },
                          )
                        }
                        placeholder="Valeur"
                        className="h-8 border border-[#303238] bg-[#111214] px-2 text-[9px] text-zinc-300 outline-none focus:border-[#3d92ff]"
                      />

                      <button
                        type="button"
                        title="Retirer"
                        onClick={() =>
                          setAttributeRows(
                            (current) =>
                              current.length ===
                              1
                                ? [
                                    createAttributeRow(),
                                  ]
                                : current.filter(
                                    (item) =>
                                      item.id !==
                                      row.id,
                                  ),
                          )
                        }
                        className="grid size-7 place-items-center text-zinc-600 hover:text-red-400"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  ),
                )}
              </div>
            </section>

            {formError ? (
              <p
                role="alert"
                className="border border-red-500/30 bg-red-500/5 px-3 py-2 text-[9px] text-red-400"
              >
                {formError}
              </p>
            ) : null}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closeEditor}
                className="h-8 border border-[#303238] px-3 text-[9px] font-semibold text-zinc-500 hover:text-white"
              >
                Annuler
              </button>

              <button
                type="submit"
                disabled={variants.mutating}
                className="h-8 border border-[#ed1b2f] bg-[#ed1b2f] px-4 text-[9px] font-semibold text-white hover:bg-[#ff3045] disabled:opacity-40"
              >
                {variants.mutating
                  ? "Enregistrement…"
                  : editing
                    ? "Enregistrer"
                    : "Créer la variante"}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="border border-[#303238] bg-[#111214]">
        <div className="grid gap-2 border-b border-[#303238] p-3 sm:grid-cols-[1fr_180px]">
          <label className="relative">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"
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
              placeholder="Rechercher un produit, SKU ou attribut..."
              className="h-9 w-full border border-[#303238] bg-[#0d0f12] pl-8 pr-3 text-[10px] text-zinc-200 outline-none focus:border-[#3d92ff]"
            />
          </label>

          <select
            value={statusFilter}
            onChange={(
              event,
            ) =>
              setStatusFilter(
                event.target.value as
                  StatusFilter,
              )
            }
            className="h-9 border border-[#303238] bg-[#0d0f12] px-3 text-[9px] text-zinc-400 outline-none focus:border-[#3d92ff]"
          >
            <option value="all">
              Tous les statuts
            </option>

            <option value="active">
              Actives
            </option>

            <option value="inactive">
              Inactives
            </option>
          </select>
        </div>

        {filtered.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-[#303238] bg-[#151619] text-left text-[8px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                  <th className="px-4 py-3">
                    Produit
                  </th>

                  <th className="px-3 py-3">
                    SKU
                  </th>

                  <th className="px-3 py-3">
                    Variante
                  </th>

                  <th className="px-3 py-3">
                    Attributs
                  </th>

                  <th className="px-3 py-3">
                    Statut
                  </th>

                  <th className="px-3 py-3">
                    Ordre
                  </th>

                  <th className="px-4 py-3 text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#292c31]">
                {filtered.map(
                  (variant) => {
                    const product =
                      productMap.get(
                        variant.productId,
                      );

                    return (
                      <tr
                        key={variant.id}
                        className="hover:bg-[#16181b]"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className="grid size-8 shrink-0 place-items-center border border-[#303238] bg-[#151619] text-zinc-600">
                              <Boxes size={12} />
                            </span>

                            <strong className="max-w-[220px] truncate text-[10px] text-zinc-200">
                              {product?.title ??
                                "Produit"}
                            </strong>
                          </div>
                        </td>

                        <td className="px-3 py-3">
                          <code className="text-[9px] font-semibold text-[#6aaeff]">
                            {variant.sku}
                          </code>
                        </td>

                        <td className="px-3 py-3 text-[10px] font-semibold text-zinc-300">
                          {variant.label}
                        </td>

                        <td className="px-3 py-3">
                          <div className="flex max-w-[320px] flex-wrap gap-1">
                            {Object.entries(
                              variant.attributes,
                            ).length ? (
                              Object.entries(
                                variant.attributes,
                              ).map(
                                ([key, value]) => (
                                  <span
                                    key={key}
                                    className="inline-flex items-center gap-1 border border-[#303238] bg-[#151619] px-1.5 py-1 text-[7px] text-zinc-500"
                                  >
                                    <Tag size={8} />
                                    {key}: {value}
                                  </span>
                                ),
                              )
                            ) : (
                              <span className="text-[8px] text-zinc-700">
                                Aucun
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-3 py-3">
                          <span
                            className={`border px-2 py-1 text-[8px] font-bold uppercase ${
                              variant.isActive
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                                : "border-zinc-700 bg-zinc-900 text-zinc-500"
                            }`}
                          >
                            {variant.isActive
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </td>

                        <td className="px-3 py-3 text-[9px] text-zinc-500">
                          {variant.sortOrder}
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              title="Modifier"
                              onClick={() =>
                                openEdit(
                                  variant,
                                )
                              }
                              className="grid size-7 place-items-center border border-[#303238] bg-[#151619] text-zinc-500 hover:border-[#3d92ff]/50 hover:text-[#3d92ff]"
                            >
                              <Edit3 size={11} />
                            </button>

                            <button
                              type="button"
                              disabled={
                                variants.mutating
                              }
                              onClick={() =>
                                void variants
                                  .setActive(
                                    variant.id,
                                    !variant.isActive,
                                  )
                                  .catch(
                                    () =>
                                      undefined,
                                  )
                              }
                              className={`h-7 border px-2 text-[8px] font-semibold ${
                                variant.isActive
                                  ? "border-amber-500/30 text-amber-400 hover:bg-amber-500/5"
                                  : "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/5"
                              }`}
                            >
                              {variant.isActive
                                ? "Désactiver"
                                : "Activer"}
                            </button>
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
          <div className="grid min-h-60 place-items-center px-6 text-center">
            <div>
              <Boxes
                size={23}
                className="mx-auto text-zinc-700"
              />

              <p className="mt-3 text-[10px] font-semibold text-zinc-400">
                Aucune variante
              </p>

              <p className="mt-1 text-[8px] text-zinc-600">
                Créez une déclinaison commerciale pour un produit de votre catalogue.
              </p>

              {products.products.length ? (
                <button
                  type="button"
                  onClick={openCreate}
                  className="mt-4 inline-flex h-8 items-center gap-1.5 border border-[#ed1b2f] bg-[#ed1b2f] px-3 text-[9px] font-semibold text-white"
                >
                  <Plus size={11} />
                  Nouvelle variante
                </button>
              ) : null}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}