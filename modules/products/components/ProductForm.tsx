"use client";

import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import {
  GeographySelector,
  useGeography,
  type GeographyValue,
} from "@/modules/geography";

import {
  ProductImagePicker,
} from "./ProductImagePicker";

import { useCatalogCategories } from "../catalog/useCatalogCategories";

import type {
  ListingType,
  MarketplaceProduct,
  ProductCondition,
  ProductInput,
  ProductStatus,
} from "../types";


const LOCATION_SEPARATOR =
  " · ";


const fieldClassName =
  "h-10 w-full border border-[#303238] bg-[#0d0f12] px-3 text-xs text-zinc-200 outline-none transition-colors placeholder:text-zinc-600 hover:border-[#454951] focus:border-[#3d92ff]";

const labelClassName =
  "grid gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-500";


const statusLabels:
  Record<
    ProductStatus,
    string
  > = {
    draft:
      "Brouillon",

    published:
      "Publié",

    inactive:
      "Inactif",

    archived:
      "Archivé",
  };


const statusStyles:
  Record<
    ProductStatus,
    string
  > = {
    draft:
      "border-zinc-700 bg-zinc-900 text-zinc-400",

    published:
      "border-emerald-800/70 bg-emerald-950/40 text-emerald-300",

    inactive:
      "border-amber-800/70 bg-amber-950/40 text-amber-300",

    archived:
      "border-zinc-700 bg-zinc-900 text-zinc-500",
  };


type ParsedLocation = {
  address: string;
  cityName: string;
  districtName: string;
  regionName: string;
};


function parseLocation(
  location:
    string | undefined,
): ParsedLocation {
  if (!location) {
    return {
      address: "",
      cityName: "",
      districtName: "",
      regionName: "",
    };
  }

  const parts =
    location
      .split(
        LOCATION_SEPARATOR,
      )
      .map(
        (part) =>
          part.trim(),
      )
      .filter(Boolean);

  if (
    parts.length >=
    4
  ) {
    return {
      address:
        parts
          .slice(
            0,
            -3,
          )
          .join(
            LOCATION_SEPARATOR,
          ),

      cityName:
        parts[
          parts.length -
            3
        ],

      districtName:
        parts[
          parts.length -
            2
        ],

      regionName:
        parts[
          parts.length -
            1
        ],
    };
  }

  return {
    address:
      location,

    cityName: "",
    districtName:
      "",
    regionName:
      "",
  };
}


function categoryIsActive(
  value: unknown,
) {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return true;
  }

  const row =
    value as Record<string, unknown>;

  const active =
    row.isActive ??
    row.is_active ??
    row.active;

  return
    typeof active === "boolean"
      ? active
      : true;
}

