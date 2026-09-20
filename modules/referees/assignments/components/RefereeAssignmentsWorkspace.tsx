"use client";

import Link from "next/link";
import {
  Check,
  ExternalLink,
  LoaderCircle,
  RefreshCw,
  X,
} from "lucide-react";

import IndesyDualOrbitLoader from "@/components/loading/IndesyDualOrbitLoader";

import {
  useRefereeAssignments,
} from "../hooks/useRefereeAssignments";
import type {
  RefereeAssignmentItem,
} from "../types";

function normalize(
  value: string,
) {
  return value
    .trim()
    .toLocaleLowerCase("fr-FR")
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    );
}

function statusLabel(
  value: string,
) {
  const status =
    normalize(value);

  if (status === "invited") {
    return "Invitée";
  }

  if (status === "assigned") {
    return "Affectée";
  }

  if (status === "confirmed") {
    return "Confirmée";
  }

  if (
    status === "declined" ||
    status === "rejected"
  ) {
    return "Refusée";
  }

  if (
    status === "cancelled" ||
    status === "canceled"
  ) {
    return "Annulée";
  }

  if (status === "completed") {
    return "Terminée";
  }

  return value || "À confirmer";
}

function officialFunctionLabel(
  value: string,
) {
  const role = normalize(value);

  if (
    role === "referee" ||
    role === "arbitre" ||
    role === "arbitre central"
  ) {
    return "Arbitre";
  }

  if (
    role === "judge" ||
    role === "juge"
  ) {
    return "Juge";
  }

  if (
    role === "timekeeper" ||
    role === "chronometreur" ||
    role === "chronometre"
  ) {
    return "Chronométreur";
  }

  if (
    role === "doctor" ||
    role === "medecin"
  ) {
    return "Médecin";
  }

  if (
    role === "supervisor" ||
    role === "superviseur"
  ) {
    return "Superviseur";
  }

  if (
    role === "announcer" ||
    role === "annonceur"
  ) {
    return "Annonceur";
  }

  return value;
}

function availabilityLabel(
  value: string | null,
) {
  const status =
    normalize(value ?? "");

  if (status === "available") {
    return "Disponible";
  }

  if (status === "unavailable") {
    return "Indisponible";
  }

  if (status === "tentative") {
    return "Provisoire";
  }

  return "À confirmer";
}

function statusClass(
  value: string,
) {
  const status =
    normalize(value);

  if (
    status === "confirmed" ||
    status === "completed"
  ) {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
  }

  if (
    status === "declined" ||
    status === "rejected" ||
    status === "cancelled" ||
    status === "canceled"
  ) {
    return "border-red-500/30 bg-red-500/10 text-red-400";
  }

  return "border-blue-500/30 bg-blue-500/10 text-blue-400";
}

