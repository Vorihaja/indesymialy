"use client";

import {
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  Archive,
  Plus,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";

import IndesyDualOrbitLoader from "@/components/loading/IndesyDualOrbitLoader";

import {
  useSellerCustomers,
} from "../hooks/useSellerCustomers";

import type {
  CustomerDisputeStatus,
} from "../types";

const box =
  "border border-[#303238] bg-[#141518]";

const input =
  "h-9 border border-[#343840] bg-[#0d0e10] px-2.5 text-[10px] text-zinc-100 outline-none focus:border-[#3983da]";

const button =
  "inline-flex h-8 items-center justify-center gap-1.5 border border-[#383c44] bg-[#191b1f] px-3 text-[9px] font-semibold text-zinc-200 hover:bg-[#202329] disabled:opacity-40";

const primary =
  "inline-flex h-8 items-center justify-center gap-1.5 border border-[#c72d3f] bg-[#c82335] px-3 text-[9px] font-semibold text-white hover:bg-[#dd3043] disabled:opacity-40";

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
    ).format(value) +
    " " +
    (
      currency === "MGA"
        ? "Ar"
        : currency
    )
  );
}

function date(
  value: string | null | undefined,
) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "fr-FR",
    {
      dateStyle: "medium",
    },
  ).format(
    new Date(value),
  );
}

function stateLabel(
  value: CustomerDisputeStatus,
) {
  return {
    open:
      "Ouvert",

    in_review:
      "En cours",

    resolved:
      "Résolu",

    closed:
      "Clôturé",
  }[value];
}