export function ProductForm({
  initial,
  onSubmit,
}: {
  initial?:
    MarketplaceProduct;

  onSubmit:
    (
      input:
        ProductInput,
    ) =>
      Promise<void>;
}) {
  const parsedInitial =
    parseLocation(
      initial?.location,
    );

  const geography =
    useGeography();

  const catalogCategories =
    useCatalogCategories();


  const [
    title,
    setTitle,
  ] =
    useState(
      initial?.title ??
        "",
    );

  const [
    description,
    setDescription,
  ] =
    useState(
      initial?.description ??
        "",
    );

  const [
    type,
    setType,
  ] =
    useState<ListingType>(
      initial?.type ??
        "sale",
    );

  const [
    category,
    setCategory,
  ] =
    useState(
      initial?.category ??
        "",
    );

  const [
    salePrice,
    setSalePrice,
  ] =
    useState(
      String(
        initial?.salePrice ??
          "",
      ),
    );

  const [
    rentalPrice,
    setRentalPrice,
  ] =
    useState(
      String(
        initial?.rentalPricePerDay ??
          "",
      ),
    );

  const [
    deposit,
    setDeposit,
  ] =
    useState(
      String(
        initial?.depositAmount ??
          "",
      ),
    );

  const [
    stock,
    setStock,
  ] =
    useState(
      String(
        initial?.stock ??
          0,
      ),
    );

  const [
    condition,
    setCondition,
  ] =
    useState<ProductCondition>(
      initial?.condition ??
        "new",
    );

  const [
    images,
    setImages,
  ] =
    useState<string[]>(
      initial?.images ??
        [],
    );

  const [
    address,
    setAddress,
  ] =
    useState(
      parsedInitial.address,
    );

  const [
    geoValue,
    setGeoValue,
  ] =
    useState<GeographyValue>({
      regionId: "",
      districtId:
        "",
      cityId: "",
      communeId:
        "",
    });

  const [
    status,
    setStatus,
  ] =
    useState<ProductStatus>(
      initial?.status ??
        "draft",
    );

  const [
    submitError,
    setSubmitError,
  ] =
    useState<string | null>(
      null,
    );

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false);


  useEffect(() => {
    if (
      !initial ||
      !geography.data ||
      geoValue.regionId
    ) {
      return;
    }

    const {
      regionName,
      districtName,
      cityName,
    } =
      parsedInitial;

    if (
      !regionName ||
      !districtName ||
      !cityName
    ) {
      return;
    }

    const region =
      geography.data.regions.find(
        (item) =>
          item.name.localeCompare(
            regionName,
            "fr",
            {
              sensitivity:
                "base",
            },
          ) === 0,
      );

    if (!region) {
      return;
    }

    const district =
      geography.data.districts.find(
        (item) =>
          item.regionId ===
            region.id &&
          item.name.localeCompare(
            districtName,
            "fr",
            {
              sensitivity:
                "base",
            },
          ) === 0,
      );

    if (!district) {
      return;
    }

    const city =
      geography.data.cities.find(
        (item) =>
          item.districtId ===
            district.id &&
          item.name.localeCompare(
            cityName,
            "fr",
            {
              sensitivity:
                "base",
            },
          ) === 0,
      );

    setGeoValue({
      regionId:
        region.id,

      districtId:
        district.id,

      cityId:
        city?.id ??
        "",

      communeId:
        "",
    });
  }, [
    geoValue.regionId,
    geography.data,
    initial,
    parsedInitial.cityName,
    parsedInitial.districtName,
    parsedInitial.regionName,
  ]);


  async function submit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setSubmitError(
      null,
    );

    if (
      !geography.data
    ) {
      setSubmitError(
        "Le référentiel géographique n’est pas encore disponible.",
      );

      return;
    }

    const region =
      geography.data.regions.find(
        (item) =>
          item.id ===
          geoValue.regionId,
      );

    const district =
      geography.data.districts.find(
        (item) =>
          item.id ===
          geoValue.districtId,
      );

    const city =
      geography.data.cities.find(
        (item) =>
          item.id ===
          geoValue.cityId,
      );

    if (
      !address.trim() ||
      !region ||
      !district ||
      !city
    ) {
      setSubmitError(
        "L’adresse, la région, le district et la ville sont obligatoires.",
      );

      return;
    }

    const location =
      [
        address.trim(),
        city.name,
        district.name,
        region.name,
      ].join(
        LOCATION_SEPARATOR,
      );

    setSubmitting(
      true,
    );

    try {
      await onSubmit({
        title,
        description,
        type,
        category,

        salePrice:
          salePrice
            ? Number(
                salePrice,
              )
            : null,

        rentalPricePerDay:
          rentalPrice
            ? Number(
                rentalPrice,
              )
            : null,

        depositAmount:
          deposit
            ? Number(
                deposit,
              )
            : null,

        stock:
          Number(
            stock,
          ) || 0,

        condition,

        images,

        sellerId:
          initial?.sellerId ??
          "",

        sellerName:
          initial?.sellerName ??
          "Vendeur",

        location,

        status,
      });
    }
    catch (cause) {
      setSubmitError(
        cause instanceof Error
          ? cause.message
          : "Impossible d’enregistrer le produit.",
      );
    }
    finally {
      setSubmitting(
        false,
      );
    }
  }


  return (
    <form
      onSubmit={submit}
      className="border border-[#303238] bg-[#151619] text-zinc-100"
    >
      <header className="border-b border-[#303238] bg-[#101114] px-4 py-3">
        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#3d92ff]">
          Catalogue vendeur
        </p>

        <h2 className="mt-1 text-lg font-black text-white">
          {initial
            ? "Modifier le produit"
            : "Créer un produit"}
        </h2>
      </header>


      <div className="grid gap-5 p-4">
        <section className="grid gap-4">
          <label
            className={
              labelClassName
            }
          >
            Titre

            <input
              required
              value={
                title
              }
              onChange={(
                event,
              ) =>
                setTitle(
                  event.target
                    .value,
                )
              }
              placeholder="Titre du produit"
              className={
                fieldClassName
              }
            />
          </label>


          <label
            className={
              labelClassName
            }
          >
            Description

            <textarea
              value={
                description
              }
              onChange={(
                event,
              ) =>
                setDescription(
                  event.target
                    .value,
                )
              }
              placeholder="Description détaillée du produit"
              className="min-h-28 w-full border border-[#303238] bg-[#0d0f12] px-3 py-2 text-xs text-zinc-200 outline-none transition-colors placeholder:text-zinc-600 hover:border-[#454951] focus:border-[#3d92ff]"
            />
          </label>


          <div className="grid gap-3 md:grid-cols-3">
            <label
              className={
                labelClassName
              }
            >
              Type d’offre

              <select
                value={
                  type
                }
                onChange={(
                  event,
                ) =>
                  setType(
                    event.target
                      .value as ListingType,
                  )
                }
                className={
                  fieldClassName
                }
              >
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
            </label>


            <label
              className={
                labelClassName
              }
            >
              Catégorie

              <select
                value={
                  category
                }
                disabled={
                  catalogCategories.loading
                }
                onChange={(
                  event,
                ) =>
                  setCategory(
                    event.target
                      .value,
                  )
                }
                className={
                  fieldClassName
                }
              >
                <option value="">
                  Sans catégorie
                </option>

                {catalogCategories.categories
                  .filter(
                    (item) =>
                      categoryIsActive(
                        item,
                      ),
                  )
                  .map(
                    (item) => (
                      <option
                        key={
                          item.id
                        }
                        value={
                          item.name
                        }
                      >
                        {
                          item.name
                        }
                      </option>
                    ),
                  )}

                {initial?.category &&
                !catalogCategories.categories.some(
                  (item) =>
                    item.name ===
                    initial.category,
                ) ? (
                  <option
                    value={
                      initial.category
                    }
                  >
                    {
                      initial.category
                    }
                  </option>
                ) : null}
              </select>

              <span className="normal-case tracking-normal text-zinc-600">
                {catalogCategories.loading
                  ? "Chargement des catégories…"
                  : catalogCategories.error
                    ? catalogCategories.error
                    : "Taxonomie officielle Indesy Bazar."}
              </span>
            </label>


            <label
              className={
                labelClassName
              }
            >
              État

              <select
                value={
                  condition
                }
                onChange={(
                  event,
                ) =>
                  setCondition(
                    event.target
                      .value as ProductCondition,
                  )
                }
                className={
                  fieldClassName
                }
              >
                <option value="new">
                  Neuf
                </option>

                <option value="excellent">
                  Excellent
                </option>

                <option value="good">
                  Bon
                </option>

                <option value="used">
                  Usagé
                </option>
              </select>
            </label>
          </div>


          <div className="grid gap-3 md:grid-cols-4">
            <label
              className={
                labelClassName
              }
            >
              Prix de vente

              <input
                type="number"
                min="0"
                value={
                  salePrice
                }
                onChange={(
                  event,
                ) =>
                  setSalePrice(
                    event.target
                      .value,
                  )
                }
                placeholder="Montant"
                className={
                  fieldClassName
                }
              />
            </label>


            <label
              className={
                labelClassName
              }
            >
              Location / jour

              <input
                type="number"
                min="0"
                value={
                  rentalPrice
                }
                onChange={(
                  event,
                ) =>
                  setRentalPrice(
                    event.target
                      .value,
                  )
                }
                placeholder="Montant"
                className={
                  fieldClassName
                }
              />
            </label>


            <label
              className={
                labelClassName
              }
            >
              Caution

              <input
                type="number"
                min="0"
                value={
                  deposit
                }
                onChange={(
                  event,
                ) =>
                  setDeposit(
                    event.target
                      .value,
                  )
                }
                placeholder="Montant"
                className={
                  fieldClassName
                }
              />
            </label>


            <label
              className={
                labelClassName
              }
            >
              Stock

              <input
                type="number"
                min="0"
                value={
                  stock
                }
                onChange={(
                  event,
                ) =>
                  setStock(
                    event.target
                      .value,
                  )
                }
                placeholder="Quantité"
                className={
                  fieldClassName
                }
              />
            </label>
          </div>
        </section>


        <section className="overflow-hidden border border-[#303238] bg-[#101114]">
          <header className="border-b border-[#303238] px-4 py-3">
            <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-[#3d92ff]">
              Localisation
            </p>

            <p className="mt-1 text-[9px] text-zinc-600">
              Indiquez précisément le lieu où le produit est disponible.
            </p>
          </header>

          <div className="grid gap-4 p-4">
            <label
              className={
                labelClassName
              }
            >
              Adresse

              <input
                required
                value={
                  address
                }
                onChange={(
                  event,
                ) =>
                  setAddress(
                    event.target
                      .value,
                  )
                }
                placeholder="Ex. Lot II A 45, Amborovy"
                className={
                  fieldClassName
                }
              />
            </label>


            <GeographySelector
              mode="city"
              required
              value={
                geoValue
              }
              onChange={
                setGeoValue
              }
            />


            {address &&
            geoValue.regionId &&
            geoValue.districtId &&
            geoValue.cityId &&
            geography.data ? (
              <div className="border border-[#303238] bg-[#0d0f12] px-3 py-2">
                <span className="text-[8px] font-bold uppercase tracking-[0.1em] text-zinc-600">
                  Aperçu
                </span>

                <p className="mt-1 text-[10px] text-zinc-300">
                  {[
                    address,
                    geography.data.cities.find(
                      (item) =>
                        item.id ===
                        geoValue.cityId,
                    )?.name,
                    geography.data.districts.find(
                      (item) =>
                        item.id ===
                        geoValue.districtId,
                    )?.name,
                    geography.data.regions.find(
                      (item) =>
                        item.id ===
                        geoValue.regionId,
                    )?.name,
                  ]
                    .filter(Boolean)
                    .join(
                      LOCATION_SEPARATOR,
                    )}
                </p>
              </div>
            ) : null}
          </div>
        </section>


        <ProductImagePicker
          images={
            images
          }
          onChange={
            setImages
          }
        />


        {initial ? (
          <div className="border border-[#303238] bg-[#101114] p-3">
            <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
              Statut actuel
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-3">
              <span
                className={
                  "inline-flex border px-2 py-1 text-[9px] font-semibold " +
                  statusStyles[
                    status
                  ]
                }
              >
                {
                  statusLabels[
                    status
                  ]
                }
              </span>

              <p className="text-[10px] text-zinc-500">
                Utilisez les actions du cycle de vie pour modifier le statut.
              </p>
            </div>
          </div>
        ) : (
          <label
            className={
              labelClassName
            }
          >
            Statut initial

            <select
              value={
                status
              }
              onChange={(
                event,
              ) =>
                setStatus(
                  event.target
                    .value as
                    | "draft"
                    | "published",
                )
              }
              className={
                fieldClassName
              }
            >
              <option value="draft">
                Brouillon
              </option>

              <option value="published">
                Publié
              </option>
            </select>

            <span className="normal-case tracking-normal text-zinc-600">
              Un nouveau produit peut uniquement être créé comme brouillon ou publié.
            </span>
          </label>
        )}


        {submitError ? (
          <p
            role="alert"
            className="border border-red-500/30 bg-red-500/5 px-3 py-2 text-[10px] text-red-400"
          >
            {submitError}
          </p>
        ) : null}
      </div>


      <footer className="border-t border-[#303238] bg-[#101114] p-4">
        <button
          type="submit"
          disabled={
            submitting
          }
          className="inline-flex h-9 items-center border border-[#d8273f] bg-[#c82335] px-4 text-xs font-bold text-white transition-colors hover:bg-[#df2a43] disabled:cursor-wait disabled:opacity-50"
        >
          {submitting
            ? "Enregistrement…"
            : initial
              ? "Enregistrer"
              : "Créer le produit"}
        </button>
      </footer>
    </form>
  );
}