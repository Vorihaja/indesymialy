"use client";

import {
  useMemo,
  useState,
  type FormEvent,
} from "react";

import IndesyDualOrbitLoader from "@/components/loading/IndesyDualOrbitLoader";
import {
  useIndesyDialog,
} from "@/components/ui/indesy-dialog";

import {
  usePromotionsV2,
} from "../advanced-v2/usePromotionsV2";

import type {
  BundlePricingMode,
  MarketplaceBundle,
  MarketplacePartnership,
  MarketplacePartnershipInput,
  PartnershipBenefitType,
  PartnershipType,
  PromotionV2Status,
} from "../advanced-v2/types";


export type SellerPromotionsAdvancedView =
  | "bundles"
  | "partnerships";


type BundleItemForm = {
  id: string;
  productId: string;
  quantity: string;
};


type BundleForm = {
  id?: string;
  name: string;
  description: string;
  pricingMode:
    BundlePricingMode;
  fixedPrice: string;
  discountPercent: string;
  currency: string;
  status:
    "draft" |
    "active" |
    "paused";
  startsAt: string;
  endsAt: string;
  items: BundleItemForm[];
};


type PartnershipForm = {
  id?: string;
  partnerOrganizationId: string;
  partnerName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  partnershipType:
    PartnershipType;
  description: string;
  benefitType:
    PartnershipBenefitType;
  benefitValue: string;
  currency: string;
  promotionCode: string;
  status:
    "draft" |
    "active" |
    "paused";
  startsAt: string;
  endsAt: string;
  productIds: string[];
};


const fieldClass =
  "h-9 w-full border border-[#303238] bg-[#0d0f12] px-3 text-[9px] text-zinc-300 outline-none focus:border-[#3d92ff]";


const areaClass =
  "min-h-20 w-full border border-[#303238] bg-[#0d0f12] p-3 text-[9px] text-zinc-300 outline-none focus:border-[#3d92ff]";


const buttonClass =
  "inline-flex h-8 items-center justify-center border border-[#303238] bg-[#151619] px-3 text-[9px] font-semibold text-zinc-400 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-40";


const primaryButtonClass =
  "inline-flex h-8 items-center justify-center border border-[#ed1b2f] bg-[#ed1b2f] px-3 text-[9px] font-semibold text-white transition hover:bg-[#ff3045] disabled:cursor-not-allowed disabled:opacity-40";


function itemId() {
  return crypto.randomUUID();
}


function emptyBundle():
  BundleForm {
  return {
    name: "",
    description: "",
    pricingMode:
      "percent_discount",
    fixedPrice: "",
    discountPercent:
      "10",
    currency:
      "MGA",
    status:
      "draft",
    startsAt: "",
    endsAt: "",
    items: [
      {
        id:
          itemId(),
        productId: "",
        quantity: "1",
      },
      {
        id:
          itemId(),
        productId: "",
        quantity: "1",
      },
    ],
  };
}


function emptyPartnership():
  PartnershipForm {
  return {
    partnerOrganizationId:
      "",
    partnerName:
      "",
    contactName:
      "",
    contactEmail:
      "",
    contactPhone:
      "",
    partnershipType:
      "co_marketing",
    description:
      "",
    benefitType:
      "visibility",
    benefitValue:
      "",
    currency:
      "MGA",
    promotionCode:
      "",
    status:
      "draft",
    startsAt:
      "",
    endsAt:
      "",
    productIds:
      [],
  };
}


function toLocalDateTime(
  value:
    string | null,
) {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  const offset =
    date.getTimezoneOffset() *
    60000;

  return new Date(
    date.getTime() -
      offset,
  )
    .toISOString()
    .slice(
      0,
      16,
    );
}


function toIso(
  value: string,
) {
  if (!value) {
    return null;
  }

  return new Date(
    value,
  ).toISOString();
}


function money(
  value: number,
  currency: string,
) {
  return (
    new Intl.NumberFormat(
      "fr-FR",
      {
        maximumFractionDigits:
          2,
      },
    ).format(
      value,
    ) +
    " " +
    currency
  );
}


function statusLabel(
  status:
    PromotionV2Status,
) {
  switch (status) {
    case "draft":
      return "Brouillon";

    case "active":
      return "Actif";

    case "paused":
      return "En pause";

    case "archived":
      return "Archivé";
  }
}


function partnershipTypeLabel(
  type:
    PartnershipType,
) {
  switch (type) {
    case "affiliate":
      return "Affiliation";

    case "co_marketing":
      return "Co-marketing";

    case "sponsorship":
      return "Sponsoring";

    case "supplier":
      return "Fournisseur";

    case "ambassador":
      return "Ambassadeur";

    case "distribution":
      return "Distribution";

    case "other":
      return "Autre";
  }
}


