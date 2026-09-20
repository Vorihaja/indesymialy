"use client";

import Link from "next/link";

import {
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  MapPin,
  PackageCheck,
  RefreshCw,
  Search,
  Truck,
  X,
} from "lucide-react";

import IndesyDualOrbitLoader from "@/components/loading/IndesyDualOrbitLoader";

import {
  DeliveryStatus,
} from "../components/DeliveryStatus";

import {
  useDeliveries,
} from "../hooks";

import type {
  DeliveryRecord,
} from "../types";

type MethodFilter =
  | "all"
  | DeliveryRecord["method"];

type StatusFilter =
  | "all"
  | DeliveryRecord["status"];

const fieldClass =
  "h-9 border border-[#303238] bg-[#0d0f12] px-3 text-[9px] text-zinc-200 outline-none placeholder:text-zinc-700 focus:border-[#3d92ff]";

const methodLabels:
  Record<
    DeliveryRecord["method"],
    string
  > = {
  delivery: "Livraison",
  pickup: "Retrait",
};

export function DeliveryFeature() {
  const data =
    useDeliveries();

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    method,
    setMethod,
  ] =
    useState<MethodFilter>(
      "all",
    );

  const [
    status,
    setStatus,
  ] =
    useState<StatusFilter>(
      "all",
    );

  const [
    editing,
    setEditing,
  ] =
    useState<DeliveryRecord | null>(
      null,
    );

  const [
    carrier,
    setCarrier,
  ] =
    useState("");

  const [
    trackingNumber,
    setTrackingNumber,
  ] =
    useState("");

  const [
    formError,
    setFormError,
  ] =
    useState<string | null>(
      null,
    );

  const filtered =
    useMemo(
      () => {
        const needle =
          search
            .trim()
            .toLocaleLowerCase(
              "fr-FR",
            );

        return data.deliveries
          .filter(
            (item) =>
              method === "all" ||
              item.method === method,
          )
          .filter(
            (item) =>
              status === "all" ||
              item.status === status,
          )
          .filter(
            (item) => {
              if (!needle) {
                return true;
              }

              return [
                item.orderId,
                item.address,
                item.carrier ?? "",
                item.trackingNumber ??
                  "",
              ]
                .join(" ")
                .toLocaleLowerCase(
                  "fr-FR",
                )
                .includes(
                  needle,
                );
            },
          );
      },
      [
        data.deliveries,
        method,
        search,
        status,
      ],
    );

  const deliveryCount =
    data.deliveries.filter(
      (item) =>
        item.method ===
        "delivery",
    ).length;

  const pickupCount =
    data.deliveries.filter(
      (item) =>
        item.method ===
        "pickup",
    ).length;

  const activeCount =
    data.deliveries.filter(
      (item) =>
        ![
          "completed",
          "failed",
        ].includes(
          item.status,
        ),
    ).length;

  function openTracking(
    item: DeliveryRecord,
  ) {
    setEditing(item);
    setCarrier(
      item.carrier ?? "",
    );
    setTrackingNumber(
      item.trackingNumber ??
        "",
    );
    setFormError(null);
  }

  function closeTracking() {
    setEditing(null);
    setFormError(null);
  }

  async function submit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!editing) {
      return;
    }

    try {
      setFormError(null);

      await data.updateMetadata(
        editing.id,
        carrier,
        trackingNumber,
      );

      closeTracking();
    }
    catch (cause) {
      setFormError(
        cause instanceof Error
          ? cause.message
          : "Mise à jour impossible.",
      );
    }
  }

  if (data.loading) {
    return (
      <div className="min-h-52">
        <IndesyDualOrbitLoader
          variant="data"
          label="Chargement des livraisons"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 text-zinc-100">
      <header className="flex flex-col gap-3 border-b border-[#303238] pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-[#3d92ff]">
            Logistique vendeur
          </p>

          <h1 className="mt-1 text-xl font-semibold tracking-tight text-white">
            Livraisons et retraits
          </h1>

          <p className="mt-1 max-w-2xl text-[9px] text-zinc-600">
            Les transitions commerciales restent gérées depuis Commandes. Ici, le vendeur gère les informations de transport et de suivi.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            void data
              .refresh()
              .catch(
                () => undefined,
              )
          }
          className="inline-flex h-8 items-center gap-1.5 border border-[#303238] bg-[#151619] px-3 text-[8px] font-semibold text-zinc-400 hover:border-[#3d92ff]/50 hover:text-white"
        >
          <RefreshCw
            size={11}
          />
          Actualiser
        </button>
      </header>

      {data.error ? (
        <div
          role="alert"
          className="border border-blue-500/30 bg-blue-500/5 px-3 py-2 text-[9px] text-blue-400"
        >
          {data.error}
        </div>
      ) : null}

      <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <article className="border border-[#303238] bg-[#111214] p-3">
          <p className="text-[7px] font-bold uppercase tracking-[0.1em] text-zinc-600">
            Total
          </p>
          <strong className="mt-2 block text-xl text-white">
            {data.deliveries.length}
          </strong>
        </article>

        <article className="border border-[#303238] bg-[#111214] p-3">
          <p className="text-[7px] font-bold uppercase tracking-[0.1em] text-zinc-600">
            Livraisons
          </p>
          <strong className="mt-2 block text-xl text-[#3d92ff]">
            {deliveryCount}
          </strong>
        </article>

        <article className="border border-[#303238] bg-[#111214] p-3">
          <p className="text-[7px] font-bold uppercase tracking-[0.1em] text-zinc-600">
            Retraits
          </p>
          <strong className="mt-2 block text-xl text-violet-400">
            {pickupCount}
          </strong>
        </article>

        <article className="border border-[#303238] bg-[#111214] p-3">
          <p className="text-[7px] font-bold uppercase tracking-[0.1em] text-zinc-600">
            En cours
          </p>
          <strong className="mt-2 block text-xl text-amber-400">
            {activeCount}
          </strong>
        </article>
      </section>

      <section className="border border-[#303238] bg-[#111214]">
        <div className="grid gap-2 border-b border-[#303238] p-3 lg:grid-cols-[1fr_180px_190px]">
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
              placeholder="Commande, adresse, transporteur ou suivi..."
              className={`${fieldClass} w-full pl-8`}
            />
          </label>

          <select
            value={method}
            onChange={
              (event) =>
                setMethod(
                  event.target
                    .value as MethodFilter,
                )
            }
            className={fieldClass}
          >
            <option value="all">
              Tous les modes
            </option>
            <option value="delivery">
              Livraison
            </option>
            <option value="pickup">
              Retrait
            </option>
          </select>

          <select
            value={status}
            onChange={
              (event) =>
                setStatus(
                  event.target
                    .value as StatusFilter,
                )
            }
            className={fieldClass}
          >
            <option value="all">
              Tous les statuts
            </option>
            <option value="pending">
              En attente
            </option>
            <option value="prepared">
              Préparée
            </option>
            <option value="in_transit">
              En transit
            </option>
            <option value="ready">
              Prête
            </option>
            <option value="completed">
              Terminée
            </option>
            <option value="failed">
              Échec / annulée
            </option>
          </select>
        </div>

        {filtered.length ? (
          <div className="divide-y divide-[#292c31]">
            {filtered.map(
              (item) => (
                <article
                  key={item.id}
                  className="grid gap-4 p-4 hover:bg-[#15171a] lg:grid-cols-[1fr_180px_180px_auto]"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      {item.method ===
                      "delivery" ? (
                        <Truck
                          size={13}
                          className="text-[#3d92ff]"
                        />
                      ) : (
                        <MapPin
                          size={13}
                          className="text-violet-400"
                        />
                      )}

                      <Link
                        href={`/dashboard/vendeur/orders/${item.orderId}`}
                        className="max-w-[420px] truncate text-[10px] font-semibold text-white hover:text-[#72b2ff]"
                      >
                        Commande {item.orderId}
                      </Link>
                    </div>

                    <p className="mt-2 text-[8px] leading-5 text-zinc-500">
                      {methodLabels[
                        item.method
                      ]}
                      {" · "}
                      {item.address ||
                        "Adresse non renseignée"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[7px] font-bold uppercase tracking-[0.08em] text-zinc-600">
                      Transporteur
                    </p>

                    <p className="mt-2 text-[9px] text-zinc-300">
                      {item.carrier ||
                        "Non renseigné"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[7px] font-bold uppercase tracking-[0.08em] text-zinc-600">
                      Suivi
                    </p>

                    <p className="mt-2 break-all text-[9px] text-zinc-300">
                      {item.trackingNumber ||
                        "Non renseigné"}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <DeliveryStatus
                      delivery={item}
                    />

                    {item.method ===
                    "delivery" ? (
                      <button
                        type="button"
                        disabled={
                          data.mutatingId ===
                          item.id
                        }
                        onClick={() =>
                          openTracking(
                            item,
                          )
                        }
                        className="h-8 border border-[#303238] bg-[#151619] px-3 text-[8px] font-semibold text-zinc-300 hover:border-[#3d92ff]/50 hover:text-white disabled:opacity-40"
                      >
                        Modifier le suivi
                      </button>
                    ) : null}
                  </div>
                </article>
              ),
            )}
          </div>
        ) : (
          <div className="grid min-h-52 place-items-center px-6 text-center">
            <div>
              <PackageCheck
                size={23}
                className="mx-auto text-zinc-700"
              />

              <p className="mt-3 text-[10px] font-semibold text-zinc-400">
                Aucune livraison correspondante
              </p>
            </div>
          </div>
        )}
      </section>

      {editing ? (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-black/70 p-4">
          <section className="w-full max-w-lg border border-[#303238] bg-[#101114] shadow-2xl">
            <header className="flex items-start justify-between border-b border-[#303238] p-4">
              <div>
                <p className="text-[7px] font-bold uppercase tracking-[0.12em] text-[#3d92ff]">
                  Suivi logistique
                </p>

                <h2 className="mt-1 text-[11px] font-semibold text-white">
                  Commande {editing.orderId}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeTracking}
                className="grid size-7 place-items-center text-zinc-500 hover:text-white"
              >
                <X
                  size={14}
                />
              </button>
            </header>

            <form
              onSubmit={submit}
              className="grid gap-4 p-4"
            >
              <label className="grid gap-1.5">
                <span className="text-[7px] font-bold uppercase tracking-[0.08em] text-zinc-600">
                  Transporteur
                </span>

                <input
                  value={carrier}
                  onChange={
                    (event) =>
                      setCarrier(
                        event.target.value,
                      )
                  }
                  placeholder="Ex. DHL, Colis Express, livraison interne..."
                  className={fieldClass}
                />
              </label>

              <label className="grid gap-1.5">
                <span className="text-[7px] font-bold uppercase tracking-[0.08em] text-zinc-600">
                  Numéro de suivi
                </span>

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
                  placeholder="Référence de suivi"
                  className={fieldClass}
                />
              </label>

              {formError ? (
                <p
                  role="alert"
                  className="border border-red-500/30 bg-red-500/5 px-3 py-2 text-[9px] text-red-400"
                >
                  {formError}
                </p>
              ) : null}

              <p className="text-[8px] leading-5 text-zinc-600">
                Cette action ne modifie pas le statut commercial de la commande.
              </p>

              <footer className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeTracking}
                  className="h-8 border border-[#303238] px-3 text-[8px] font-semibold text-zinc-500 hover:text-white"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={
                    data.mutatingId ===
                    editing.id
                  }
                  className="h-8 border border-[#ed1b2f] bg-[#ed1b2f] px-4 text-[8px] font-semibold text-white hover:bg-[#ff3045] disabled:opacity-40"
                >
                  {data.mutatingId ===
                  editing.id
                    ? "Enregistrement…"
                    : "Enregistrer le suivi"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
}
