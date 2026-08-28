"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  Check,
  Pause,
  RotateCcw,
  Search,
  ShieldCheck,
  ShieldOff,
  UserPlus,
} from "lucide-react";

import {
  SuperAdminKpiCard,
} from "../components/SuperAdminKpiCard";

import {
  SuperAdminErrorState,
  SuperAdminLoadingState,
  SuperAdminPanel,
} from "../components/SuperAdminStates";

import {
  useSuperAdminAdministrators,
} from "../hooks/useSuperAdminAdministrators";

import type {
  AdministratorGovernanceStatus,
} from "../administrator-governance.types";


type StatusFilter =
  | "all"
  | AdministratorGovernanceStatus;


function dateTime(
  value: string | null,
): string {

  if (!value) {

    return "N/D";
  }


  const date =
    new Date(
      value,
    );


  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {

    return "N/D";
  }


  return date.toLocaleString(
    "fr-FR",
    {
      dateStyle:
        "short",

      timeStyle:
        "short",
    },
  );
}


function statusLabel(
  status:
    AdministratorGovernanceStatus,
): string {

  if (
    status ===
    "suspended"
  ) {

    return "Suspendu";
  }


  if (
    status ===
    "revoked"
  ) {

    return "Révoqué";
  }


  return "Actif";
}


function statusClasses(
  status:
    AdministratorGovernanceStatus,
): string {

  if (
    status ===
    "suspended"
  ) {

    return "border-amber-500/30 bg-amber-500/5 text-amber-400";
  }


  if (
    status ===
    "revoked"
  ) {

    return "border-red-500/30 bg-red-500/5 text-red-400";
  }


  return "border-emerald-500/30 bg-emerald-500/5 text-emerald-400";
}


