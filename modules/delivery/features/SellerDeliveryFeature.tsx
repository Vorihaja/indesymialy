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
  GeographySelector,
} from "@/modules/geography/components/GeographySelector";

import type {
  GeographyValue,
} from "@/modules/geography/types";

import {
  DeliveryFeature,
} from "./DeliveryFeature";

import {
  useDeliveryAdvanced,
} from "../advanced/useDeliveryAdvanced";

import type {
  DeliveryCarrier,
  DeliveryCarrierInput,
  DeliveryZone,
  DeliveryZoneInput,
  MarketplaceReturnItemCondition,
  MarketplaceReturnResolution,
  MarketplaceReturnStatus,
} from "../advanced/types";


const fieldClass =
  "h-9 w-full border border-[#303238] bg-[#0d0f12] px-3 text-[10px] text-zinc-200 outline-none placeholder:text-zinc-700 focus:border-[#3d92ff]";


const buttonClass =
  "h-8 border border-[#303238] bg-[#151619] px-3 text-[9px] font-semibold text-zinc-400 hover:text-white disabled:opacity-40";


const primaryButtonClass =
  "h-8 border border-[#ed1b2f] bg-[#ed1b2f] px-3 text-[9px] font-semibold text-white hover:bg-[#ff3045] disabled:opacity-40";


const EMPTY_GEO:
  GeographyValue = {
    regionId: "",
    districtId: "",
    cityId: "",
    communeId: "",
  };


function money(
  value: number,
  currency: string,
) {
  return (
    new Intl.NumberFormat(
      "fr-FR",
      {
        maximumFractionDigits: 2,
      },
    ).format(value) +
    " " +
    currency
  );
}


function statusLabel(
  value: string,
) {
  switch (value) {
    case "active":
      return "Actif";

    case "inactive":
      return "Inactif";

    case "archived":
      return "Archivé";

    default:
      return value;
  }
}


