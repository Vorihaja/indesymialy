"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  useOrganizationPersonnel,
} from "../hooks/useOrganizationPersonnel";

type PersonnelWorkspaceProps = {
  canonicalRole?: string;
  organizationName?: string;
  roleLabel?: string;
};

function formatDate(
  value: string | null,
) {
  if (!value) {
    return "—";
  }

  const parsed =
    new Date(
      value,
    );

  if (
    Number.isNaN(
      parsed.getTime(),
    )
  ) {
    return value;
  }

  return parsed.toLocaleDateString(
    "fr-FR",
  );
}

export function PersonnelWorkspace({
  canonicalRole,
  organizationName,
  roleLabel,
}: PersonnelWorkspaceProps) {
  const {
    snapshot,
    loading,
    error,
    refresh,
  } =
    useOrganizationPersonnel();

  const [
    search,
    setSearch,
  ] =
    useState(
      "",
    );

  const effectiveRole =
    canonicalRole ??
    roleLabel ??
    "organisation";

  const effectiveOrganizationName =
    snapshot?.organizationName ??
    organizationName ??
    "Personnel";

  const filteredMembers =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLocaleLowerCase(
              "fr",
            );

        const members =
          snapshot?.members ??
          [];

        if (!query) {
          return members;
        }

        return members.filter(
          (member) =>
            [
              member.fullName,
              member.email,
              member.role,
              member.status,
            ]
              .join(
                " ",
              )
              .toLocaleLowerCase(
                "fr",
              )
              .includes(
                query,
              ),
        );
      },
      [
        search,
        snapshot?.members,
      ],
    );

  const activeCount =
    snapshot?.members.filter(
      (member) =>
        member.status ===
        "active",
    ).length ??
    0;

  if (loading) {
    return (
      <section
        aria-busy="true"
        className="rounded-2xl border border-zinc-800 p-6"
      >
        <p className="text-sm text-zinc-500">
          Chargement des données Personnel…
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <header className="rounded-2xl border border-zinc-800 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
              Personnel · {effectiveRole}
            </p>

            <h2 className="mt-1 text-xl font-semibold">
              {effectiveOrganizationName}
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              {"Membres réels de l'organisation active."}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void refresh()
            }
            className="rounded-xl border border-zinc-700 px-4 py-2 text-sm"
          >
            Actualiser
          </button>
        </div>
      </header>

      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-red-900/60 p-4 text-sm text-red-400"
        >
          {error}
        </div>
      ) : null}

      {!snapshot?.organizationId ? (
        <div className="rounded-2xl border border-zinc-800 p-6 text-sm text-zinc-500">
          {"Aucune organisation accessible n'est actuellement sélectionnée."}
        </div>
      ) : null}

      {snapshot?.organizationId ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-zinc-800 p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                Membres
              </p>

              <p className="mt-2 text-2xl font-semibold">
                {snapshot.members.length}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                Actifs
              </p>

              <p className="mt-2 text-2xl font-semibold">
                {activeCount}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 p-4">
            <label className="block">
              <span className="sr-only">
                Rechercher un membre
              </span>

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Rechercher par nom, email, rôle ou statut"
                className="w-full rounded-xl border border-zinc-700 bg-transparent px-4 py-2.5 text-sm outline-none"
              />
            </label>
          </div>

          <div className="overflow-hidden rounded-2xl border border-zinc-800">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="border-b border-zinc-800">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">
                      Personne
                    </th>

                    <th className="px-4 py-3 text-left font-medium">
                      Rôle
                    </th>

                    <th className="px-4 py-3 text-left font-medium">
                      Statut
                    </th>

                    <th className="px-4 py-3 text-left font-medium">
                      Depuis
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredMembers.map(
                    (member) => (
                      <tr
                        key={member.id}
                        className="border-b border-zinc-900 last:border-0"
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium">
                            {member.fullName}
                          </div>

                          <div className="text-xs text-zinc-500">
                            {member.email || "—"}
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          {member.role || "—"}
                        </td>

                        <td className="px-4 py-3">
                          {member.status || "—"}
                        </td>

                        <td className="px-4 py-3 text-zinc-500">
                          {formatDate(
                            member.joinedAt,
                          )}
                        </td>
                      </tr>
                    ),
                  )}

                  {filteredMembers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-10 text-center text-zinc-500"
                      >
                        Aucun membre correspondant.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-xs text-zinc-500">
            {"Données réelles en lecture. Les mutations restent désactivées tant que leur autorité n'est pas certifiée."}
          </p>
        </>
      ) : null}
    </section>
  );
}