export function SellerCustomersFeature({
  tab,
}: {
  tab?: string;
}) {
  const customers =
    useSellerCustomers();

  const [
    query,
    setQuery,
  ] =
    useState("");

  const [
    selectedSegmentId,
    setSelectedSegmentId,
  ] =
    useState("");

  const active =
    tab === "Segments" ||
    tab === "Fidélité" ||
    tab === "Litiges"
      ? tab
      : "Tous";

  const data =
    customers.data;

  const filtered =
    useMemo(
      () =>
        (
          data?.customers ??
          []
        ).filter(
          (customer) =>
            (
              customer.name +
              " " +
              customer.email +
              " " +
              customer.phone
            )
              .toLocaleLowerCase(
                "fr",
              )
              .includes(
                query
                  .trim()
                  .toLocaleLowerCase(
                    "fr",
                  ),
              ),
        ),
      [
        data,
        query,
      ],
    );

  const activeSegments =
    (
      data?.segments ??
      []
    ).filter(
      (segment) =>
        segment.status ===
        "active",
    );

  const selectedSegment =
    activeSegments.find(
      (segment) =>
        segment.id ===
        selectedSegmentId,
    ) ??
    activeSegments[0] ??
    null;

  if (customers.loading) {
    return (
      <IndesyDualOrbitLoader
        variant="section"
        label="Chargement des clients"
      />
    );
  }

  if (!data) {
    return (
      <div className={`${box} p-5`}>
        <strong className="text-sm text-white">
          Clients indisponibles
        </strong>

        <p className="mt-2 text-xs text-red-300">
          {customers.error ??
            "Impossible de charger les données."}
        </p>

        <button
          type="button"
          className={`${button} mt-4`}
          onClick={() =>
            void customers.refresh()
          }
        >
          <RefreshCw size={12} />
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <header className={`${box} flex flex-wrap items-center justify-between gap-3 p-3`}>
        <div>
          <span className="text-[8px] font-bold uppercase tracking-[0.14em] text-zinc-600">
            CRM vendeur
          </span>

          <h2 className="mt-1 text-[15px] font-semibold text-white">
            Clients · {active}
          </h2>

          <p className="mt-1 text-[9px] text-zinc-500">
            Données issues des commandes Marketplace réelles.
          </p>
        </div>

        <label className="flex h-9 items-center gap-2 border border-[#343840] bg-[#0d0e10] px-3">
          <Search
            size={13}
            className="text-zinc-600"
          />

          <input
            value={query}
            onChange={(event) =>
              setQuery(
                event.target.value,
              )
            }
            placeholder="Rechercher un client"
            className="w-48 bg-transparent text-[10px] text-white outline-none"
          />
        </label>
      </header>

      <div className="grid grid-cols-2 gap-px border border-[#303238] bg-[#303238] md:grid-cols-4">
        {[
          [
            "CLIENTS",
            data.customers.length,
          ],
          [
            "RÉCURRENTS",
            data.customers.filter(
              (customer) =>
                customer.paidOrders >
                1,
            ).length,
          ],
          [
            "SEGMENTS",
            activeSegments.length,
          ],
          [
            "LITIGES OUVERTS",
            data.disputes.filter(
              (dispute) =>
                dispute.status ===
                  "open" ||
                dispute.status ===
                  "in_review",
            ).length,
          ],
        ].map(
          ([label, value]) => (
            <div
              key={String(label)}
              className="bg-[#151619] p-3"
            >
              <span className="text-[7px] font-bold tracking-[0.12em] text-zinc-600">
                {label}
              </span>

              <strong className="mt-1 block text-xl text-white">
                {value}
              </strong>
            </div>
          ),
        )}
      </div>

      {customers.error && (
        <div className="border border-red-900 bg-red-950/30 px-3 py-2 text-[9px] text-red-300">
          {customers.error}
        </div>
      )}

      {active === "Tous" && (
        <section className={box}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="bg-[#1a1c20] text-[7px] uppercase tracking-[0.1em] text-zinc-600">
                <tr>
                  {[
                    "Client",
                    "Commandes",
                    "Payées",
                    "Fidélité",
                    "Montants payés",
                    "Dernière commande",
                    "Segments",
                  ].map(
                    (heading) => (
                      <th
                        key={heading}
                        className="h-9 px-3"
                      >
                        {heading}
                      </th>
                    ),
                  )}
                </tr>
              </thead>

              <tbody>
                {filtered.map(
                  (customer) => (
                    <tr
                      key={customer.id}
                      className="border-t border-[#292c31] text-[9px] text-zinc-300"
                    >
                      <td className="px-3 py-2.5">
                        <strong className="block text-zinc-100">
                          {customer.name}
                        </strong>

                        <span className="text-[8px] text-zinc-600">
                          {customer.email}
                        </span>
                      </td>

                      <td className="px-3">
                        {customer.orders}
                      </td>

                      <td className="px-3">
                        {customer.paidOrders}
                      </td>

                      <td className="px-3">
                        {customer.loyaltyPoints} pts
                      </td>

                      <td className="px-3">
                        <div className="grid gap-0.5">
                          {customer.totalsByCurrency.map(
                            (total) => (
                              <span
                                key={total.currency}
                              >
                                {money(
                                  total.paidTotal,
                                  total.currency,
                                )}
                              </span>
                            ),
                          )}

                          {!customer.totalsByCurrency.length &&
                            "—"}
                        </div>
                      </td>

                      <td className="px-3">
                        {date(
                          customer.lastOrderAt,
                        )}
                      </td>

                      <td className="px-3">
                        {customer.segmentIds.length}
                      </td>
                    </tr>
                  ),
                )}

                {!filtered.length && (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-8 text-center text-[10px] text-zinc-600"
                    >
                      Aucun client.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {active === "Segments" && (
        <div className="grid gap-3 xl:grid-cols-[360px_1fr]">
          <section className={`${box} p-3`}>
            <strong className="text-[11px] text-white">
              Nouveau segment
            </strong>

            <form
              className="mt-3 grid gap-2"
              onSubmit={async (
                event: FormEvent<HTMLFormElement>,
              ) => {
                event.preventDefault();

                const form =
                  new FormData(
                    event.currentTarget,
                  );

                await customers.saveSegment({
                  name:
                    String(
                      form.get(
                        "name",
                      ) ?? "",
                    ),

                  description:
                    String(
                      form.get(
                        "description",
                      ) ?? "",
                    ),
                });

                event.currentTarget.reset();
              }}
            >
              <input
                name="name"
                required
                placeholder="Nom du segment"
                className={input}
              />

              <textarea
                name="description"
                rows={3}
                placeholder="Description"
                className="border border-[#343840] bg-[#0d0e10] p-2.5 text-[10px] text-zinc-100 outline-none focus:border-[#3983da]"
              />

              <button
                disabled={customers.mutating}
                className={primary}
              >
                <Plus size={12} />
                Créer
              </button>
            </form>

            <div className="mt-4 grid gap-1">
              {activeSegments.map(
                (segment) => (
                  <button
                    key={segment.id}
                    type="button"
                    onClick={() =>
                      setSelectedSegmentId(
                        segment.id,
                      )
                    }
                    className={`flex items-center justify-between border px-3 py-2 text-left text-[9px] ${
                      selectedSegment?.id ===
                      segment.id
                        ? "border-blue-700 bg-blue-950/30 text-blue-200"
                        : "border-[#303238] text-zinc-400"
                    }`}
                  >
                    <span>
                      {segment.name}
                    </span>

                    <span>
                      {segment.customerIds.length}
                    </span>
                  </button>
                ),
              )}
            </div>
          </section>

          <section className={box}>
            <header className="flex min-h-11 items-center justify-between border-b border-[#303238] px-3">
              <div>
                <strong className="text-[11px] text-white">
                  {selectedSegment?.name ??
                    "Sélectionnez un segment"}
                </strong>

                {selectedSegment && (
                  <p className="text-[8px] text-zinc-600">
                    {selectedSegment.description ??
                      "Sans description"}
                  </p>
                )}
              </div>

              {selectedSegment && (
                <button
                  type="button"
                  className={button}
                  disabled={customers.mutating}
                  onClick={() =>
                    void customers.setSegmentStatus(
                      selectedSegment.id,
                      "archived",
                    )
                  }
                >
                  <Archive size={11} />
                  Archiver
                </button>
              )}
            </header>

            {selectedSegment && (
              <div className="divide-y divide-[#292c31]">
                {data.customers.map(
                  (customer) => {
                    const checked =
                      selectedSegment.customerIds.includes(
                        customer.id,
                      );

                    return (
                      <label
                        key={customer.id}
                        className="flex min-h-10 items-center gap-3 px-3 text-[9px] text-zinc-300"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={customers.mutating}
                          onChange={() => {
                            const next =
                              checked
                                ? selectedSegment.customerIds.filter(
                                    (id) =>
                                      id !==
                                      customer.id,
                                  )
                                : [
                                    ...selectedSegment.customerIds,
                                    customer.id,
                                  ];

                            void customers.setSegmentMembers(
                              selectedSegment.id,
                              next,
                            );
                          }}
                        />

                        <span className="flex-1">
                          {customer.name}
                        </span>

                        <span className="text-zinc-600">
                          {customer.email}
                        </span>
                      </label>
                    );
                  },
                )}
              </div>
            )}
          </section>
        </div>
      )}

      {active === "Fidélité" && (
        <div className="grid gap-3 xl:grid-cols-[380px_1fr]">
          <section className={`${box} p-3`}>
            <strong className="text-[11px] text-white">
              Ajustement de points
            </strong>

            <p className="mt-1 text-[8px] text-zinc-600">
              Ledger append-only. Aucun gain automatique au checkout pour l’instant.
            </p>

            <form
              className="mt-3 grid gap-2"
              onSubmit={async (
                event: FormEvent<HTMLFormElement>,
              ) => {
                event.preventDefault();

                const form =
                  new FormData(
                    event.currentTarget,
                  );

                await customers.adjustLoyalty({
                  customerId:
                    String(
                      form.get(
                        "customer",
                      ),
                    ),

                  points:
                    Number(
                      form.get(
                        "points",
                      ),
                    ),

                  reason:
                    String(
                      form.get(
                        "reason",
                      ),
                    ),
                });

                event.currentTarget.reset();
              }}
            >
              <select
                name="customer"
                required
                className={input}
              >
                <option value="">
                  Client…
                </option>

                {data.customers.map(
                  (customer) => (
                    <option
                      key={customer.id}
                      value={customer.id}
                    >
                      {customer.name}
                    </option>
                  ),
                )}
              </select>

              <input
                name="points"
                type="number"
                required
                step="1"
                placeholder="+100 ou -50"
                className={input}
              />

              <input
                name="reason"
                required
                placeholder="Motif"
                className={input}
              />

              <button
                className={primary}
                disabled={customers.mutating}
              >
                Enregistrer
              </button>
            </form>
          </section>

          <section className={box}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left">
                <thead className="bg-[#1a1c20] text-[7px] uppercase text-zinc-600">
                  <tr>
                    <th className="h-9 px-3">
                      Client
                    </th>

                    <th className="px-3">
                      Solde
                    </th>

                    <th className="px-3">
                      Dernier mouvement
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {data.customers.map(
                    (customer) => {
                      const last =
                        data.loyalty.find(
                          (entry) =>
                            entry.customerId ===
                            customer.id,
                        );

                      return (
                        <tr
                          key={customer.id}
                          className="border-t border-[#292c31] text-[9px] text-zinc-300"
                        >
                          <td className="px-3 py-2.5">
                            {customer.name}
                          </td>

                          <td className="px-3 font-semibold text-white">
                            {customer.loyaltyPoints} pts
                          </td>

                          <td className="px-3">
                            {last
                              ? `${last.points > 0 ? "+" : ""}${last.points} · ${last.reason}`
                              : "—"}
                          </td>
                        </tr>
                      );
                    },
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {active === "Litiges" && (
        <div className="grid gap-3 xl:grid-cols-[390px_1fr]">
          <section className={`${box} p-3`}>
            <strong className="text-[11px] text-white">
              Ouvrir un litige CRM
            </strong>

            <p className="mt-1 text-[8px] text-zinc-600">
              Aucun remboursement ni changement de commande n’est déclenché automatiquement.
            </p>

            <form
              className="mt-3 grid gap-2"
              onSubmit={async (
                event: FormEvent<HTMLFormElement>,
              ) => {
                event.preventDefault();

                const form =
                  new FormData(
                    event.currentTarget,
                  );

                const customerId =
                  String(
                    form.get(
                      "customer",
                    ),
                  );

                const orderId =
                  String(
                    form.get(
                      "order",
                    ) ?? "",
                  );

                await customers.saveDispute({
                  customerId,

                  orderId:
                    orderId ||
                    null,

                  subject:
                    String(
                      form.get(
                        "subject",
                      ),
                    ),

                  description:
                    String(
                      form.get(
                        "description",
                      ) ?? "",
                    ),

                  status:
                    "open",
                });

                event.currentTarget.reset();
              }}
            >
              <select
                name="customer"
                required
                className={input}
              >
                <option value="">
                  Client…
                </option>

                {data.customers.map(
                  (customer) => (
                    <option
                      key={customer.id}
                      value={customer.id}
                    >
                      {customer.name}
                    </option>
                  ),
                )}
              </select>

              <select
                name="order"
                className={input}
              >
                <option value="">
                  Commande optionnelle…
                </option>

                {data.recentOrders.map(
                  (order) => (
                    <option
                      key={order.id}
                      value={order.id}
                    >
                      {order.id.slice(
                        0,
                        8,
                      )} · {money(
                        order.total,
                        order.currency,
                      )}
                    </option>
                  ),
                )}
              </select>

              <input
                name="subject"
                required
                placeholder="Objet"
                className={input}
              />

              <textarea
                name="description"
                rows={4}
                placeholder="Description"
                className="border border-[#343840] bg-[#0d0e10] p-2.5 text-[10px] text-zinc-100 outline-none focus:border-[#3983da]"
              />

              <button
                className={primary}
                disabled={customers.mutating}
              >
                Ouvrir
              </button>
            </form>
          </section>

          <section className={box}>
            <div className="divide-y divide-[#292c31]">
              {data.disputes.map(
                (dispute) => {
                  const customer =
                    data.customers.find(
                      (item) =>
                        item.id ===
                        dispute.customerId,
                    );

                  return (
                    <article
                      key={dispute.id}
                      className="p-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <strong className="text-[10px] text-white">
                            {dispute.subject}
                          </strong>

                          <p className="mt-1 text-[8px] text-zinc-500">
                            {customer?.name ??
                              dispute.customerId}
                            {" · "}
                            {date(
                              dispute.createdAt,
                            )}
                          </p>

                          {dispute.description && (
                            <p className="mt-2 text-[9px] text-zinc-400">
                              {dispute.description}
                            </p>
                          )}
                        </div>

                        <span className="border border-[#3a3e46] px-2 py-1 text-[8px] text-zinc-300">
                          {stateLabel(
                            dispute.status,
                          )}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {(
                          [
                            "open",
                            "in_review",
                            "resolved",
                            "closed",
                          ] as CustomerDisputeStatus[]
                        ).map(
                          (status) => (
                            <button
                              key={status}
                              type="button"
                              className={button}
                              disabled={
                                customers.mutating ||
                                dispute.status ===
                                  status
                              }
                              onClick={() =>
                                void customers.saveDispute({
                                  id:
                                    dispute.id,

                                  customerId:
                                    dispute.customerId,

                                  orderId:
                                    dispute.orderId,

                                  subject:
                                    dispute.subject,

                                  description:
                                    dispute.description,

                                  status,

                                  resolution:
                                    dispute.resolution,
                                })
                              }
                            >
                              {stateLabel(
                                status,
                              )}
                            </button>
                          ),
                        )}
                      </div>
                    </article>
                  );
                },
              )}

              {!data.disputes.length && (
                <div className="p-8 text-center text-[10px] text-zinc-600">
                  Aucun litige.
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      <footer className="flex items-center gap-2 text-[8px] text-zinc-600">
        <Users size={11} />
        L’identité du client provient de ses commandes Marketplace historiques.
      </footer>
    </div>
  );
}