function benefitLabel(
  partnership:
    MarketplacePartnership,
) {
  switch (
    partnership.benefitType
  ) {
    case "percent_discount":
      return `${partnership.benefitValue ?? 0} %`;

    case "fixed_discount":
      return money(
        partnership.benefitValue ??
          0,
        partnership.currency,
      );

    case "promotion_code":
      return partnership.promotionCode ??
        "Code";

    case "visibility":
      return "Visibilité";

    case "other":
      return "Autre avantage";
  }
}


function ErrorPanel({
  message,
  retry,
}: {
  message: string;
  retry: () => void;
}) {
  return (
    <div className="grid min-h-72 place-items-center border border-red-500/20 bg-red-500/5 p-8 text-center">
      <div>
        <p className="text-xs font-semibold text-red-400">
          Promotions V2 indisponibles
        </p>

        <p className="mt-2 max-w-lg text-[9px] leading-5 text-zinc-500">
          {message}
        </p>

        <button
          type="button"
          onClick={retry}
          className={`${buttonClass} mt-4`}
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}


function BundleView() {
  const dialog = useIndesyDialog();
  const api =
    usePromotionsV2();

  const [
    editorOpen,
    setEditorOpen,
  ] =
    useState(false);

  const [
    form,
    setForm,
  ] =
    useState<BundleForm>(
      emptyBundle,
    );

  const [
    formError,
    setFormError,
  ] =
    useState<string | null>(
      null,
    );


  if (api.loading) {
    return (
      <div className="min-h-64">
        <IndesyDualOrbitLoader
          variant="data"
          label="Chargement des bundles"
        />
      </div>
    );
  }


  if (!api.data) {
    return (
      <ErrorPanel
        message={
          api.error ??
          "Données indisponibles."
        }
        retry={
          () => {
            void api
              .refresh()
              .catch(
                () =>
                  undefined,
              );
          }
        }
      />
    );
  }


  const data =
    api.data;


  const products =
    data.products.filter(
      (product) =>
        product.listingType !==
          "rental" &&
        product.status !==
          "archived",
    );


  const activeCount =
    data.bundles.filter(
      (bundle) =>
        bundle.status ===
        "active",
    ).length;


  function createBundle() {
    setFormError(null);
    setForm(
      emptyBundle(),
    );
    setEditorOpen(true);
  }


  function editBundle(
    bundle:
      MarketplaceBundle,
  ) {
    setFormError(null);

    setForm({
      id:
        bundle.id,

      name:
        bundle.name,

      description:
        bundle.description ??
        "",

      pricingMode:
        bundle.pricingMode,

      fixedPrice:
        bundle.fixedPrice ===
        null
          ? ""
          : String(
              bundle.fixedPrice,
            ),

      discountPercent:
        bundle.discountPercent ===
        null
          ? ""
          : String(
              bundle.discountPercent,
            ),

      currency:
        bundle.currency,

      status:
        bundle.status ===
          "active" ||
        bundle.status ===
          "paused"
          ? bundle.status
          : "draft",

      startsAt:
        toLocalDateTime(
          bundle.startsAt,
        ),

      endsAt:
        toLocalDateTime(
          bundle.endsAt,
        ),

      items:
        bundle.items.map(
          (item) => ({
            id:
              itemId(),

            productId:
              item.productId,

            quantity:
              String(
                item.quantity,
              ),
          }),
        ),
    });

    setEditorOpen(true);
  }


  async function submit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setFormError(null);

    try {
      await api.saveBundle({
        id:
          form.id,

        name:
          form.name,

        description:
          form.description,

        pricingMode:
          form.pricingMode,

        fixedPrice:
          form.pricingMode ===
            "fixed_price"
            ? Number(
                form.fixedPrice,
              )
            : null,

        discountPercent:
          form.pricingMode ===
            "percent_discount"
            ? Number(
                form.discountPercent,
              )
            : null,

        currency:
          form.currency,

        status:
          form.status,

        startsAt:
          toIso(
            form.startsAt,
          ),

        endsAt:
          toIso(
            form.endsAt,
          ),

        items:
          form.items.map(
            (
              item,
              index,
            ) => ({
              productId:
                item.productId,

              quantity:
                Number(
                  item.quantity,
                ),

              sortOrder:
                index,
            }),
          ),
      });

      setEditorOpen(false);
    }
    catch (cause) {
      setFormError(
        cause instanceof Error
          ? cause.message
          : "Impossible d'enregistrer le bundle.",
      );
    }
  }


  function statusAction(
    id: string,
    status:
      PromotionV2Status,
  ) {
    void api
      .setBundleStatus(
        id,
        status,
      )
      .catch(
        () => undefined,
      );
  }

  async function archiveBundle(
    bundleId: string,
  ) {
    const confirmed =
      await dialog.confirm({
        title:
          "Archiver ce bundle ?",
        description:
          "Le bundle sera archivé définitivement.",
        confirmLabel: "Archiver",
        cancelLabel: "Annuler",
        tone: "danger",
      });

    if (!confirmed) return;

    statusAction(
      bundleId,
      "archived",
    );
  }


  return (
    <section className="space-y-4 text-zinc-100">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-[#303238] pb-4">
        <div>
          <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-[#ed1b2f]">
            Promotions
          </p>

          <h1 className="mt-1 text-[22px] font-semibold tracking-[-0.035em] text-white">
            Bundles
          </h1>

          <p className="mt-1 max-w-3xl text-[9px] leading-5 text-zinc-600">
            Regroupez plusieurs produits dans une offre commerciale sans modifier les prix catalogue. Le checkout Marketplace ne consomme pas encore ces bundles.
          </p>
        </div>

        <button
          type="button"
          disabled={
            products.length < 2
          }
          onClick={
            createBundle
          }
          className={primaryButtonClass}
        >
          Nouveau bundle
        </button>
      </header>


      {api.error ? (
        <p className="border border-red-500/20 bg-red-500/5 p-3 text-[9px] text-red-400">
          {api.error}
        </p>
      ) : null}


      <div className="grid grid-cols-2 gap-px border border-[#303238] bg-[#303238] lg:grid-cols-4">
        <article className="bg-[#151619] p-4">
          <p className="text-[7px] uppercase tracking-[0.12em] text-zinc-600">
            Bundles
          </p>

          <strong className="mt-2 block text-2xl">
            {data.bundles.length}
          </strong>
        </article>

        <article className="bg-[#151619] p-4">
          <p className="text-[7px] uppercase tracking-[0.12em] text-zinc-600">
            Actifs
          </p>

          <strong className="mt-2 block text-2xl text-emerald-400">
            {activeCount}
          </strong>
        </article>

        <article className="bg-[#151619] p-4">
          <p className="text-[7px] uppercase tracking-[0.12em] text-zinc-600">
            Produits éligibles
          </p>

          <strong className="mt-2 block text-2xl">
            {products.length}
          </strong>
        </article>

        <article className="bg-[#151619] p-4">
          <p className="text-[7px] uppercase tracking-[0.12em] text-zinc-600">
            Checkout
          </p>

          <strong className="mt-2 block text-xs text-amber-400">
            Non intégré
          </strong>
        </article>
      </div>


      <div className="grid gap-3">
        {data.bundles.map(
          (bundle) => (
            <article
              key={bundle.id}
              className="border border-[#303238] bg-[#151619] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <strong className="text-sm text-zinc-100">
                    {bundle.name}
                  </strong>

                  <p className="mt-1 text-[8px] text-zinc-600">
                    {bundle.items.length}
                    {" produit(s) · "}
                    {statusLabel(
                      bundle.status,
                    )}
                  </p>
                </div>

                <span className="border border-[#303238] px-2 py-1 text-[8px] text-zinc-400">
                  {bundle.pricingMode ===
                  "fixed_price"
                    ? "Prix bundle"
                    : `${bundle.discountPercent ?? 0} %`}
                </span>
              </div>


              {bundle.description ? (
                <p className="mt-3 text-[9px] leading-5 text-zinc-500">
                  {bundle.description}
                </p>
              ) : null}


              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-[7px] uppercase text-zinc-700">
                    Prix catalogue
                  </p>

                  <p className="mt-1 text-xs font-semibold">
                    {money(
                      bundle.originalPrice,
                      bundle.currency,
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-[7px] uppercase text-zinc-700">
                    Aperçu bundle
                  </p>

                  <p className="mt-1 text-xs font-semibold text-[#72b2ff]">
                    {money(
                      bundle.previewPrice,
                      bundle.currency,
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-[7px] uppercase text-zinc-700">
                    Économie indicative
                  </p>

                  <p className="mt-1 text-xs font-semibold text-emerald-400">
                    {money(
                      Math.max(
                        0,
                        bundle.originalPrice -
                          bundle.previewPrice,
                      ),
                      bundle.currency,
                    )}
                  </p>
                </div>
              </div>


              <div className="mt-4 border-t border-[#292c31] pt-3">
                {bundle.items.map(
                  (item) => (
                    <p
                      key={
                        item.productId
                      }
                      className="py-1 text-[9px] text-zinc-500"
                    >
                      {item.quantity}
                      {" × "}
                      {item.productName}
                      {" · "}
                      {money(
                        item.unitPrice,
                        bundle.currency,
                      )}
                    </p>
                  ),
                )}
              </div>


              {bundle.status !==
              "archived" ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={
                      () =>
                        editBundle(
                          bundle,
                        )
                    }
                    className={buttonClass}
                  >
                    Modifier
                  </button>

                  {bundle.status ===
                  "draft" ? (
                    <button
                      type="button"
                      disabled={
                        api.mutating
                      }
                      onClick={
                        () =>
                          statusAction(
                            bundle.id,
                            "active",
                          )
                      }
                      className={primaryButtonClass}
                    >
                      Activer
                    </button>
                  ) : null}

                  {bundle.status ===
                  "active" ? (
                    <button
                      type="button"
                      disabled={
                        api.mutating
                      }
                      onClick={
                        () =>
                          statusAction(
                            bundle.id,
                            "paused",
                          )
                      }
                      className={buttonClass}
                    >
                      Mettre en pause
                    </button>
                  ) : null}

                  {bundle.status ===
                  "paused" ? (
                    <button
                      type="button"
                      disabled={
                        api.mutating
                      }
                      onClick={
                        () =>
                          statusAction(
                            bundle.id,
                            "active",
                          )
                      }
                      className={primaryButtonClass}
                    >
                      Réactiver
                    </button>
                  ) : null}

                  <button
                    type="button"
                    disabled={
                      api.mutating
                    }
                    onClick={() =>
                      void archiveBundle(
                        bundle.id,
                      )
                    }
                    className={`${buttonClass} text-red-400`}
                  >
                    Archiver
                  </button>
                </div>
              ) : null}
            </article>
          ),
        )}
      </div>


      {!data.bundles.length ? (
        <div className="border border-dashed border-[#303238] p-8 text-center text-[10px] text-zinc-600">
          Aucun bundle enregistré.
        </div>
      ) : null}


      {editorOpen ? (
        <form
          onSubmit={
            (event) =>
              void submit(
                event,
              )
          }
          className="border border-[#303238] bg-[#111214] p-4"
        >
          <h2 className="text-sm font-semibold">
            {form.id
              ? "Modifier le bundle"
              : "Nouveau bundle"}
          </h2>


          {formError ? (
            <p className="mt-3 border border-red-500/20 bg-red-500/5 p-3 text-[9px] text-red-400">
              {formError}
            </p>
          ) : null}


          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input
              required
              value={
                form.name
              }
              onChange={
                (event) =>
                  setForm(
                    (current) => ({
                      ...current,
                      name:
                        event.target.value,
                    }),
                  )
              }
              placeholder="Nom du bundle"
              className={fieldClass}
            />

            <select
              value={
                form.pricingMode
              }
              onChange={
                (event) =>
                  setForm(
                    (current) => ({
                      ...current,
                      pricingMode:
                        event.target.value as BundlePricingMode,
                    }),
                  )
              }
              className={fieldClass}
            >
              <option value="percent_discount">
                Remise %
              </option>

              <option value="fixed_price">
                Prix bundle
              </option>
            </select>


            {form.pricingMode ===
            "percent_discount" ? (
              <input
                required
                type="number"
                min="0.01"
                max="100"
                step="0.01"
                value={
                  form.discountPercent
                }
                onChange={
                  (event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        discountPercent:
                          event.target.value,
                      }),
                    )
                }
                placeholder="Remise %"
                className={fieldClass}
              />
            ) : (
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                value={
                  form.fixedPrice
                }
                onChange={
                  (event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        fixedPrice:
                          event.target.value,
                      }),
                    )
                }
                placeholder="Prix bundle"
                className={fieldClass}
              />
            )}


            <input
              required
              maxLength={3}
              value={
                form.currency
              }
              onChange={
                (event) =>
                  setForm(
                    (current) => ({
                      ...current,
                      currency:
                        event.target.value,
                    }),
                  )
              }
              placeholder="MGA"
              className={fieldClass}
            />


            <input
              type="datetime-local"
              value={
                form.startsAt
              }
              onChange={
                (event) =>
                  setForm(
                    (current) => ({
                      ...current,
                      startsAt:
                        event.target.value,
                    }),
                  )
              }
              className={fieldClass}
            />


            <input
              type="datetime-local"
              value={
                form.endsAt
              }
              onChange={
                (event) =>
                  setForm(
                    (current) => ({
                      ...current,
                      endsAt:
                        event.target.value,
                    }),
                  )
              }
              className={fieldClass}
            />


            <textarea
              value={
                form.description
              }
              onChange={
                (event) =>
                  setForm(
                    (current) => ({
                      ...current,
                      description:
                        event.target.value,
                    }),
                  )
              }
              placeholder="Description"
              className={`${areaClass} sm:col-span-2`}
            />
          </div>


          <div className="mt-5 space-y-2 border-t border-[#303238] pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[10px] font-semibold">
                  Produits du bundle
                </h3>

                <p className="mt-1 text-[8px] text-zinc-600">
                  Minimum 2 produits distincts.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  () =>
                    setForm(
                      (current) => ({
                        ...current,

                        items: [
                          ...current.items,
                          {
                            id:
                              itemId(),

                            productId:
                              "",

                            quantity:
                              "1",
                          },
                        ],
                      }),
                    )
                }
                className={buttonClass}
              >
                Ajouter
              </button>
            </div>


            {form.items.map(
              (
                item,
                index,
              ) => (
                <div
                  key={item.id}
                  className="grid gap-2 border border-[#292c31] bg-[#0d0f12] p-3 sm:grid-cols-[1fr_100px_auto]"
                >
                  <select
                    required
                    value={
                      item.productId
                    }
                    onChange={
                      (event) =>
                        setForm(
                          (current) => ({
                            ...current,

                            items:
                              current.items.map(
                                (
                                  row,
                                  currentIndex,
                                ) =>
                                  currentIndex ===
                                  index
                                    ? {
                                        ...row,
                                        productId:
                                          event.target.value,
                                      }
                                    : row,
                              ),
                          }),
                        )
                    }
                    className={fieldClass}
                  >
                    <option value="">
                      Produit...
                    </option>

                    {products.map(
                      (product) => (
                        <option
                          key={
                            product.id
                          }
                          value={
                            product.id
                          }
                        >
                          {product.name}
                          {" · "}
                          {money(
                            product.price,
                            "MGA",
                          )}
                        </option>
                      ),
                    )}
                  </select>

                  <input
                    required
                    type="number"
                    min="1"
                    step="1"
                    value={
                      item.quantity
                    }
                    onChange={
                      (event) =>
                        setForm(
                          (current) => ({
                            ...current,

                            items:
                              current.items.map(
                                (
                                  row,
                                  currentIndex,
                                ) =>
                                  currentIndex ===
                                  index
                                    ? {
                                        ...row,
                                        quantity:
                                          event.target.value,
                                      }
                                    : row,
                              ),
                          }),
                        )
                    }
                    className={fieldClass}
                  />

                  <button
                    type="button"
                    disabled={
                      form.items.length <=
                      2
                    }
                    onClick={
                      () =>
                        setForm(
                          (current) => ({
                            ...current,

                            items:
                              current.items.filter(
                                (
                                  _,
                                  currentIndex,
                                ) =>
                                  currentIndex !==
                                  index,
                              ),
                          }),
                        )
                    }
                    className={`${buttonClass} text-red-400`}
                  >
                    Retirer
                  </button>
                </div>
              ),
            )}
          </div>


          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={
                () =>
                  setEditorOpen(
                    false,
                  )
              }
              className={buttonClass}
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={
                api.mutating
              }
              className={primaryButtonClass}
            >
              Enregistrer
            </button>
          </div>
        </form>
      ) : null}
    </section>
  );
}


