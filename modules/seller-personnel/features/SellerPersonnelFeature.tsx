"use client";

import {
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  Archive,
  Check,
  FilePlus2,
  MailPlus,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";

import IndesyDualOrbitLoader from "@/components/loading/IndesyDualOrbitLoader";

import {
  useSellerPersonnel,
} from "../hooks/useSellerPersonnel";

import type {
  SellerPersonnelMember,
} from "../types";

const tabs = [
  "Annuaire",
  "Invitations",
  "Rôles & droits",
  "Affectations",
  "Présences",
  "Congés",
  "Documents",
  "Rémunérations",
] as const;

type Tab =
  typeof tabs[number];

const box =
  "border border-[#303238] bg-[#141518]";

const input =
  "h-9 w-full border border-[#343840] bg-[#0d0e10] px-2.5 text-[10px] text-zinc-100 outline-none focus:border-[#3983da]";

const button =
  "inline-flex h-8 items-center justify-center gap-1.5 border border-[#383c44] bg-[#191b1f] px-3 text-[9px] font-semibold text-zinc-200 hover:bg-[#202329] disabled:opacity-40";

const primary =
  "inline-flex h-8 items-center justify-center gap-1.5 border border-[#c72d3f] bg-[#c82335] px-3 text-[9px] font-semibold text-white hover:bg-[#dd3043] disabled:opacity-40";

function memberName(
  members: SellerPersonnelMember[],
  profileId: string,
) {
  return (
    members.find(
      (member) =>
        member.profileId ===
        profileId,
    )?.name ??
    profileId
  );
}

function dateTime(
  value: string | null,
) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "fr-FR",
    {
      dateStyle:
        "short",

      timeStyle:
        "short",
    },
  ).format(
    new Date(value),
  );
}

function money(
  amount: number | null,
  currency: string,
) {
  if (
    amount === null ||
    amount === undefined
  ) {
    return "Non défini";
  }

  return (
    new Intl.NumberFormat(
      "fr-FR",
    ).format(
      amount,
    ) +
    " " +
    (
      currency === "MGA"
        ? "Ar"
        : currency
    )
  );
}