export function SuperAdminAdministratorsFeature() {

  const governance =
    useSuperAdminAdministrators();


  const [
    query,
    setQuery,
  ] =
    useState(
      "",
    );


  const [
    filter,
    setFilter,
  ] =
    useState<StatusFilter>(
      "all",
    );


  const [
    selectedId,
    setSelectedId,
  ] =
    useState<string | null>(
      null,
    );


  const [
    preparedCandidateId,
    setPreparedCandidateId,
  ] =
    useState<string | null>(
      null,
    );


  const [
    reason,
    setReason,
  ] =
    useState(
      "",
    );


  const [
    draftPermissions,
    setDraftPermissions,
  ] =
    useState<string[]>(
      [],
    );


  const selected =
    useMemo(
      () =>
        governance.administrators.find(
          (
            administrator,
          ) =>
            administrator.profileId ===
            selectedId,
        ) ??
        null,
      [
        governance.administrators,
        selectedId,
      ],
    );


  const preparedCandidate =
    useMemo(
      () =>
        governance.candidates.find(
          (
            candidate,
          ) =>
            candidate.profileId ===
            preparedCandidateId,
        ) ??
        null,
      [
        governance.candidates,
        preparedCandidateId,
      ],
    );


  const filteredAdministrators =
    useMemo(
      () =>
        governance.administrators.filter(
          (
            administrator,
          ) =>
            filter ===
              "all" ||
            administrator.governanceStatus ===
              filter,
        ),
      [
        filter,
        governance.administrators,
      ],
    );


  const counts =
    useMemo(
      () => ({

        active:
          governance.administrators.filter(
            (
              administrator,
            ) =>
              administrator.governanceStatus ===
              "active",
          ).length,

        suspended:
          governance.administrators.filter(
            (
              administrator,
            ) =>
              administrator.governanceStatus ===
              "suspended",
          ).length,

        revoked:
          governance.administrators.filter(
            (
              administrator,
            ) =>
              administrator.governanceStatus ===
              "revoked",
          ).length,

        inconsistent:
          governance.administrators.filter(
            (
              administrator,
            ) =>
              !administrator.consistent,
          ).length,

      }),
      [
        governance.administrators,
      ],
    );


  useEffect(
    () => {

      setDraftPermissions(
        selected?.governanceStatus ===
          "active"
          ? selected.permissions
          : selected?.permissionSnapshot ??
              [],
      );


      setReason(
        "",
      );

    },
    [
      selected,
    ],
  );


  if (
    governance.loading
  ) {

    return (
      <SuperAdminLoadingState />
    );
  }


  const validReason =
    reason.trim().length >=
    3;


  return (
    <div className="space-y-6">

      <header>

        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2588ff]">
          Governance
        </p>


        <h1 className="mt-2 text-2xl font-black sm:text-3xl">
          Administrateurs
        </h1>


        <p className="mt-2 max-w-4xl text-sm leading-6 text-zinc-500">
          Gouvernance des accès administratifs de la plateforme : attribution, suspension, réactivation, révocation et permissions individuelles.
        </p>

      </header>


      {governance.error && (

        <SuperAdminErrorState
          message={
            governance.error
          }
        />

      )}


      {governance.message && (

        <div className="border border-emerald-500/25 bg-emerald-500/5 px-4 py-3 text-xs font-semibold text-emerald-400">
          {governance.message}
        </div>

      )}


      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">

        <SuperAdminKpiCard
          label="Administrateurs actifs"
          value={
            counts.active.toLocaleString(
              "fr-FR",
            )
          }
          detail="Rôle Admin effectivement attribué."
        />


        <SuperAdminKpiCard
          label="Suspendus"
          value={
            counts.suspended.toLocaleString(
              "fr-FR",
            )
          }
          detail="Accès retiré temporairement."
        />


        <SuperAdminKpiCard
          label="Révoqués"
          value={
            counts.revoked.toLocaleString(
              "fr-FR",
            )
          }
          detail="Accès administratif retiré."
        />


        <SuperAdminKpiCard
          label="Incohérences"
          value={
            counts.inconsistent.toLocaleString(
              "fr-FR",
            )
          }
          detail="État de gouvernance différent du rôle réellement attribué."
        />

      </section>


      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">

        <SuperAdminPanel
          title="Accorder un accès Admin"
          subtitle="Recherche parmi les profils existants"
        >

          <form
            className="flex gap-2"
            onSubmit={
              (
                event,
              ) => {

                event.preventDefault();

                void governance.search(
                  query,
                );
              }
            }
          >

            <input
              value={
                query
              }
              onChange={
                (
                  event,
                ) =>
                  setQuery(
                    event.target.value,
                  )
              }
              placeholder="Nom, e-mail ou username"
              className="h-10 min-w-0 flex-1 border border-[#30343c] bg-[#0c0d10] px-3 text-sm text-white outline-none focus:border-[#2588ff]"
            />


            <button
              type="submit"
              disabled={
                query.trim().length <
                2
              }
              className="flex h-10 items-center gap-2 bg-[#2588ff] px-4 text-xs font-black text-white hover:bg-[#1478e7] disabled:opacity-40"
            >

              <Search
                size={15}
              />

              Rechercher

            </button>

          </form>


          <div className="mt-4 space-y-2">

            {governance.candidates.map(
              (
                candidate,
              ) => {

                const protectedAccount =
                  candidate.isSuperAdmin;


                const suspended =
                  candidate.governanceStatus ===
                  "suspended";


                const active =
                  candidate.governanceStatus ===
                    "active" &&
                  candidate.isAdmin;


                return (
                  <div
                    key={
                      candidate.profileId
                    }
                    className="border border-[#272a31] bg-[#0c0d10] p-3"
                  >

                    <div className="flex flex-wrap items-center justify-between gap-3">

                      <div className="min-w-0">

                        <p className="truncate text-sm font-bold text-white">
                          {candidate.fullName}
                        </p>

                        <p className="mt-0.5 truncate text-xs text-zinc-600">
                          {candidate.email}
                        </p>

                      </div>


                      {protectedAccount ? (

                        <span className="text-[10px] font-black uppercase tracking-[0.12em] text-amber-400">
                          Super Admin protégé
                        </span>

                      ) : suspended ? (

                        <span className="text-[10px] font-black uppercase tracking-[0.12em] text-amber-400">
                          Suspendu
                        </span>

                      ) : active ? (

                        <span className="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-400">
                          Admin actif
                        </span>

                      ) : (

                        <button
                          type="button"
                          onClick={() => {

                            setPreparedCandidateId(
                              candidate.profileId,
                            );

                            setReason(
                              "",
                            );
                          }}
                          className="flex h-8 items-center gap-2 border border-emerald-500/40 px-3 text-[10px] font-black uppercase text-emerald-400 hover:bg-emerald-500/10"
                        >

                          <UserPlus
                            size={13}
                          />

                          Préparer

                        </button>

                      )}

                    </div>

                  </div>
                );
              },
            )}


            {!governance.candidates.length &&
             query.trim().length >=
             2 && (

              <p className="py-5 text-center text-xs text-zinc-600">
                Lancez la recherche pour trouver un profil.
              </p>

            )}

          </div>


          {preparedCandidate && (

            <div className="mt-5 border border-emerald-500/20 bg-emerald-500/5 p-4">

              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-400">
                Nouvelle attribution
              </p>


              <p className="mt-2 text-sm font-bold text-white">
                {preparedCandidate.fullName}
              </p>


              <textarea
                value={
                  reason
                }
                onChange={
                  (
                    event,
                  ) =>
                    setReason(
                      event.target.value,
                    )
                }
                maxLength={
                  500
                }
                placeholder="Motif de l’attribution Admin..."
                className="mt-4 min-h-24 w-full resize-y border border-[#30343c] bg-[#0c0d10] p-3 text-xs text-white outline-none focus:border-[#2588ff]"
              />


              <div className="mt-3 flex flex-wrap gap-2">

                <button
                  type="button"
                  disabled={
                    governance.mutationLoading ||
                    !validReason
                  }
                  onClick={
                    async () => {

                      const success =
                        await governance.grant(
                          preparedCandidate.profileId,
                          reason,
                        );


                      if (success) {

                        setPreparedCandidateId(
                          null,
                        );

                        setReason(
                          "",
                        );
                      }
                    }
                  }
                  className="flex h-9 items-center gap-2 bg-emerald-500 px-4 text-xs font-black text-black disabled:opacity-40"
                >

                  <ShieldCheck
                    size={14}
                  />

                  Confirmer l’accès

                </button>


                <button
                  type="button"
                  disabled={
                    governance.mutationLoading
                  }
                  onClick={() => {

                    setPreparedCandidateId(
                      null,
                    );

                    setReason(
                      "",
                    );
                  }}
                  className="h-9 border border-[#30343c] px-4 text-xs font-bold text-zinc-400"
                >
                  Annuler
                </button>

              </div>

            </div>

          )}

        </SuperAdminPanel>


        <SuperAdminPanel
          title={`Gouvernance Admin · ${governance.administrators.length}`}
          subtitle="État actuel et historique de décision"
        >

          <div className="mb-4 flex flex-wrap gap-2">

            {(
              [
                [
                  "all",
                  "Tous",
                ],
                [
                  "active",
                  "Actifs",
                ],
                [
                  "suspended",
                  "Suspendus",
                ],
                [
                  "revoked",
                  "Révoqués",
                ],
              ] as Array<
                [
                  StatusFilter,
                  string,
                ]
              >
            ).map(
              (
                [
                  value,
                  label,
                ],
              ) => (

                <button
                  key={
                    value
                  }
                  type="button"
                  onClick={() =>
                    setFilter(
                      value,
                    )
                  }
                  className={[
                    "border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.1em]",

                    filter ===
                    value
                      ? "border-[#2588ff] bg-[#2588ff]/10 text-[#2588ff]"
                      : "border-[#30343c] text-zinc-600 hover:text-zinc-300",

                  ].join(
                    " ",
                  )}
                >
                  {label}
                </button>

              ),
            )}

          </div>


          <div className="max-h-[620px] space-y-2 overflow-y-auto pr-1">

            {filteredAdministrators.map(
              (
                administrator,
              ) => (

                <button
                  key={
                    administrator.profileId
                  }
                  type="button"
                  onClick={() =>
                    setSelectedId(
                      administrator.profileId,
                    )
                  }
                  className={[
                    "w-full border p-4 text-left transition",

                    selectedId ===
                    administrator.profileId
                      ? "border-[#2588ff] bg-[#2588ff]/5"
                      : "border-[#272a31] bg-[#0c0d10] hover:border-[#3a3e48]",

                  ].join(
                    " ",
                  )}
                >

                  <div className="flex flex-wrap items-start justify-between gap-3">

                    <div className="min-w-0">

                      <p className="truncate text-sm font-black text-white">
                        {administrator.fullName}
                      </p>

                      <p className="mt-1 truncate text-xs text-zinc-600">
                        {administrator.email}
                      </p>

                    </div>


                    <span
                      className={[
                        "border px-2 py-1 text-[9px] font-black uppercase tracking-[0.1em]",

                        statusClasses(
                          administrator.governanceStatus,
                        ),

                      ].join(
                        " ",
                      )}
                    >
                      {statusLabel(
                        administrator.governanceStatus,
                      )}
                    </span>

                  </div>


                  <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-zinc-600">

                    <span>
                      {administrator.permissions.length} permission(s) active(s)
                    </span>

                    {!administrator.consistent && (

                      <span className="flex items-center gap-1 font-bold text-red-400">

                        <AlertTriangle
                          size={11}
                        />

                        Incohérence

                      </span>

                    )}

                  </div>

                </button>

              ),
            )}


            {!filteredAdministrators.length && (

              <p className="py-8 text-center text-sm text-zinc-600">
                Aucun administrateur dans cet état.
              </p>

            )}

          </div>

        </SuperAdminPanel>

      </div>


      {selected && (

        <div className="space-y-6">

          <SuperAdminPanel
            title={`Gouvernance · ${selected.fullName}`}
            subtitle="État de l’accès administratif"
          >

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

              <div className="border border-[#272a31] bg-[#0c0d10] p-4">

                <p className="text-[9px] font-black uppercase tracking-[0.12em] text-zinc-600">
                  État
                </p>

                <p className="mt-2 text-sm font-black text-white">
                  {statusLabel(
                    selected.governanceStatus,
                  )}
                </p>

              </div>


              <div className="border border-[#272a31] bg-[#0c0d10] p-4">

                <p className="text-[9px] font-black uppercase tracking-[0.12em] text-zinc-600">
                  Rôle Admin réel
                </p>

                <p
                  className={
                    selected.roleAssigned
                      ? "mt-2 text-sm font-black text-emerald-400"
                      : "mt-2 text-sm font-black text-zinc-500"
                  }
                >
                  {selected.roleAssigned
                    ? "Attribué"
                    : "Absent"}
                </p>

              </div>


              <div className="border border-[#272a31] bg-[#0c0d10] p-4">

                <p className="text-[9px] font-black uppercase tracking-[0.12em] text-zinc-600">
                  Admin depuis
                </p>

                <p className="mt-2 text-xs font-bold text-zinc-300">
                  {dateTime(
                    selected.adminSince,
                  )}
                </p>

              </div>


              <div className="border border-[#272a31] bg-[#0c0d10] p-4">

                <p className="text-[9px] font-black uppercase tracking-[0.12em] text-zinc-600">
                  Dernière décision
                </p>

                <p className="mt-2 text-xs font-bold text-zinc-300">
                  {dateTime(
                    selected.updatedAt,
                  )}
                </p>

              </div>

            </div>


            <div className="mt-5 border border-[#272a31] bg-[#0c0d10] p-4">

              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-zinc-600">
                Dernier motif
              </p>

              <p className="mt-2 text-xs leading-5 text-zinc-400">
                {selected.lastReason ??
                  "Aucun motif enregistré."}
              </p>


              {selected.changedByName && (

                <p className="mt-2 text-[10px] text-zinc-700">
                  Décision par {selected.changedByName}
                </p>

              )}

            </div>

          </SuperAdminPanel>


          <SuperAdminPanel
            title={
              selected.governanceStatus ===
              "active"
                ? `Permissions actives · ${selected.permissions.length}`
                : `Permissions mémorisées · ${selected.permissionSnapshot.length}`
            }
            subtitle={
              selected.governanceStatus ===
              "active"
                ? "Seules les permissions admin.* du catalogue sont acceptées."
                : "Ces permissions ne donnent actuellement aucun accès et servent uniquement à une éventuelle réactivation."
            }
          >

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">

              {governance.permissions.map(
                (
                  permission,
                ) => {

                  const checked =
                    draftPermissions.includes(
                      permission.code,
                    );


                  return (
                    <label
                      key={
                        permission.id
                      }
                      className={[
                        "flex gap-3 border p-3",

                        selected.governanceStatus ===
                        "active"
                          ? "cursor-pointer"
                          : "cursor-default opacity-70",

                        checked
                          ? "border-[#2588ff]/60 bg-[#2588ff]/5"
                          : "border-[#272a31] bg-[#0c0d10]",

                      ].join(
                        " ",
                      )}
                    >

                      <input
                        type="checkbox"
                        checked={
                          checked
                        }
                        disabled={
                          selected.governanceStatus !==
                          "active"
                        }
                        onChange={() => {

                          if (
                            selected.governanceStatus !==
                            "active"
                          ) {

                            return;
                          }


                          setDraftPermissions(
                            (
                              current,
                            ) =>
                              current.includes(
                                permission.code,
                              )
                                ? current.filter(
                                    (
                                      code,
                                    ) =>
                                      code !==
                                      permission.code,
                                  )
                                : [
                                    ...current,
                                    permission.code,
                                  ],
                          );
                        }}
                        className="mt-1"
                      />


                      <span>

                        <span className="block text-xs font-bold text-zinc-200">
                          {permission.code}
                        </span>

                        <span className="mt-1 block text-[11px] leading-4 text-zinc-600">
                          {permission.description ??
                            "Permission administrateur"}
                        </span>

                      </span>

                    </label>
                  );
                },
              )}

            </div>

          </SuperAdminPanel>


          <SuperAdminPanel
            title="Décision de gouvernance"
            subtitle="Toute modification nécessite un motif et sera enregistrée dans Access Logs."
          >

            <textarea
              value={
                reason
              }
              onChange={
                (
                  event,
                ) =>
                  setReason(
                    event.target.value,
                  )
              }
              maxLength={
                500
              }
              placeholder="Motif de la décision..."
              className="min-h-24 w-full resize-y border border-[#30343c] bg-[#0c0d10] p-3 text-xs text-white outline-none focus:border-[#2588ff]"
            />


            <div className="mt-2 text-right text-[9px] text-zinc-700">
              {reason.length} / 500
            </div>


            <div className="mt-4 flex flex-wrap gap-2">

              {selected.governanceStatus ===
              "active" && (

                <>

                  <button
                    type="button"
                    disabled={
                      governance.mutationLoading ||
                      !validReason
                    }
                    onClick={
                      () =>
                        void governance.savePermissions(
                          selected.profileId,
                          draftPermissions,
                          reason,
                        )
                    }
                    className="flex h-9 items-center gap-2 bg-[#2588ff] px-4 text-xs font-black text-white disabled:opacity-40"
                  >

                    <Check
                      size={14}
                    />

                    Enregistrer les permissions

                  </button>


                  <button
                    type="button"
                    disabled={
                      governance.mutationLoading ||
                      !validReason
                    }
                    onClick={
                      () =>
                        void governance.suspend(
                          selected.profileId,
                          reason,
                        )
                    }
                    className="flex h-9 items-center gap-2 border border-amber-500/40 px-4 text-xs font-black text-amber-400 hover:bg-amber-500/10 disabled:opacity-40"
                  >

                    <Pause
                      size={14}
                    />

                    Suspendre

                  </button>


                  <button
                    type="button"
                    disabled={
                      governance.mutationLoading ||
                      !validReason
                    }
                    onClick={
                      () =>
                        void governance.revoke(
                          selected.profileId,
                          reason,
                        )
                    }
                    className="flex h-9 items-center gap-2 border border-red-500/40 px-4 text-xs font-black text-red-400 hover:bg-red-500/10 disabled:opacity-40"
                  >

                    <ShieldOff
                      size={14}
                    />

                    Révoquer

                  </button>

                </>

              )}


              {selected.governanceStatus ===
              "suspended" && (

                <>

                  <button
                    type="button"
                    disabled={
                      governance.mutationLoading ||
                      !validReason
                    }
                    onClick={
                      () =>
                        void governance.reactivate(
                          selected.profileId,
                          reason,
                        )
                    }
                    className="flex h-9 items-center gap-2 bg-emerald-500 px-4 text-xs font-black text-black disabled:opacity-40"
                  >

                    <RotateCcw
                      size={14}
                    />

                    Réactiver

                  </button>


                  <button
                    type="button"
                    disabled={
                      governance.mutationLoading ||
                      !validReason
                    }
                    onClick={
                      () =>
                        void governance.revoke(
                          selected.profileId,
                          reason,
                        )
                    }
                    className="flex h-9 items-center gap-2 border border-red-500/40 px-4 text-xs font-black text-red-400 hover:bg-red-500/10 disabled:opacity-40"
                  >

                    <ShieldOff
                      size={14}
                    />

                    Révoquer définitivement

                  </button>

                </>

              )}


              {selected.governanceStatus ===
              "revoked" && (

                <button
                  type="button"
                  disabled={
                    governance.mutationLoading ||
                    !validReason
                  }
                  onClick={
                    () =>
                      void governance.grant(
                        selected.profileId,
                        reason,
                      )
                  }
                  className="flex h-9 items-center gap-2 bg-emerald-500 px-4 text-xs font-black text-black disabled:opacity-40"
                >

                  <UserPlus
                    size={14}
                  />

                  Accorder de nouveau

                </button>

              )}

            </div>


            <div className="mt-5 border border-[#30343c] bg-[#111318] p-4">

              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-zinc-400">
                Principe de sécurité
              </p>

              <p className="mt-2 text-xs leading-5 text-zinc-600">
                Suspendre ou révoquer retire physiquement le rôle système Admin ainsi que les permissions opérationnelles. Une suspension conserve seulement un snapshot de gouvernance destiné à une réactivation contrôlée.
              </p>

            </div>

          </SuperAdminPanel>

        </div>

      )}

    </div>
  );
}