function dateLabel(
  value: string | null,
) {
  if (!value) {
    return "À confirmer";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "fr-FR",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(date);
}

function isPending(
  item: RefereeAssignmentItem,
) {
  const status =
    normalize(item.status);

  return [
    "invited",
    "assigned",
    "pending",
  ].includes(status);
}

function filterItems(
  items:
    RefereeAssignmentItem[],
  tab: string,
) {
  const key =
    normalize(tab);

  if (
    key.includes(
      "confirme",
    )
  ) {
    return items.filter(
      (item) => {
        const status =
          normalize(
            item.status,
          );

        return (
          status ===
            "confirmed" ||
          status ===
            "completed"
        );
      },
    );
  }

  if (
    key.includes(
      "demande",
    )
  ) {
    return items.filter(
      isPending,
    );
  }

  if (
    key.includes(
      "remplacement",
    )
  ) {
    return items.filter(
      (item) => {
        const status =
          normalize(
            item.status,
          );

        return [
          "declined",
          "rejected",
          "cancelled",
          "canceled",
        ].includes(status);
      },
    );
  }

  const now =
    Date.now();

  return items.filter(
    (item) => {
      const status =
        normalize(
          item.status,
        );

      if (
        [
          "declined",
          "rejected",
          "cancelled",
          "canceled",
          "completed",
        ].includes(status)
      ) {
        return false;
      }

      if (!item.endsAt) {
        return true;
      }

      const end =
        Date.parse(
          item.endsAt,
        );

      return (
        Number.isNaN(end) ||
        end >= now
      );
    },
  );
}

export function RefereeAssignmentsWorkspace({
  tab,
}: {
  tab: string;
}) {
  const {
    items,
    loading,
    error,
    mutatingResponses,
    refresh,
    respond,
  } =
    useRefereeAssignments();

  if (loading) {
    return (
      <IndesyDualOrbitLoader
        variant="section"
        label="Chargement des désignations"
      />
    );
  }

  const displayed =
    filterItems(
      items,
      tab,
    );

  const confirmed =
    items.filter(
      (item) =>
        [
          "confirmed",
          "completed",
        ].includes(
          normalize(
            item.status,
          ),
        ),
    ).length;

  const pending =
    items.filter(
      isPending,
    ).length;

  const replacement =
    items.filter(
      (item) =>
        [
          "declined",
          "rejected",
          "cancelled",
          "canceled",
        ].includes(
          normalize(
            item.status,
          ),
        ),
    ).length;

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--erp-muted)]">
            Désignations officielles
          </p>

          <h1 className="mt-1 text-[18px] font-semibold text-[var(--erp-text)]">
            Mes désignations officielles
          </h1>

          <p className="mt-1 text-[11px] text-[var(--erp-text-secondary)]">
            Désignations événement et combats liées à votre compte Indesy.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            void refresh()
          }
          className="inline-flex h-9 items-center gap-2 border border-[var(--erp-border)] bg-[var(--erp-panel)] px-3 text-[10px] font-semibold text-[var(--erp-text-secondary)] hover:border-[var(--erp-border-strong)] hover:text-[var(--erp-text)]"
        >
          <RefreshCw
            size={13}
          />
          Actualiser
        </button>
      </header>

      {error && (
        <div className="border border-red-500/30 bg-red-500/10 px-4 py-3 text-[11px] text-red-400">
          {error}
        </div>
      )}

      <section className="grid border border-[var(--erp-border)] bg-[var(--erp-panel)] sm:grid-cols-2 xl:grid-cols-4">
        {[
          [
            "DÉSIGNATIONS",
            String(
              items.length,
            ),
            "liées à votre compte",
          ],
          [
            "CONFIRMÉES",
            String(
              confirmed,
            ),
            "affectations validées",
          ],
          [
            "À RÉPONDRE",
            String(
              pending,
            ),
            "décision requise",
          ],
          [
            "À REMPLACER",
            String(
              replacement,
            ),
            "refusées ou annulées",
          ],
        ].map(
          (
            [
              label,
              value,
              detail,
            ],
            index,
          ) => (
            <div
              key={label}
              className={`min-h-20 p-3 ${
                index < 3
                  ? "border-b border-[var(--erp-border)] sm:border-r xl:border-b-0"
                  : ""
              }`}
            >
              <p className="text-[9px] font-bold tracking-[0.08em] text-[var(--erp-muted)]">
                {label}
              </p>

              <strong className="mt-2 block text-[20px] font-semibold text-[var(--erp-text)]">
                {value}
              </strong>

              <span className="mt-1 block text-[9px] text-[var(--erp-text-secondary)]">
                {detail}
              </span>
            </div>
          ),
        )}
      </section>

      <section className="border border-[var(--erp-border)] bg-[var(--erp-panel)]">
        <div className="flex items-center justify-between border-b border-[var(--erp-border)] px-3 py-3">
          <div>
            <h2 className="text-[12px] font-semibold text-[var(--erp-text)]">
              Désignations · {tab}
            </h2>

            <p className="mt-1 text-[9px] text-[var(--erp-muted)]">
              Source réelle : autorités officielles Indesy
            </p>
          </div>

          <span className="text-[9px] text-[var(--erp-muted)]">
            {displayed.length} résultat(s)
          </span>
        </div>

        {displayed.length === 0 ? (
          <div className="grid min-h-48 place-items-center p-8 text-center">
            <div>
              <p className="text-[12px] font-semibold text-[var(--erp-text-secondary)]">
                Aucune désignation dans ce périmètre.
              </p>

              <p className="mt-1 text-[10px] text-[var(--erp-muted)]">
                Les affectations créées par les organisateurs apparaîtront automatiquement ici.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse">
              <thead>
                <tr className="border-b border-[var(--erp-border)] text-left text-[9px] uppercase tracking-[0.06em] text-[var(--erp-muted)]">
                  <th className="px-3 py-3 font-semibold">
                    Type
                  </th>

                  <th className="px-3 py-3 font-semibold">
                    Événement
                  </th>

                  <th className="px-3 py-3 font-semibold">
                    Affectation
                  </th>

                  <th className="px-3 py-3 font-semibold">
                    Date
                  </th>

                  <th className="px-3 py-3 font-semibold">
                    Lieu
                  </th>

                  <th className="px-3 py-3 font-semibold">
                    Disponibilité
                  </th>

                  <th className="px-3 py-3 font-semibold">
                    Statut
                  </th>

                  <th className="px-3 py-3 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {displayed.map(
                  (item) => {
                    const pendingResponse =
                      mutatingResponses[
                        item.key
                      ];

                    const busy =
                      Boolean(
                        pendingResponse,
                      );

                    const confirming =
                      pendingResponse ===
                      "confirmed";

                    const declining =
                      pendingResponse ===
                      "declined";

                    return (
                      <tr
                        key={
                          item.key
                        }
                        className="border-b border-[var(--erp-border)] text-[10px] text-[var(--erp-text-secondary)] last:border-b-0"
                      >
                        <td className="px-3 py-3">
                          <span className="font-semibold text-[var(--erp-text)]">
                            {item.source ===
                            "fight"
                              ? "Combat"
                              : "Événement"}
                          </span>
                        </td>

                        <td className="px-3 py-3">
                          <strong className="font-semibold text-[var(--erp-text)]">
                            {
                              item.eventTitle
                            }
                          </strong>
                        </td>

                        <td className="px-3 py-3">
                          <span className="block">
                            {
                              item.assignmentLabel
                            }
                          </span>

                          <span className="mt-1 block text-[9px] font-semibold text-[var(--erp-text)]">
                            Fonction : {officialFunctionLabel(
                              item.role,
                            )}
                          </span>
                        </td>

                        <td className="px-3 py-3">
                          {dateLabel(
                            item.startsAt,
                          )}
                        </td>

                        <td className="px-3 py-3">
                          {item.venue ??
                            "À confirmer"}
                        </td>

                        <td className="px-3 py-3">
                          {availabilityLabel(
                            item.availability,
                          )}
                        </td>

                        <td className="px-3 py-3">
                          <span
                            className={`inline-flex border px-2 py-1 text-[9px] font-semibold ${statusClass(
                              item.status,
                            )}`}
                          >
                            {statusLabel(
                              item.status,
                            )}
                          </span>
                        </td>

                        <td className="px-3 py-3">
                          <div className="flex justify-end gap-2">
                            {item.fightId && (
                              <Link
                                href={`/dashboard/officiel/fight-live/${item.fightId}`}
                                className="inline-flex h-8 items-center gap-1 border border-[var(--erp-border)] px-2 text-[9px] font-semibold text-[var(--erp-text-secondary)] hover:text-[var(--erp-text)]"
                              >
                                <ExternalLink
                                  size={11}
                                />
                                Combat
                              </Link>
                            )}

                            {isPending(
                              item,
                            ) && (
                              <>
                                <button
                                  type="button"
                                  disabled={
                                    busy
                                  }
                                  onClick={() =>
                                    void respond(
                                      item,
                                      "confirmed",
                                    )
                                  }
                                  className={`inline-flex h-8 min-w-[92px] items-center justify-center gap-1 border border-emerald-500/30 px-2 text-[9px] font-semibold text-emerald-400 disabled:cursor-not-allowed ${
                                    confirming
                                      ? "bg-emerald-500/15"
                                      : "disabled:opacity-40"
                                  }`}
                                >
                                  {confirming ? (
                                    <LoaderCircle
                                      size={11}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <Check
                                      size={11}
                                    />
                                  )}
                                  {confirming
                                    ? "Confirmation..."
                                    : "Confirmer"}
                                </button>

                                <button
                                  type="button"
                                  disabled={
                                    busy
                                  }
                                  onClick={() =>
                                    void respond(
                                      item,
                                      "declined",
                                    )
                                  }
                                  className={`inline-flex h-8 min-w-[72px] items-center justify-center gap-1 border border-red-500/30 px-2 text-[9px] font-semibold text-red-400 disabled:cursor-not-allowed ${
                                    declining
                                      ? "bg-red-500/15"
                                      : "disabled:opacity-40"
                                  }`}
                                >
                                  {declining ? (
                                    <LoaderCircle
                                      size={11}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <X
                                      size={11}
                                    />
                                  )}
                                  {declining
                                    ? "Refus..."
                                    : "Refuser"}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