function PartnershipView() {
  const dialog = useIndesyDialog();
  const api =
    usePromotionsV2();

  const [
    editorOpen,
    setEditorOpen,
  ] =
    useState(false);

  const [
    form,
    setForm,
  ] =
    useState<PartnershipForm>(
      emptyPartnership,
    );

  const [
    formError,
    setFormError,
  ] =
    useState<string | null>(
      null,
    );


  if (api.loading) {
    return (
      <div className="min-h-64">
        <IndesyDualOrbitLoader
          variant="data"
          label="Chargement des partenariats"
        />
      </div>
    );
  }


  if (!api.data) {
    return (
      <ErrorPanel
        message={
          api.error ??
          "Données indisponibles."
        }
        retry={
          () => {
            void api
              .refresh()
              .catch(
                () =>
                  undefined,
              );
          }
        }
      />
    );
  }


  const data =
    api.data;


  const organizationMap =
    useMemo(
      () =>
        new Map(
          data.organizations.map(
            (organization) => [
              organization.id,
              organization,
            ],
          ),
        ),
      [
        data.organizations,
      ],
    );


  const productMap =
    useMemo(
      () =>
        new Map(
          data.products.map(
            (product) => [
              product.id,
              product.name,
            ],
          ),
        ),
      [
        data.products,
      ],
    );


  function createPartnership() {
    setFormError(null);
    setForm(
      emptyPartnership(),
    );
    setEditorOpen(true);
  }


  function editPartnership(
    partnership:
      MarketplacePartnership,
  ) {
    setFormError(null);

    setForm({
      id:
        partnership.id,

      partnerOrganizationId:
        partnership.partnerOrganizationId ??
        "",

      partnerName:
        partnership.partnerName,

      contactName:
        partnership.contactName ??
        "",

      contactEmail:
        partnership.contactEmail ??
        "",

      contactPhone:
        partnership.contactPhone ??
        "",

      partnershipType:
        partnership.partnershipType,

      description:
        partnership.description ??
        "",

      benefitType:
        partnership.benefitType,

      benefitValue:
        partnership.benefitValue ===
        null
          ? ""
          : String(
              partnership.benefitValue,
            ),

      currency:
        partnership.currency,

      promotionCode:
        partnership.promotionCode ??
        "",

      status:
        partnership.status ===
          "active" ||
        partnership.status ===
          "paused"
          ? partnership.status
          : "draft",

      startsAt:
        toLocalDateTime(
          partnership.startsAt,
        ),

      endsAt:
        toLocalDateTime(
          partnership.endsAt,
        ),

      productIds:
        partnership.productIds,
    });

    setEditorOpen(true);
  }


  async function submit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setFormError(null);

    const input:
      MarketplacePartnershipInput = {
        id:
          form.id,

        partnerOrganizationId:
          form.partnerOrganizationId ||
          null,

        partnerName:
          form.partnerName,

        contactName:
          form.contactName,

        contactEmail:
          form.contactEmail,

        contactPhone:
          form.contactPhone,

        partnershipType:
          form.partnershipType,

        description:
          form.description,

        benefitType:
          form.benefitType,

        benefitValue:
          (
            form.benefitType ===
              "percent_discount" ||
            form.benefitType ===
              "fixed_discount"
          )
            ? Number(
                form.benefitValue,
              )
            : null,

        currency:
          form.currency,

        promotionCode:
          form.promotionCode,

        status:
          form.status,

        startsAt:
          toIso(
            form.startsAt,
          ),

        endsAt:
          toIso(
            form.endsAt,
          ),

        productIds:
          form.productIds,
      };


    try {
      await api
        .savePartnership(
          input,
        );

      setEditorOpen(false);
    }
    catch (cause) {
      setFormError(
        cause instanceof Error
          ? cause.message
          : "Impossible d'enregistrer le partenariat.",
      );
    }
  }


  function statusAction(
    id: string,
    status:
      PromotionV2Status,
  ) {
    void api
      .setPartnershipStatus(
        id,
        status,
        "",
      )
      .catch(
        () => undefined,
      );
  }

  async function archivePartnership(
    partnershipId: string,
  ) {
    const confirmed =
      await dialog.confirm({
        title:
          "Archiver ce partenariat ?",
        description:
          "Le partenariat sera archivé définitivement.",
        confirmLabel: "Archiver",
        cancelLabel: "Annuler",
        tone: "danger",
      });

    if (!confirmed) return;

    statusAction(
      partnershipId,
      "archived",
    );
  }


  return (
    <section className="space-y-4 text-zinc-100">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-[#303238] pb-4">
        <div>
          <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-[#ed1b2f]">
            Promotions
          </p>

          <h1 className="mt-1 text-[22px] font-semibold tracking-[-0.035em] text-white">
            Partenariats
          </h1>

          <p className="mt-1 max-w-3xl text-[9px] leading-5 text-zinc-600">
            Accords commerciaux Marketplace propres au vendeur. Ils restent séparés des partenariats événementiels des organisateurs.
          </p>
        </div>

        <button
          type="button"
          onClick={
            createPartnership
          }
          className={primaryButtonClass}
        >
          Nouveau partenariat
        </button>
      </header>


      {api.error ? (
        <p className="border border-red-500/20 bg-red-500/5 p-3 text-[9px] text-red-400">
          {api.error}
        </p>
      ) : null}


      <div className="grid gap-3">
        {data.partnerships.map(
          (partnership) => (
            <article
              key={
                partnership.id
              }
              className="border border-[#303238] bg-[#151619] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <strong className="text-sm">
                    {partnership.partnerName}
                  </strong>

                  <p className="mt-1 text-[8px] text-zinc-600">
                    {partnershipTypeLabel(
                      partnership.partnershipType,
                    )}
                    {" · "}
                    {statusLabel(
                      partnership.status,
                    )}
                  </p>

                  {partnership.partnerOrganizationId ? (
                    <p className="mt-1 text-[8px] text-[#72b2ff]">
                      Organisation Indesy :{" "}
                      {organizationMap.get(
                        partnership.partnerOrganizationId,
                      )?.name ??
                        partnership.partnerOrganizationId}
                    </p>
                  ) : null}
                </div>

                <span className="border border-[#303238] px-2 py-1 text-[8px] text-zinc-400">
                  {benefitLabel(
                    partnership,
                  )}
                </span>
              </div>


              {partnership.description ? (
                <p className="mt-3 text-[9px] leading-5 text-zinc-500">
                  {partnership.description}
                </p>
              ) : null}


              <div className="mt-4 grid gap-2 text-[9px] text-zinc-500 sm:grid-cols-3">
                <p>
                  Contact :{" "}
                  {partnership.contactName ||
                    "—"}
                </p>

                <p>
                  Email :{" "}
                  {partnership.contactEmail ||
                    "—"}
                </p>

                <p>
                  Téléphone :{" "}
                  {partnership.contactPhone ||
                    "—"}
                </p>
              </div>


              <div className="mt-3">
                <p className="text-[7px] uppercase text-zinc-700">
                  Produits concernés
                </p>

                <p className="mt-1 text-[9px] text-zinc-500">
                  {partnership.productIds.length
                    ? partnership.productIds
                        .map(
                          (productId) =>
                            productMap.get(
                              productId,
                            ) ??
                            productId,
                        )
                        .join(
                          " · ",
                        )
                    : "Tout le catalogue"}
                </p>
              </div>


              {partnership.history.length ? (
                <div className="mt-4 border-t border-[#292c31] pt-3">
                  <p className="text-[7px] uppercase text-zinc-700">
                    Historique
                  </p>

                  {partnership.history
                    .slice(
                      -3,
                    )
                    .map(
                      (entry) => (
                        <p
                          key={
                            entry.id
                          }
                          className="mt-1 text-[8px] text-zinc-600"
                        >
                          {entry.fromStatus
                            ? `${statusLabel(entry.fromStatus)} → `
                            : ""}
                          {statusLabel(
                            entry.toStatus,
                          )}
                          {" · "}
                          {new Date(
                            entry.createdAt,
                          ).toLocaleString(
                            "fr-FR",
                          )}
                        </p>
                      ),
                    )}
                </div>
              ) : null}


              {partnership.status !==
              "archived" ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={
                      () =>
                        editPartnership(
                          partnership,
                        )
                    }
                    className={buttonClass}
                  >
                    Modifier
                  </button>

                  {partnership.status ===
                  "draft" ? (
                    <button
                      type="button"
                      disabled={
                        api.mutating
                      }
                      onClick={
                        () =>
                          statusAction(
                            partnership.id,
                            "active",
                          )
                      }
                      className={primaryButtonClass}
                    >
                      Activer
                    </button>
                  ) : null}

                  {partnership.status ===
                  "active" ? (
                    <button
                      type="button"
                      disabled={
                        api.mutating
                      }
                      onClick={
                        () =>
                          statusAction(
                            partnership.id,
                            "paused",
                          )
                      }
                      className={buttonClass}
                    >
                      Mettre en pause
                    </button>
                  ) : null}

                  {partnership.status ===
                  "paused" ? (
                    <button
                      type="button"
                      disabled={
                        api.mutating
                      }
                      onClick={
                        () =>
                          statusAction(
                            partnership.id,
                            "active",
                          )
                      }
                      className={primaryButtonClass}
                    >
                      Réactiver
                    </button>
                  ) : null}

                  <button
                    type="button"
                    disabled={
                      api.mutating
                    }
                    onClick={() =>
                      void archivePartnership(
                        partnership.id,
                      )
                    }
                    className={`${buttonClass} text-red-400`}
                  >
                    Archiver
                  </button>
                </div>
              ) : null}
            </article>
          ),
        )}
      </div>


      {!data.partnerships.length ? (
        <div className="border border-dashed border-[#303238] p-8 text-center text-[10px] text-zinc-600">
          Aucun partenariat enregistré.
        </div>
      ) : null}


      {editorOpen ? (
        <form
          onSubmit={
            (event) =>
              void submit(
                event,
              )
          }
          className="border border-[#303238] bg-[#111214] p-4"
        >
          <h2 className="text-sm font-semibold">
            {form.id
              ? "Modifier le partenariat"
              : "Nouveau partenariat"}
          </h2>


          {formError ? (
            <p className="mt-3 border border-red-500/20 bg-red-500/5 p-3 text-[9px] text-red-400">
              {formError}
            </p>
          ) : null}


          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <select
              value={
                form.partnerOrganizationId
              }
              onChange={
                (event) => {
                  const organizationId =
                    event.target.value;

                  const organization =
                    organizationMap.get(
                      organizationId,
                    );

                  setForm(
                    (current) => ({
                      ...current,

                      partnerOrganizationId:
                        organizationId,

                      partnerName:
                        organization
                          ? organization.name
                          : current.partnerName,
                    }),
                  );
                }
              }
              className={fieldClass}
            >
              <option value="">
                Partenaire externe / non lié
              </option>

              {data.organizations.map(
                (organization) => (
                  <option
                    key={
                      organization.id
                    }
                    value={
                      organization.id
                    }
                  >
                    {organization.name}
                    {" · "}
                    {organization.type}
                  </option>
                ),
              )}
            </select>


            <input
              required
              value={
                form.partnerName
              }
              onChange={
                (event) =>
                  setForm(
                    (current) => ({
                      ...current,

                      partnerName:
                        event.target.value,
                    }),
                  )
              }
              placeholder="Nom du partenaire"
              className={fieldClass}
            />


            <input
              value={
                form.contactName
              }
              onChange={
                (event) =>
                  setForm(
                    (current) => ({
                      ...current,

                      contactName:
                        event.target.value,
                    }),
                  )
              }
              placeholder="Contact"
              className={fieldClass}
            />


            <input
              type="email"
              value={
                form.contactEmail
              }
              onChange={
                (event) =>
                  setForm(
                    (current) => ({
                      ...current,

                      contactEmail:
                        event.target.value,
                    }),
                  )
              }
              placeholder="Email"
              className={fieldClass}
            />


            <input
              value={
                form.contactPhone
              }
              onChange={
                (event) =>
                  setForm(
                    (current) => ({
                      ...current,

                      contactPhone:
                        event.target.value,
                    }),
                  )
              }
              placeholder="Téléphone"
              className={fieldClass}
            />


            <select
              value={
                form.partnershipType
              }
              onChange={
                (event) =>
                  setForm(
                    (current) => ({
                      ...current,

                      partnershipType:
                        event.target.value as PartnershipType,
                    }),
                  )
              }
              className={fieldClass}
            >
              <option value="co_marketing">
                Co-marketing
              </option>

              <option value="affiliate">
                Affiliation
              </option>

              <option value="sponsorship">
                Sponsoring
              </option>

              <option value="supplier">
                Fournisseur
              </option>

              <option value="ambassador">
                Ambassadeur
              </option>

              <option value="distribution">
                Distribution
              </option>

              <option value="other">
                Autre
              </option>
            </select>


            <select
              value={
                form.benefitType
              }
              onChange={
                (event) =>
                  setForm(
                    (current) => ({
                      ...current,

                      benefitType:
                        event.target.value as PartnershipBenefitType,
                    }),
                  )
              }
              className={fieldClass}
            >
              <option value="visibility">
                Visibilité
              </option>

              <option value="percent_discount">
                Remise %
              </option>

              <option value="fixed_discount">
                Remise fixe
              </option>

              <option value="promotion_code">
                Code partenaire
              </option>

              <option value="other">
                Autre avantage
              </option>
            </select>


            {form.benefitType ===
              "percent_discount" ||
            form.benefitType ===
              "fixed_discount" ? (
              <input
                required
                type="number"
                min="0.01"
                max={
                  form.benefitType ===
                  "percent_discount"
                    ? "100"
                    : undefined
                }
                step="0.01"
                value={
                  form.benefitValue
                }
                onChange={
                  (event) =>
                    setForm(
                      (current) => ({
                        ...current,

                        benefitValue:
                          event.target.value,
                      }),
                    )
                }
                placeholder="Valeur"
                className={fieldClass}
              />
            ) : null}


            {form.benefitType ===
            "promotion_code" ? (
              <input
                required
                value={
                  form.promotionCode
                }
                onChange={
                  (event) =>
                    setForm(
                      (current) => ({
                        ...current,

                        promotionCode:
                          event.target.value,
                      }),
                    )
                }
                placeholder="Code partenaire"
                className={fieldClass}
              />
            ) : null}


            <input
              maxLength={3}
              value={
                form.currency
              }
              onChange={
                (event) =>
                  setForm(
                    (current) => ({
                      ...current,

                      currency:
                        event.target.value,
                    }),
                  )
              }
              placeholder="MGA"
              className={fieldClass}
            />


            <input
              type="datetime-local"
              value={
                form.startsAt
              }
              onChange={
                (event) =>
                  setForm(
                    (current) => ({
                      ...current,

                      startsAt:
                        event.target.value,
                    }),
                  )
              }
              className={fieldClass}
            />


            <input
              type="datetime-local"
              value={
                form.endsAt
              }
              onChange={
                (event) =>
                  setForm(
                    (current) => ({
                      ...current,

                      endsAt:
                        event.target.value,
                    }),
                  )
              }
              className={fieldClass}
            />


            <textarea
              value={
                form.description
              }
              onChange={
                (event) =>
                  setForm(
                    (current) => ({
                      ...current,

                      description:
                        event.target.value,
                    }),
                  )
              }
              placeholder="Description / conditions du partenariat"
              className={`${areaClass} sm:col-span-2`}
            />
          </div>


          <div className="mt-5 border-t border-[#303238] pt-4">
            <h3 className="text-[10px] font-semibold">
              Produits concernés
            </h3>

            <p className="mt-1 text-[8px] text-zinc-600">
              Aucun produit sélectionné = tout le catalogue vendeur.
            </p>

            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {data.products.map(
                (product) => {
                  const checked =
                    form.productIds.includes(
                      product.id,
                    );

                  return (
                    <label
                      key={
                        product.id
                      }
                      className="flex cursor-pointer gap-2 border border-[#292c31] bg-[#0d0f12] p-3 text-[9px] text-zinc-400"
                    >
                      <input
                        type="checkbox"
                        checked={
                          checked
                        }
                        onChange={
                          () =>
                            setForm(
                              (current) => ({
                                ...current,

                                productIds:
                                  checked
                                    ? current.productIds.filter(
                                        (id) =>
                                          id !==
                                          product.id,
                                      )
                                    : [
                                        ...current.productIds,
                                        product.id,
                                      ],
                              }),
                            )
                        }
                      />

                      <span>
                        {product.name}
                      </span>
                    </label>
                  );
                },
              )}
            </div>
          </div>


          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={
                () =>
                  setEditorOpen(
                    false,
                  )
              }
              className={buttonClass}
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={
                api.mutating
              }
              className={primaryButtonClass}
            >
              Enregistrer
            </button>
          </div>
        </form>
      ) : null}
    </section>
  );
}


export function SellerPromotionsAdvancedFeature({
  view,
}: {
  view:
    SellerPromotionsAdvancedView;
}) {
  if (
    view ===
    "bundles"
  ) {
    return <BundleView />;
  }

  return <PartnershipView />;
}