function returnStatusLabel(
  status:
    MarketplaceReturnStatus,
) {
  switch (status) {
    case "requested":
      return "Demandé";

    case "approved":
      return "Approuvé";

    case "rejected":
      return "Refusé";

    case "received":
      return "Reçu";

    case "resolved":
      return "Résolu";

    case "cancelled":
      return "Annulé";
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
    <div className="grid min-h-[300px] place-items-center border border-red-500/20 bg-red-500/5 p-6 text-center">
      <div>
        <p className="text-xs font-semibold text-red-400">
          Impossible de charger la logistique
        </p>

        <p className="mt-2 text-[9px] text-zinc-500">
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


function CarrierView() {
  const dialog = useIndesyDialog();
  const api =
    useDeliveryAdvanced();

  const [
    editing,
    setEditing,
  ] =
    useState<
      DeliveryCarrier | null
    >(null);

  const [
    editorOpen,
    setEditorOpen,
  ] =
    useState(false);

  const [
    form,
    setForm,
  ] =
    useState<
      DeliveryCarrierInput
    >({
      name: "",
      phone: "",
      email: "",
      website: "",
      trackingUrlTemplate: "",
      notes: "",
      status: "active",
    });

  const [
    deliveryId,
    setDeliveryId,
  ] =
    useState("");

  const [
    assignmentCarrierId,
    setAssignmentCarrierId,
  ] =
    useState("");

  const [
    trackingNumber,
    setTrackingNumber,
  ] =
    useState("");


  if (api.loading) {
    return (
      <div className="min-h-64">
        <IndesyDualOrbitLoader
          variant="data"
          label="Chargement des transporteurs"
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
                () => undefined,
              );
          }
        }
      />
    );
  }


  function openCreate() {
    setEditing(null);

    setForm({
      name: "",
      phone: "",
      email: "",
      website: "",
      trackingUrlTemplate: "",
      notes: "",
      status: "active",
    });

    setEditorOpen(true);
  }


  function openEdit(
    carrier:
      DeliveryCarrier,
  ) {
    setEditing(carrier);

    setForm({
      id:
        carrier.id,

      name:
        carrier.name,

      phone:
        carrier.phone ??
        "",

      email:
        carrier.email ??
        "",

      website:
        carrier.website ??
        "",

      trackingUrlTemplate:
        carrier.trackingUrlTemplate ??
        "",

      notes:
        carrier.notes ??
        "",

      status:
        carrier.status ===
          "inactive"
          ? "inactive"
          : "active",
    });

    setEditorOpen(true);
  }


  async function submitCarrier(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    await api.saveCarrier(
      form,
    );

    setEditorOpen(false);
  }


  async function submitAssignment(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    await api.assignCarrier(
      deliveryId,
      assignmentCarrierId ||
        null,
      trackingNumber,
    );

    setDeliveryId("");
    setAssignmentCarrierId("");
    setTrackingNumber("");
  }


  async function confirmCarrierArchive(
    carrierId: string,
  ) {
    const confirmed =
      await dialog.confirm({
        title:
          "Archiver ce transporteur ?",
        description:
          "Le transporteur ne sera plus proposé pour les nouvelles livraisons.",
        confirmLabel: "Archiver",
        cancelLabel: "Annuler",
        tone: "danger",
      });

    if (!confirmed) {
      return;
    }

    await api
      .archiveCarrier(carrierId)
      .catch(() => undefined);
  }


  return (
    <section className="space-y-5 text-zinc-100">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-[#303238] pb-4">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#3d92ff]">
            Livraison
          </p>

          <h1 className="mt-1 text-xl font-black">
            Transporteurs
          </h1>

          <p className="mt-1 text-[9px] text-zinc-600">
            Référentiel des transporteurs et affectation aux expéditions.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className={primaryButtonClass}
        >
          Nouveau transporteur
        </button>
      </header>


      {api.error ? (
        <p className="border border-red-500/20 bg-red-500/5 p-3 text-[9px] text-red-400">
          {api.error}
        </p>
      ) : null}


      <form
        onSubmit={
          (event) =>
            void submitAssignment(
              event,
            ).catch(
              () => undefined,
            )
        }
        className="border border-[#303238] bg-[#111214] p-4"
      >
        <h2 className="text-sm font-black">
          Affecter un transporteur
        </h2>

        <p className="mt-1 text-[8px] text-zinc-600">
          Cette action ne modifie pas le statut commercial de la commande.
        </p>

        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          <select
            required
            value={deliveryId}
            onChange={
              (event) => {
                const next =
                  event.target.value;

                setDeliveryId(
                  next,
                );

                const delivery =
                  api.data?.deliveries
                    .find(
                      (item) =>
                        item.id ===
                        next,
                    );

                setAssignmentCarrierId(
                  delivery?.carrierId ??
                    "",
                );

                setTrackingNumber(
                  delivery?.trackingNumber ??
                    "",
                );
              }
            }
            className={fieldClass}
          >
            <option value="">
              Sélectionner une expédition
            </option>

            {api.data.deliveries.map(
              (item) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  Commande{" "}
                  {item.orderId.slice(
                    0,
                    8,
                  )}
                  {" · "}
                  {item.status}
                </option>
              ),
            )}
          </select>

          <select
            value={
              assignmentCarrierId
            }
            onChange={
              (event) =>
                setAssignmentCarrierId(
                  event.target.value,
                )
            }
            className={fieldClass}
          >
            <option value="">
              Aucun transporteur
            </option>

            {api.data.carriers
              .filter(
                (carrier) =>
                  carrier.status ===
                  "active",
              )
              .map(
                (carrier) => (
                  <option
                    key={
                      carrier.id
                    }
                    value={
                      carrier.id
                    }
                  >
                    {carrier.name}
                  </option>
                ),
              )}
          </select>

          <input
            value={
              trackingNumber
            }
            onChange={
              (event) =>
                setTrackingNumber(
                  event.target.value,
                )
            }
            placeholder="Numéro de suivi"
            className={fieldClass}
          />
        </div>

        <div className="mt-3 text-right">
          <button
            type="submit"
            disabled={
              api.mutating
            }
            className={primaryButtonClass}
          >
            Affecter
          </button>
        </div>
      </form>


      <div className="grid gap-3 lg:grid-cols-2">
        {api.data.carriers.map(
          (carrier) => (
            <article
              key={carrier.id}
              className="border border-[#303238] bg-[#151619] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <strong className="text-sm text-white">
                    {carrier.name}
                  </strong>

                  <p className="mt-1 text-[8px] text-zinc-600">
                    {statusLabel(
                      carrier.status,
                    )}
                    {" · "}
                    {carrier.usageCount}
                    {" expédition(s)"}
                  </p>
                </div>

                <span className="border border-[#303238] px-2 py-1 text-[8px] text-zinc-500">
                  {statusLabel(
                    carrier.status,
                  )}
                </span>
              </div>

              <div className="mt-4 grid gap-2 text-[9px] text-zinc-400 sm:grid-cols-2">
                <p>
                  Téléphone :{" "}
                  {carrier.phone ||
                    "—"}
                </p>

                <p>
                  Email :{" "}
                  {carrier.email ||
                    "—"}
                </p>

                <p>
                  Site :{" "}
                  {carrier.website ||
                    "—"}
                </p>

                <p>
                  Suivi :{" "}
                  {carrier.trackingUrlTemplate ||
                    "—"}
                </p>
              </div>

              {carrier.notes ? (
                <p className="mt-3 text-[9px] leading-5 text-zinc-600">
                  {carrier.notes}
                </p>
              ) : null}

              {carrier.status !==
              "archived" ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={
                      () =>
                        openEdit(
                          carrier,
                        )
                    }
                    className={buttonClass}
                  >
                    Modifier
                  </button>

                  <button
                    type="button"
                    disabled={
                      api.mutating
                    }
                    onClick={
                      () =>
                        void api
                          .saveCarrier({
                            id:
                              carrier.id,
                            name:
                              carrier.name,
                            phone:
                              carrier.phone ??
                              "",
                            email:
                              carrier.email ??
                              "",
                            website:
                              carrier.website ??
                              "",
                            trackingUrlTemplate:
                              carrier.trackingUrlTemplate ??
                              "",
                            notes:
                              carrier.notes ??
                              "",
                            status:
                              carrier.status ===
                                "active"
                                ? "inactive"
                                : "active",
                          })
                          .catch(
                            () =>
                              undefined,
                          )
                    }
                    className={buttonClass}
                  >
                    {carrier.status ===
                    "active"
                      ? "Désactiver"
                      : "Activer"}
                  </button>

                  <button
                    type="button"
                    disabled={
                      api.mutating
                    }
                    onClick={() =>
                      void confirmCarrierArchive(
                        carrier.id,
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


      {!api.data.carriers.length ? (
        <p className="border border-dashed border-[#303238] p-8 text-center text-[10px] text-zinc-600">
          Aucun transporteur enregistré.
        </p>
      ) : null}


      {editorOpen ? (
        <form
          onSubmit={
            (event) =>
              void submitCarrier(
                event,
              ).catch(
                () => undefined,
              )
          }
          className="border border-[#303238] bg-[#111214] p-4"
        >
          <h2 className="font-black">
            {editing
              ? "Modifier le transporteur"
              : "Nouveau transporteur"}
          </h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input
              required
              value={form.name}
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
              placeholder="Nom"
              className={fieldClass}
            />

            <input
              value={form.phone}
              onChange={
                (event) =>
                  setForm(
                    (current) => ({
                      ...current,
                      phone:
                        event.target.value,
                    }),
                  )
              }
              placeholder="Téléphone"
              className={fieldClass}
            />

            <input
              type="email"
              value={form.email}
              onChange={
                (event) =>
                  setForm(
                    (current) => ({
                      ...current,
                      email:
                        event.target.value,
                    }),
                  )
              }
              placeholder="Email"
              className={fieldClass}
            />

            <input
              value={form.website}
              onChange={
                (event) =>
                  setForm(
                    (current) => ({
                      ...current,
                      website:
                        event.target.value,
                    }),
                  )
              }
              placeholder="Site web"
              className={fieldClass}
            />

            <input
              value={
                form.trackingUrlTemplate
              }
              onChange={
                (event) =>
                  setForm(
                    (current) => ({
                      ...current,
                      trackingUrlTemplate:
                        event.target.value,
                    }),
                  )
              }
              placeholder="URL / modèle de suivi"
              className={`${fieldClass} sm:col-span-2`}
            />

            <textarea
              value={form.notes}
              onChange={
                (event) =>
                  setForm(
                    (current) => ({
                      ...current,
                      notes:
                        event.target.value,
                    }),
                  )
              }
              placeholder="Notes"
              className="min-h-20 border border-[#303238] bg-[#0d0f12] p-3 text-[10px] text-zinc-300 outline-none focus:border-[#3d92ff] sm:col-span-2"
            />
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


function ZoneView() {
  const dialog = useIndesyDialog();
  const api =
    useDeliveryAdvanced();

  const [
    editing,
    setEditing,
  ] =
    useState<
      DeliveryZone | null
    >(null);

  const [
    editorOpen,
    setEditorOpen,
  ] =
    useState(false);

  const [
    form,
    setForm,
  ] =
    useState<
      DeliveryZoneInput
    >({
      name: "",
      deliveryFee: 0,
      currency: "MGA",
      minDeliveryDays: 1,
      maxDeliveryDays: 2,
      freeDeliveryThreshold:
        null,
      status: "active",
      areas: [
        {
          ...EMPTY_GEO,
        },
      ],
    });


  if (api.loading) {
    return (
      <div className="min-h-64">
        <IndesyDualOrbitLoader
          variant="data"
          label="Chargement des zones"
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
                () => undefined,
              );
          }
        }
      />
    );
  }


  function openCreate() {
    setEditing(null);

    setForm({
      name: "",
      deliveryFee: 0,
      currency: "MGA",
      minDeliveryDays: 1,
      maxDeliveryDays: 2,
      freeDeliveryThreshold:
        null,
      status: "active",
      areas: [
        {
          ...EMPTY_GEO,
        },
      ],
    });

    setEditorOpen(true);
  }


  function openEdit(
    zone: DeliveryZone,
  ) {
    setEditing(zone);

    setForm({
      id:
        zone.id,

      name:
        zone.name,

      deliveryFee:
        zone.deliveryFee,

      currency:
        zone.currency,

      minDeliveryDays:
        zone.minDeliveryDays,

      maxDeliveryDays:
        zone.maxDeliveryDays,

      freeDeliveryThreshold:
        zone.freeDeliveryThreshold,

      status:
        zone.status ===
          "inactive"
          ? "inactive"
          : "active",

      areas:
        zone.areas.length
          ? zone.areas.map(
              (area) => ({
                regionId:
                  area.regionId ??
                  "",
                districtId:
                  area.districtId ??
                  "",
                cityId:
                  area.cityId ??
                  "",
                communeId:
                  area.communeId ??
                  "",
              }),
            )
          : [
              {
                ...EMPTY_GEO,
              },
            ],
    });

    setEditorOpen(true);
  }


  async function submit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const areas =
      form.areas.filter(
        (area) =>
          Boolean(
            area.regionId ||
            area.districtId ||
            area.cityId ||
            area.communeId,
          ),
      );

    await api.saveZone({
      ...form,
      areas,
    });

    setEditorOpen(false);
  }


  async function confirmZoneArchive(
    zoneId: string,
  ) {
    const confirmed =
      await dialog.confirm({
        title:
          "Archiver cette zone ?",
        description:
          "La zone ne sera plus proposée pour les nouvelles livraisons.",
        confirmLabel: "Archiver",
        cancelLabel: "Annuler",
        tone: "danger",
      });

    if (!confirmed) {
      return;
    }

    await api
      .archiveZone(zoneId)
      .catch(() => undefined);
  }


  return (
    <section className="space-y-5 text-zinc-100">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-[#303238] pb-4">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#3d92ff]">
            Livraison
          </p>

          <h1 className="mt-1 text-xl font-black">
            Zones
          </h1>

          <p className="mt-1 text-[9px] text-zinc-600">
            Zones géographiques, tarifs et délais. Aucun calcul checkout n'est encore activé.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className={primaryButtonClass}
        >
          Nouvelle zone
        </button>
      </header>


      {api.error ? (
        <p className="border border-red-500/20 bg-red-500/5 p-3 text-[9px] text-red-400">
          {api.error}
        </p>
      ) : null}


      <div className="grid gap-3 lg:grid-cols-2">
        {api.data.zones.map(
          (zone) => (
            <article
              key={zone.id}
              className="border border-[#303238] bg-[#151619] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <strong className="text-sm text-white">
                    {zone.name}
                  </strong>

                  <p className="mt-1 text-[8px] text-zinc-600">
                    {zone.areas.length}
                    {" territoire(s)"}
                  </p>
                </div>

                <span className="text-[8px] text-zinc-500">
                  {statusLabel(
                    zone.status,
                  )}
                </span>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-[7px] uppercase text-zinc-700">
                    Tarif
                  </p>

                  <p className="mt-1 text-xs font-semibold">
                    {money(
                      zone.deliveryFee,
                      zone.currency,
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-[7px] uppercase text-zinc-700">
                    Délai
                  </p>

                  <p className="mt-1 text-xs font-semibold">
                    {zone.minDeliveryDays}
                    {" – "}
                    {zone.maxDeliveryDays}
                    {" j"}
                  </p>
                </div>

                <div>
                  <p className="text-[7px] uppercase text-zinc-700">
                    Gratuit dès
                  </p>

                  <p className="mt-1 text-xs font-semibold">
                    {zone.freeDeliveryThreshold ===
                    null
                      ? "—"
                      : money(
                          zone.freeDeliveryThreshold,
                          zone.currency,
                        )}
                  </p>
                </div>
              </div>

              {zone.status !==
              "archived" ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={
                      () =>
                        openEdit(
                          zone,
                        )
                    }
                    className={buttonClass}
                  >
                    Modifier
                  </button>

                  <button
                    type="button"
                    disabled={
                      api.mutating
                    }
                    onClick={
                      () =>
                        void api
                          .saveZone({
                            id:
                              zone.id,
                            name:
                              zone.name,
                            deliveryFee:
                              zone.deliveryFee,
                            currency:
                              zone.currency,
                            minDeliveryDays:
                              zone.minDeliveryDays,
                            maxDeliveryDays:
                              zone.maxDeliveryDays,
                            freeDeliveryThreshold:
                              zone.freeDeliveryThreshold,
                            status:
                              zone.status ===
                                "active"
                                ? "inactive"
                                : "active",
                            areas:
                              zone.areas.map(
                                (area) => ({
                                  regionId:
                                    area.regionId ??
                                    "",
                                  districtId:
                                    area.districtId ??
                                    "",
                                  cityId:
                                    area.cityId ??
                                    "",
                                  communeId:
                                    area.communeId ??
                                    "",
                                }),
                              ),
                          })
                          .catch(
                            () =>
                              undefined,
                          )
                    }
                    className={buttonClass}
                  >
                    {zone.status ===
                    "active"
                      ? "Désactiver"
                      : "Activer"}
                  </button>

                  <button
                    type="button"
                    disabled={
                      api.mutating
                    }
                    onClick={() =>
                      void confirmZoneArchive(
                        zone.id,
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


      {!api.data.zones.length ? (
        <p className="border border-dashed border-[#303238] p-8 text-center text-[10px] text-zinc-600">
          Aucune zone de livraison.
        </p>
      ) : null}


      {editorOpen ? (
        <form
          onSubmit={
            (event) =>
              void submit(
                event,
              ).catch(
                () => undefined,
              )
          }
          className="border border-[#303238] bg-[#111214] p-4"
        >
          <h2 className="font-black">
            {editing
              ? "Modifier la zone"
              : "Nouvelle zone"}
          </h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input
              required
              value={form.name}
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
              placeholder="Nom de la zone"
              className={fieldClass}
            />

            <input
              value={form.currency}
              maxLength={3}
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
              type="number"
              min="0"
              step="0.01"
              value={
                form.deliveryFee
              }
              onChange={
                (event) =>
                  setForm(
                    (current) => ({
                      ...current,
                      deliveryFee:
                        Number(
                          event.target.value,
                        ),
                    }),
                  )
              }
              placeholder="Tarif"
              className={fieldClass}
            />

            <input
              type="number"
              min="0"
              step="0.01"
              value={
                form.freeDeliveryThreshold ??
                ""
              }
              onChange={
                (event) =>
                  setForm(
                    (current) => ({
                      ...current,
                      freeDeliveryThreshold:
                        event.target.value
                          ? Number(
                              event.target.value,
                            )
                          : null,
                    }),
                  )
              }
              placeholder="Seuil livraison gratuite"
              className={fieldClass}
            />

            <input
              type="number"
              min="0"
              step="1"
              value={
                form.minDeliveryDays
              }
              onChange={
                (event) =>
                  setForm(
                    (current) => ({
                      ...current,
                      minDeliveryDays:
                        Number(
                          event.target.value,
                        ),
                    }),
                  )
              }
              placeholder="Délai minimum"
              className={fieldClass}
            />

            <input
              type="number"
              min="0"
              step="1"
              value={
                form.maxDeliveryDays
              }
              onChange={
                (event) =>
                  setForm(
                    (current) => ({
                      ...current,
                      maxDeliveryDays:
                        Number(
                          event.target.value,
                        ),
                    }),
                  )
              }
              placeholder="Délai maximum"
              className={fieldClass}
            />
          </div>


          <div className="mt-5 space-y-3 border-t border-[#303238] pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold">
                  Territoires
                </h3>

                <p className="mt-1 text-[8px] text-zinc-600">
                  Région, district, ville et commune.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  () =>
                    setForm(
                      (current) => ({
                        ...current,
                        areas: [
                          ...current.areas,
                          {
                            ...EMPTY_GEO,
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


            {form.areas.map(
              (area, index) => (
                <div
                  key={index}
                  className="border border-[#292c31] bg-[#0d0f12] p-3"
                >
                  <GeographySelector
                    value={area}
                    onChange={
                      (next) =>
                        setForm(
                          (current) => ({
                            ...current,

                            areas:
                              current.areas.map(
                                (
                                  item,
                                  currentIndex,
                                ) =>
                                  currentIndex ===
                                  index
                                    ? next
                                    : item,
                              ),
                          }),
                        )
                    }
                  />

                  {form.areas.length >
                  1 ? (
                    <div className="mt-2 text-right">
                      <button
                        type="button"
                        onClick={
                          () =>
                            setForm(
                              (current) => ({
                                ...current,

                                areas:
                                  current.areas.filter(
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
                        className="text-[8px] text-red-400"
                      >
                        Retirer
                      </button>
                    </div>
                  ) : null}
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


function ReturnView() {
  const api =
    useDeliveryAdvanced();

  const [
    orderId,
    setOrderId,
  ] =
    useState("");

  const [
    reason,
    setReason,
  ] =
    useState("");

  const [
    quantities,
    setQuantities,
  ] =
    useState<
      Record<string, string>
    >({});

  const [
    conditions,
    setConditions,
  ] =
    useState<
      Record<
        string,
        MarketplaceReturnItemCondition
      >
    >({});

  const [
    notes,
    setNotes,
  ] =
    useState<
      Record<string, string>
    >({});

  const [
    resolutions,
    setResolutions,
  ] =
    useState<
      Record<
        string,
        MarketplaceReturnResolution
      >
    >({});


  const selectedOrder =
    useMemo(
      () =>
        api.data
          ?.returnCandidateOrders
          .find(
            (order) =>
              order.id ===
              orderId,
          ) ??
        null,
      [
        api.data,
        orderId,
      ],
    );


  if (api.loading) {
    return (
      <div className="min-h-64">
        <IndesyDualOrbitLoader
          variant="data"
          label="Chargement des retours"
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
                () => undefined,
              );
          }
        }
      />
    );
  }


  async function submit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!selectedOrder) {
      return;
    }

    const items =
      selectedOrder.lines
        .map(
          (line) => ({
            orderLineId:
              line.id,

            quantity:
              Number(
                quantities[
                  line.id
                ] ?? 0,
              ),

            condition:
              conditions[
                line.id
              ] ??
              "good",

            note:
              notes[
                line.id
              ] ??
              "",
          }),
        )
        .filter(
          (item) =>
            item.quantity >
            0,
        );


    await api.createReturn({
      orderId:
        selectedOrder.id,
      reason,
      items,
    });


    setOrderId("");
    setReason("");
    setQuantities({});
    setConditions({});
    setNotes({});
  }


  function transition(
    id: string,
    status:
      MarketplaceReturnStatus,
    resolution?:
      MarketplaceReturnResolution,
  ) {
    void api
      .transitionReturn(
        id,
        status,
        "",
        resolution,
      )
      .catch(
        () => undefined,
      );
  }


  return (
    <section className="space-y-5 text-zinc-100">
      <header className="border-b border-[#303238] pb-4">
        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#3d92ff]">
          Livraison
        </p>

        <h1 className="mt-1 text-xl font-black">
          Retours
        </h1>

        <p className="mt-1 max-w-3xl text-[9px] leading-5 text-zinc-600">
          Workflow du retour physique. Aucun remboursement ni mouvement de stock automatique.
        </p>
      </header>


      {api.error ? (
        <p className="border border-red-500/20 bg-red-500/5 p-3 text-[9px] text-red-400">
          {api.error}
        </p>
      ) : null}


      <form
        onSubmit={
          (event) =>
            void submit(
              event,
            ).catch(
              () => undefined,
            )
        }
        className="border border-[#303238] bg-[#111214] p-4"
      >
        <h2 className="text-sm font-black">
          Enregistrer un retour
        </h2>

        <p className="mt-1 text-[8px] text-zinc-600">
          Seules les commandes livrées contenant des articles vendus sont proposées.
        </p>


        <div className="mt-4 grid gap-3">
          <select
            required
            value={orderId}
            onChange={
              (event) => {
                setOrderId(
                  event.target.value,
                );

                setQuantities({});
                setConditions({});
                setNotes({});
              }
            }
            className={fieldClass}
          >
            <option value="">
              Sélectionner une commande
            </option>

            {api.data
              .returnCandidateOrders
              .map(
                (order) => (
                  <option
                    key={
                      order.id
                    }
                    value={
                      order.id
                    }
                  >
                    {order.customerName}
                    {" · "}
                    {order.id.slice(
                      0,
                      8,
                    )}
                    {" · "}
                    {money(
                      order.total,
                      order.currency,
                    )}
                  </option>
                ),
              )}
          </select>


          <textarea
            required
            value={reason}
            onChange={
              (event) =>
                setReason(
                  event.target.value,
                )
            }
            placeholder="Motif du retour"
            className="min-h-20 border border-[#303238] bg-[#0d0f12] p-3 text-[10px] text-zinc-300 outline-none focus:border-[#3d92ff]"
          />
        </div>


        {selectedOrder ? (
          <div className="mt-4 space-y-2">
            {selectedOrder.lines.map(
              (line) => (
                <div
                  key={line.id}
                  className="grid gap-2 border border-[#292c31] p-3 md:grid-cols-[1fr_100px_150px_1fr]"
                >
                  <div>
                    <strong className="text-[10px] text-zinc-300">
                      {line.productTitle}
                    </strong>

                    <p className="mt-1 text-[8px] text-zinc-600">
                      Commandé :{" "}
                      {line.quantity}
                    </p>
                  </div>

                  <input
                    type="number"
                    min="0"
                    max={
                      line.quantity
                    }
                    step="1"
                    value={
                      quantities[
                        line.id
                      ] ??
                      ""
                    }
                    onChange={
                      (event) =>
                        setQuantities(
                          (current) => ({
                            ...current,

                            [line.id]:
                              event.target.value,
                          }),
                        )
                    }
                    placeholder="Qté"
                    className={fieldClass}
                  />

                  <select
                    value={
                      conditions[
                        line.id
                      ] ??
                      "good"
                    }
                    onChange={
                      (event) =>
                        setConditions(
                          (current) => ({
                            ...current,

                            [line.id]:
                              event.target.value as MarketplaceReturnItemCondition,
                          }),
                        )
                    }
                    className={fieldClass}
                  >
                    <option value="unopened">
                      Non ouvert
                    </option>

                    <option value="good">
                      Bon état
                    </option>

                    <option value="damaged">
                      Endommagé
                    </option>

                    <option value="defective">
                      Défectueux
                    </option>

                    <option value="other">
                      Autre
                    </option>
                  </select>

                  <input
                    value={
                      notes[
                        line.id
                      ] ??
                      ""
                    }
                    onChange={
                      (event) =>
                        setNotes(
                          (current) => ({
                            ...current,

                            [line.id]:
                              event.target.value,
                          }),
                        )
                    }
                    placeholder="Note"
                    className={fieldClass}
                  />
                </div>
              ),
            )}
          </div>
        ) : null}


        <div className="mt-4 text-right">
          <button
            type="submit"
            disabled={
              api.mutating
            }
            className={primaryButtonClass}
          >
            Enregistrer le retour
          </button>
        </div>
      </form>


      <div className="space-y-3">
        {api.data.returns.map(
          (item) => (
            <article
              key={item.id}
              className="border border-[#303238] bg-[#151619] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <strong className="text-sm">
                    Retour{" "}
                    {item.id.slice(
                      0,
                      8,
                    )}
                  </strong>

                  <p className="mt-1 text-[9px] text-zinc-600">
                    Commande{" "}
                    {item.orderId.slice(
                      0,
                      8,
                    )}
                    {" · "}
                    {item.customerName}
                  </p>
                </div>

                <span className="border border-[#303238] px-2 py-1 text-[8px] text-zinc-400">
                  {returnStatusLabel(
                    item.status,
                  )}
                </span>
              </div>


              <p className="mt-3 text-[9px] leading-5 text-zinc-400">
                {item.reason}
              </p>


              <div className="mt-3 space-y-1">
                {item.items.map(
                  (line) => (
                    <p
                      key={line.id}
                      className="text-[9px] text-zinc-600"
                    >
                      {line.productTitle}
                      {" · "}
                      {line.quantity}
                      {" · "}
                      {line.condition}
                    </p>
                  ),
                )}
              </div>


              {item.status ===
              "requested" ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={
                      api.mutating
                    }
                    onClick={
                      () =>
                        transition(
                          item.id,
                          "approved",
                        )
                    }
                    className={buttonClass}
                  >
                    Approuver
                  </button>

                  <button
                    type="button"
                    disabled={
                      api.mutating
                    }
                    onClick={
                      () =>
                        transition(
                          item.id,
                          "rejected",
                        )
                    }
                    className={`${buttonClass} text-red-400`}
                  >
                    Refuser
                  </button>

                  <button
                    type="button"
                    disabled={
                      api.mutating
                    }
                    onClick={
                      () =>
                        transition(
                          item.id,
                          "cancelled",
                        )
                    }
                    className={buttonClass}
                  >
                    Annuler
                  </button>
                </div>
              ) : null}


              {item.status ===
              "approved" ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={
                      api.mutating
                    }
                    onClick={
                      () =>
                        transition(
                          item.id,
                          "received",
                        )
                    }
                    className={primaryButtonClass}
                  >
                    Marquer reçu
                  </button>

                  <button
                    type="button"
                    disabled={
                      api.mutating
                    }
                    onClick={
                      () =>
                        transition(
                          item.id,
                          "cancelled",
                        )
                    }
                    className={buttonClass}
                  >
                    Annuler
                  </button>
                </div>
              ) : null}


              {item.status ===
              "received" ? (
                <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
                  <select
                    value={
                      resolutions[
                        item.id
                      ] ??
                      "refund"
                    }
                    onChange={
                      (event) =>
                        setResolutions(
                          (current) => ({
                            ...current,

                            [item.id]:
                              event.target.value as MarketplaceReturnResolution,
                          }),
                        )
                    }
                    className={fieldClass}
                  >
                    <option value="refund">
                      Remboursement à traiter
                    </option>

                    <option value="exchange">
                      Échange
                    </option>

                    <option value="store_credit">
                      Avoir
                    </option>

                    <option value="none">
                      Aucune compensation
                    </option>
                  </select>

                  <button
                    type="button"
                    disabled={
                      api.mutating
                    }
                    onClick={
                      () =>
                        transition(
                          item.id,
                          "resolved",
                          resolutions[
                            item.id
                          ] ??
                            "refund",
                        )
                    }
                    className={primaryButtonClass}
                  >
                    Résoudre
                  </button>
                </div>
              ) : null}


              {item.resolution ? (
                <p className="mt-3 text-[8px] text-amber-400">
                  Résolution :{" "}
                  {item.resolution}.
                  Aucun remboursement ou mouvement de stock automatique.
                </p>
              ) : null}
            </article>
          ),
        )}
      </div>


      {!api.data.returns.length ? (
        <p className="border border-dashed border-[#303238] p-8 text-center text-[10px] text-zinc-600">
          Aucun retour enregistré.
        </p>
      ) : null}
    </section>
  );
}


export function SellerDeliveryFeature({
  tab,
}: {
  tab?: string;
}) {
  if (
    !tab ||
    tab === "Expéditions"
  ) {
    return (
      <DeliveryFeature />
    );
  }

  if (
    tab === "Transporteurs"
  ) {
    return (
      <CarrierView />
    );
  }

  if (
    tab === "Zones"
  ) {
    return (
      <ZoneView />
    );
  }

  if (
    tab === "Retours"
  ) {
    return (
      <ReturnView />
    );
  }

  return (
    <DeliveryFeature />
  );
}