export function SellerPersonnelFeature() {
  const personnel =
    useSellerPersonnel();

  const [
    active,
    setActive,
  ] =
    useState<Tab>(
      "Annuaire",
    );

  const [
    query,
    setQuery,
  ] =
    useState("");

  const [
    selectedMember,
    setSelectedMember,
  ] =
    useState<SellerPersonnelMember | null>(
      null,
    );

  const today =
    useMemo(
      () =>
        new Date()
          .toISOString()
          .slice(
            0,
            10,
          ),
      [],
    );

  if (personnel.loading) {
    return (
      <IndesyDualOrbitLoader
        variant="section"
        label="Chargement du personnel"
      />
    );
  }

  const data =
    personnel.data;

  if (!data) {
    return (
      <div className={`${box} p-5`}>
        <strong className="text-sm text-white">
          Personnel indisponible
        </strong>

        <p className="mt-2 text-xs text-red-300">
          {personnel.error ??
            "Impossible de charger les données."}
        </p>

        <button
          type="button"
          className={`${button} mt-4`}
          onClick={() =>
            void personnel.refresh()
          }
        >
          <RefreshCw size={12} />
          Réessayer
        </button>
      </div>
    );
  }

  const visibleMembers =
    data.members.filter(
      (member) =>
        (
          member.name +
          " " +
          member.email +
          " " +
          (
            member.department ??
            ""
          )
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
    );

  const todayAttendance =
    data.attendance.filter(
      (entry) =>
        entry.workDate ===
        today,
    );

  return (
    <div className="grid gap-3">
      <header className={`${box} flex flex-wrap items-center justify-between gap-3 p-3`}>
        <div>
          <span className="text-[8px] font-bold uppercase tracking-[0.14em] text-zinc-600">
            Organisation vendeuse
          </span>

          <h2 className="mt-1 text-[15px] font-semibold text-white">
            {data.organizationName} · Personnel
          </h2>

          <p className="mt-1 text-[9px] text-zinc-500">
            L’appartenance et les accès restent pilotés par organization_members.
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
            placeholder="Rechercher"
            className="w-40 bg-transparent text-[10px] text-white outline-none"
          />
        </label>
      </header>

      <div className="grid grid-cols-2 gap-px border border-[#303238] bg-[#303238] md:grid-cols-4">
        {[
          [
            "EFFECTIF",
            data.members.length,
          ],
          [
            "ACTIFS",
            data.members.filter(
              (member) =>
                member.accessStatus ===
                "active",
            ).length,
          ],
          [
            "INVITATIONS",
            data.invitations.filter(
              (invitation) =>
                invitation.status ===
                "pending",
            ).length,
          ],
          [
            "CONGÉS À TRAITER",
            data.leaves.filter(
              (leave) =>
                leave.status ===
                "pending",
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

      <nav className="flex overflow-x-auto border border-[#303238] bg-[#111215]">
        {tabs.map(
          (tab) => (
            <button
              key={tab}
              type="button"
              onClick={() =>
                setActive(
                  tab,
                )
              }
              className={`h-9 flex-none border-b-2 px-3 text-[9px] font-semibold ${
                active === tab
                  ? "border-[#ff1638] text-white"
                  : "border-transparent text-zinc-500"
              }`}
            >
              {tab}
            </button>
          ),
        )}
      </nav>

      {personnel.error && (
        <div className="border border-red-900 bg-red-950/30 px-3 py-2 text-[9px] text-red-300">
          {personnel.error}
        </div>
      )}

      {active === "Annuaire" && (
        <div className="grid gap-3 xl:grid-cols-[1fr_360px]">
          <section className={box}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead className="bg-[#1a1c20] text-[7px] uppercase text-zinc-600">
                  <tr>
                    {[
                      "Collaborateur",
                      "Rôle organisation",
                      "Service",
                      "Contrat",
                      "Accès",
                      "",
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
                  {visibleMembers.map(
                    (member) => (
                      <tr
                        key={member.profileId}
                        className="border-t border-[#292c31] text-[9px] text-zinc-300"
                      >
                        <td className="px-3 py-2.5">
                          <strong className="block text-white">
                            {member.name}
                          </strong>

                          <span className="text-[8px] text-zinc-600">
                            {member.email}
                          </span>
                        </td>

                        <td className="px-3">
                          {member.membershipRole ??
                            "—"}
                        </td>

                        <td className="px-3">
                          {member.department ??
                            "—"}
                        </td>

                        <td className="px-3">
                          {member.contractType ??
                            "—"}
                        </td>

                        <td className="px-3">
                          {member.accessStatus}
                        </td>

                        <td className="px-3">
                          <button
                            type="button"
                            className={button}
                            onClick={() =>
                              setSelectedMember(
                                member,
                              )
                            }
                          >
                            Gérer
                          </button>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className={`${box} p-3`}>
            <strong className="text-[11px] text-white">
              Fiche collaborateur
            </strong>

            {!selectedMember && (
              <p className="mt-4 text-[9px] text-zinc-600">
                Sélectionnez un membre.
              </p>
            )}

            {selectedMember && (
              <form
                key={selectedMember.profileId}
                className="mt-3 grid gap-2"
                onSubmit={async (
                  event: FormEvent<HTMLFormElement>,
                ) => {
                  event.preventDefault();

                  const form =
                    new FormData(
                      event.currentTarget,
                    );

                  await personnel.saveProfile({
                    profileId:
                      selectedMember.profileId,

                    department:
                      String(
                        form.get(
                          "department",
                        ) ?? "",
                      ),

                    contractType:
                      String(
                        form.get(
                          "contract",
                        ) ?? "",
                      ),

                    location:
                      String(
                        form.get(
                          "location",
                        ) ?? "",
                      ),

                    availability:
                      String(
                        form.get(
                          "availability",
                        ) ?? "",
                      ),

                    monthlyCompensation:
                      form.get(
                        "compensation",
                      ) === ""
                        ? null
                        : Number(
                            form.get(
                              "compensation",
                            ),
                          ),

                    currency:
                      String(
                        form.get(
                          "currency",
                        ) ??
                          "MGA",
                      ),

                    employmentStatus:
                      String(
                        form.get(
                          "employmentStatus",
                        ) ??
                          "active",
                      ) as
                        | "active"
                        | "on_leave"
                        | "inactive",
                  });
                }}
              >
                <div className="border border-[#303238] bg-[#101114] p-2">
                  <strong className="text-[10px] text-white">
                    {selectedMember.name}
                  </strong>

                  <p className="text-[8px] text-zinc-600">
                    {selectedMember.email}
                  </p>
                </div>

                <input
                  name="department"
                  defaultValue={
                    selectedMember.department ??
                    ""
                  }
                  placeholder="Service"
                  className={input}
                />

                <input
                  name="contract"
                  defaultValue={
                    selectedMember.contractType ??
                    ""
                  }
                  placeholder="Contrat"
                  className={input}
                />

                <input
                  name="location"
                  defaultValue={
                    selectedMember.location ??
                    ""
                  }
                  placeholder="Lieu"
                  className={input}
                />

                <input
                  name="availability"
                  defaultValue={
                    selectedMember.availability ??
                    ""
                  }
                  placeholder="Disponibilité"
                  className={input}
                />

                <input
                  name="compensation"
                  type="number"
                  min="0"
                  step="1000"
                  defaultValue={
                    selectedMember.monthlyCompensation ??
                    ""
                  }
                  placeholder="Rémunération mensuelle"
                  className={input}
                />

                <input
                  name="currency"
                  defaultValue={
                    selectedMember.currency
                  }
                  maxLength={3}
                  className={input}
                />

                <select
                  name="employmentStatus"
                  defaultValue={
                    selectedMember.employmentStatus
                  }
                  className={input}
                >
                  <option value="active">
                    Actif
                  </option>

                  <option value="on_leave">
                    En congé
                  </option>

                  <option value="inactive">
                    Inactif
                  </option>
                </select>

                <button
                  className={primary}
                  disabled={personnel.mutating}
                >
                  Enregistrer la fiche
                </button>

                {selectedMember.membershipRole !==
                  "owner" && (
                  <button
                    type="button"
                    className={button}
                    disabled={personnel.mutating}
                    onClick={() =>
                      void personnel.setAccess(
                        selectedMember.profileId,
                        selectedMember.accessStatus !==
                          "active",
                      )
                    }
                  >
                    {selectedMember.accessStatus ===
                    "active"
                      ? "Suspendre l’accès"
                      : "Réactiver l’accès"}
                  </button>
                )}
              </form>
            )}
          </section>
        </div>
      )}

      {active === "Invitations" && (
        <div className="grid gap-3 xl:grid-cols-[360px_1fr]">
          <section className={`${box} p-3`}>
            <strong className="text-[11px] text-white">
              Inviter une personne
            </strong>

            <p className="mt-1 text-[8px] text-zinc-600">
              Utilisez son identifiant public ou son e-mail.
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

                await personnel.invite(
                  String(
                    form.get(
                      "identifier",
                    ),
                  ),
                  String(
                    form.get(
                      "role",
                    ) ??
                      "seller",
                  ),
                );

                event.currentTarget.reset();
              }}
            >
              <input
                name="identifier"
                required
                placeholder="identifiant ou email"
                className={input}
              />

              <select
                name="role"
                defaultValue="seller"
                className={input}
              >
                <option value="seller">
                  Vendeur
                </option>

                <option value="manager">
                  Manager
                </option>

                <option value="admin">
                  Administrateur
                </option>
              </select>

              <button
                className={primary}
                disabled={personnel.mutating}
              >
                <MailPlus size={12} />
                Créer l’invitation
              </button>
            </form>
          </section>

          <section className={box}>
            <div className="divide-y divide-[#292c31]">
              {data.invitations.map(
                (invitation) => (
                  <div
                    key={invitation.id}
                    className="flex flex-wrap items-center justify-between gap-3 p-3"
                  >
                    <div>
                      <strong className="text-[10px] text-white">
                        {invitation.target}
                      </strong>

                      <p className="mt-1 text-[8px] text-zinc-600">
                        {invitation.memberRole}
                        {" · "}
                        {invitation.status}
                        {" · expire "}
                        {dateTime(
                          invitation.expiresAt,
                        )}
                      </p>
                    </div>

                    {invitation.status ===
                      "pending" && (
                      <button
                        type="button"
                        className={button}
                        disabled={personnel.mutating}
                        onClick={() =>
                          void personnel.revokeInvitation(
                            invitation.id,
                          )
                        }
                      >
                        Révoquer
                      </button>
                    )}
                  </div>
                ),
              )}

              {!data.invitations.length && (
                <div className="p-8 text-center text-[10px] text-zinc-600">
                  Aucune invitation.
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {active === "Rôles & droits" && (
        <div className="grid gap-3 xl:grid-cols-[360px_1fr]">
          <section className={`${box} p-3`}>
            <strong className="text-[11px] text-white">
              Nouveau rôle interne
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

                const permissions =
                  String(
                    form.get(
                      "permissions",
                    ) ?? "",
                  )
                    .split(",")
                    .map(
                      (value) =>
                        value.trim(),
                    )
                    .filter(Boolean);

                await personnel.saveInternalRole(
                  null,
                  String(
                    form.get(
                      "label",
                    ),
                  ),
                  permissions,
                  true,
                );

                event.currentTarget.reset();
              }}
            >
              <input
                name="label"
                required
                placeholder="Nom du rôle"
                className={input}
              />

              <input
                name="permissions"
                placeholder="read,create,update,invite"
                className={input}
              />

              <button
                className={primary}
                disabled={personnel.mutating}
              >
                <ShieldCheck size={12} />
                Créer
              </button>
            </form>
          </section>

          <section className={box}>
            <div className="divide-y divide-[#292c31]">
              {data.internalRoles.map(
                (role) => {
                  const assigned =
                    data.roleAssignments
                      .filter(
                        (assignment) =>
                          assignment.roleId ===
                          role.id,
                      )
                      .map(
                        (assignment) =>
                          assignment.profileId,
                      );

                  return (
                    <article
                      key={role.id}
                      className="p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <strong className="text-[10px] text-white">
                            {role.label}
                          </strong>

                          <p className="mt-1 text-[8px] text-zinc-600">
                            {role.permissions.join(
                              " · ",
                            ) || "Aucune permission"}
                          </p>
                        </div>

                        <span className="text-[8px] text-zinc-500">
                          {assigned.length} membre(s)
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {data.members.map(
                          (member) => {
                            const checked =
                              assigned.includes(
                                member.profileId,
                              );

                            return (
                              <label
                                key={member.profileId}
                                className="flex items-center gap-1 border border-[#343840] px-2 py-1 text-[8px] text-zinc-300"
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  disabled={personnel.mutating}
                                  onChange={() => {
                                    const next =
                                      checked
                                        ? assigned.filter(
                                            (id) =>
                                              id !==
                                              member.profileId,
                                          )
                                        : [
                                            ...assigned,
                                            member.profileId,
                                          ];

                                    void personnel.setInternalRoleMembers(
                                      role.id,
                                      next,
                                    );
                                  }}
                                />

                                {member.name}
                              </label>
                            );
                          },
                        )}
                      </div>
                    </article>
                  );
                },
              )}
            </div>
          </section>
        </div>
      )}

      {active === "Affectations" && (
        <div className="grid gap-3 xl:grid-cols-[380px_1fr]">
          <section className={`${box} p-3`}>
            <strong className="text-[11px] text-white">
              Nouvelle mission
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

                const starts =
                  String(
                    form.get(
                      "starts",
                    ) ?? "",
                  );

                const ends =
                  String(
                    form.get(
                      "ends",
                    ) ?? "",
                  );

                await personnel.saveAssignment({
                  profileId:
                    String(
                      form.get(
                        "member",
                      ),
                    ),

                  mission:
                    String(
                      form.get(
                        "mission",
                      ),
                    ),

                  scope:
                    String(
                      form.get(
                        "scope",
                      ) ?? "",
                    ),

                  startsAt:
                    starts
                      ? new Date(
                          starts,
                        ).toISOString()
                      : null,

                  endsAt:
                    ends
                      ? new Date(
                          ends,
                        ).toISOString()
                      : null,
                });

                event.currentTarget.reset();
              }}
            >
              <select
                name="member"
                required
                className={input}
              >
                <option value="">
                  Collaborateur…
                </option>

                {data.members.map(
                  (member) => (
                    <option
                      key={member.profileId}
                      value={member.profileId}
                    >
                      {member.name}
                    </option>
                  ),
                )}
              </select>

              <input
                name="mission"
                required
                placeholder="Mission"
                className={input}
              />

              <input
                name="scope"
                placeholder="Périmètre"
                className={input}
              />

              <input
                name="starts"
                type="datetime-local"
                className={input}
              />

              <input
                name="ends"
                type="datetime-local"
                className={input}
              />

              <button
                className={primary}
                disabled={personnel.mutating}
              >
                <Plus size={12} />
                Planifier
              </button>
            </form>
          </section>

          <section className={box}>
            <div className="divide-y divide-[#292c31]">
              {data.assignments.map(
                (assignment) => (
                  <article
                    key={assignment.id}
                    className="p-3"
                  >
                    <strong className="text-[10px] text-white">
                      {assignment.mission}
                    </strong>

                    <p className="mt-1 text-[8px] text-zinc-500">
                      {memberName(
                        data.members,
                        assignment.profileId,
                      )}
                      {" · "}
                      {assignment.scope ??
                        "Sans périmètre"}
                    </p>

                    <p className="mt-1 text-[8px] text-zinc-600">
                      {dateTime(
                        assignment.startsAt,
                      )}
                      {" → "}
                      {dateTime(
                        assignment.endsAt,
                      )}
                      {" · "}
                      {assignment.status}
                    </p>

                    <div className="mt-2 flex gap-2">
                      {assignment.status !==
                        "completed" && (
                        <button
                          type="button"
                          className={button}
                          onClick={() =>
                            void personnel.saveAssignment({
                              ...assignment,
                              id:
                                assignment.id,
                              status:
                                "completed",
                            })
                          }
                        >
                          <Check size={11} />
                          Terminer
                        </button>
                      )}

                      {assignment.status !==
                        "cancelled" && (
                        <button
                          type="button"
                          className={button}
                          onClick={() =>
                            void personnel.saveAssignment({
                              ...assignment,
                              id:
                                assignment.id,
                              status:
                                "cancelled",
                            })
                          }
                        >
                          Annuler
                        </button>
                      )}
                    </div>
                  </article>
                ),
              )}
            </div>
          </section>
        </div>
      )}

      {active === "Présences" && (
        <section className={box}>
          <header className="border-b border-[#303238] p-3">
            <strong className="text-[11px] text-white">
              Présences du {today}
            </strong>
          </header>

          <div className="divide-y divide-[#292c31]">
            {data.members.map(
              (member) => {
                const attendance =
                  todayAttendance.find(
                    (entry) =>
                      entry.profileId ===
                      member.profileId,
                  );

                return (
                  <div
                    key={member.profileId}
                    className="flex flex-wrap items-center justify-between gap-3 p-3"
                  >
                    <div>
                      <strong className="text-[10px] text-white">
                        {member.name}
                      </strong>

                      <p className="mt-1 text-[8px] text-zinc-600">
                        Entrée{" "}
                        {dateTime(
                          attendance?.checkInAt ??
                            null,
                        )}
                        {" · sortie "}
                        {dateTime(
                          attendance?.checkOutAt ??
                            null,
                        )}
                      </p>
                    </div>

                    {!attendance?.checkInAt ? (
                      <button
                        type="button"
                        className={primary}
                        disabled={personnel.mutating}
                        onClick={() =>
                          void personnel.markAttendance(
                            member.profileId,
                            today,
                            "check_in",
                          )
                        }
                      >
                        Pointer entrée
                      </button>
                    ) : !attendance.checkOutAt ? (
                      <button
                        type="button"
                        className={button}
                        disabled={personnel.mutating}
                        onClick={() =>
                          void personnel.markAttendance(
                            member.profileId,
                            today,
                            "check_out",
                          )
                        }
                      >
                        Pointer sortie
                      </button>
                    ) : (
                      <span className="text-[8px] text-emerald-400">
                        Journée pointée
                      </span>
                    )}
                  </div>
                );
              },
            )}
          </div>
        </section>
      )}

      {active === "Congés" && (
        <div className="grid gap-3 xl:grid-cols-[380px_1fr]">
          <section className={`${box} p-3`}>
            <strong className="text-[11px] text-white">
              Nouvelle demande
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

                await personnel.saveLeave({
                  profileId:
                    String(
                      form.get(
                        "member",
                      ),
                    ),

                  type:
                    String(
                      form.get(
                        "type",
                      ),
                    ),

                  startsOn:
                    String(
                      form.get(
                        "start",
                      ),
                    ),

                  endsOn:
                    String(
                      form.get(
                        "end",
                      ),
                    ),
                });

                event.currentTarget.reset();
              }}
            >
              <select
                name="member"
                required
                className={input}
              >
                <option value="">
                  Collaborateur…
                </option>

                {data.members.map(
                  (member) => (
                    <option
                      key={member.profileId}
                      value={member.profileId}
                    >
                      {member.name}
                    </option>
                  ),
                )}
              </select>

              <input
                name="type"
                required
                placeholder="Type de congé"
                className={input}
              />

              <input
                name="start"
                type="date"
                required
                className={input}
              />

              <input
                name="end"
                type="date"
                required
                className={input}
              />

              <button
                className={primary}
                disabled={personnel.mutating}
              >
                Enregistrer
              </button>
            </form>
          </section>

          <section className={box}>
            <div className="divide-y divide-[#292c31]">
              {data.leaves.map(
                (leave) => (
                  <article
                    key={leave.id}
                    className="flex flex-wrap items-center justify-between gap-3 p-3"
                  >
                    <div>
                      <strong className="text-[10px] text-white">
                        {memberName(
                          data.members,
                          leave.profileId,
                        )}
                      </strong>

                      <p className="mt-1 text-[8px] text-zinc-500">
                        {leave.type}
                        {" · "}
                        {leave.startsOn}
                        {" → "}
                        {leave.endsOn}
                        {" · "}
                        {leave.status}
                      </p>
                    </div>

                    {leave.status ===
                      "pending" && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className={button}
                          disabled={personnel.mutating}
                          onClick={() =>
                            void personnel.decideLeave(
                              leave.id,
                              "approved",
                            )
                          }
                        >
                          Approuver
                        </button>

                        <button
                          type="button"
                          className={button}
                          disabled={personnel.mutating}
                          onClick={() =>
                            void personnel.decideLeave(
                              leave.id,
                              "declined",
                            )
                          }
                        >
                          Refuser
                        </button>
                      </div>
                    )}
                  </article>
                ),
              )}
            </div>
          </section>
        </div>
      )}

      {active === "Documents" && (
        <div className="grid gap-3 xl:grid-cols-[380px_1fr]">
          <section className={`${box} p-3`}>
            <strong className="text-[11px] text-white">
              Ajouter un document
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

                const file =
                  form.get(
                    "file",
                  );

                if (
                  !(file instanceof File) ||
                  !file.size
                ) {
                  return;
                }

                await personnel.addDocument(
                  {
                    profileId:
                      String(
                        form.get(
                          "member",
                        ),
                      ),

                    name:
                      String(
                        form.get(
                          "name",
                        ),
                      ),

                    category:
                      String(
                        form.get(
                          "category",
                        ),
                      ),

                    expiresAt:
                      String(
                        form.get(
                          "expires",
                        ) ?? "",
                      ) ||
                      null,
                  },
                  file,
                );

                event.currentTarget.reset();
              }}
            >
              <select
                name="member"
                required
                className={input}
              >
                <option value="">
                  Collaborateur…
                </option>

                {data.members.map(
                  (member) => (
                    <option
                      key={member.profileId}
                      value={member.profileId}
                    >
                      {member.name}
                    </option>
                  ),
                )}
              </select>

              <input
                name="name"
                required
                placeholder="Nom du document"
                className={input}
              />

              <input
                name="category"
                required
                placeholder="Catégorie"
                className={input}
              />

              <input
                name="expires"
                type="date"
                className={input}
              />

              <input
                name="file"
                type="file"
                required
                accept=".pdf,image/jpeg,image/png,image/webp"
                className={`${input} py-1.5`}
              />

              <button
                className={primary}
                disabled={personnel.mutating}
              >
                <FilePlus2 size={12} />
                Ajouter
              </button>
            </form>
          </section>

          <section className={box}>
            <div className="divide-y divide-[#292c31]">
              {data.documents.map(
                (document) => (
                  <article
                    key={document.id}
                    className="flex flex-wrap items-center justify-between gap-3 p-3"
                  >
                    <div>
                      <strong className="text-[10px] text-white">
                        {document.name}
                      </strong>

                      <p className="mt-1 text-[8px] text-zinc-600">
                        {memberName(
                          data.members,
                          document.profileId,
                        )}
                        {" · "}
                        {document.category}
                        {" · "}
                        {document.fileName}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        className={button}
                        onClick={async () => {
                          const url =
                            await personnel.documentUrl(
                              document.storagePath,
                            );

                          window.open(
                            url,
                            "_blank",
                            "noopener,noreferrer",
                          );
                        }}
                      >
                        Ouvrir
                      </button>

                      <button
                        type="button"
                        className={button}
                        disabled={personnel.mutating}
                        onClick={() =>
                          void personnel.archiveDocument(
                            document.id,
                          )
                        }
                      >
                        <Archive size={11} />
                        Archiver
                      </button>
                    </div>
                  </article>
                ),
              )}

              {!data.documents.length && (
                <div className="p-8 text-center text-[10px] text-zinc-600">
                  Aucun document.
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {active === "Rémunérations" && (
        <section className={box}>
          <header className="border-b border-[#303238] p-3">
            <strong className="text-[11px] text-white">
              Rémunérations contractuelles
            </strong>

            <p className="mt-1 text-[8px] text-zinc-600">
              Ces montants sont des paramètres RH. Ils ne constituent jamais une preuve de paiement et ne remplacent pas le ledger financier.
            </p>
          </header>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left">
              <thead className="bg-[#1a1c20] text-[7px] uppercase text-zinc-600">
                <tr>
                  <th className="h-9 px-3">
                    Collaborateur
                  </th>

                  <th className="px-3">
                    Contrat
                  </th>

                  <th className="px-3">
                    Montant mensuel
                  </th>

                  <th className="px-3">
                    Statut RH
                  </th>
                </tr>
              </thead>

              <tbody>
                {data.members.map(
                  (member) => (
                    <tr
                      key={member.profileId}
                      className="border-t border-[#292c31] text-[9px] text-zinc-300"
                    >
                      <td className="px-3 py-2.5 font-semibold text-white">
                        {member.name}
                      </td>

                      <td className="px-3">
                        {member.contractType ??
                          "—"}
                      </td>

                      <td className="px-3">
                        {money(
                          member.monthlyCompensation,
                          member.currency,
                        )}
                      </td>

                      <td className="px-3">
                        {member.employmentStatus}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}