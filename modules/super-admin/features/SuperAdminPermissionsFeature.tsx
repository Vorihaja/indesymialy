"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  Check,
  RotateCcw,
  Search,
  ShieldCheck,
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
  useSuperAdminPermissions,
} from "../hooks/useSuperAdminPermissions";

import type {
  AdminPermissionDomain,
  AdminPermissionSensitivity,
  SuperAdminPermissionAdministrator,
  SuperAdminPermissionGovernanceItem,
} from "../permission-governance.types";


type DomainFilter =
  | "all"
  | AdminPermissionDomain;


type SensitivityFilter =
  | "all"
  | AdminPermissionSensitivity;


function sorted(
  values: string[],
): string[] {

  return [
    ...values,
  ].sort();
}


function sameCodes(
  first: string[],
  second: string[],
): boolean {

  return JSON.stringify(
    sorted(
      first,
    ),
  ) ===
    JSON.stringify(
      sorted(
        second,
      ),
    );
}


function statusLabel(
  administrator:
    SuperAdminPermissionAdministrator,
): string {

  if (
    administrator.governanceStatus ===
    "suspended"
  ) {

    return "Suspendu";
  }


  if (
    administrator.governanceStatus ===
    "revoked"
  ) {

    return "Révoqué";
  }


  return administrator.effectiveAccess
    ? "Actif"
    : "Incohérent";
}


function statusClass(
  administrator:
    SuperAdminPermissionAdministrator,
): string {

  if (
    !administrator.consistent
  ) {

    return "text-red-400";
  }


  if (
    administrator.governanceStatus ===
    "suspended"
  ) {

    return "text-amber-400";
  }


  if (
    administrator.governanceStatus ===
    "revoked"
  ) {

    return "text-red-400";
  }


  return "text-emerald-400";
}


function sensitivityLabel(
  sensitivity:
    AdminPermissionSensitivity,
): string {

  if (
    sensitivity ===
    "critical"
  ) {

    return "Critique";
  }


  if (
    sensitivity ===
    "sensitive"
  ) {

    return "Sensible";
  }


  return "Standard";
}


function sensitivityClass(
  sensitivity:
    AdminPermissionSensitivity,
): string {

  if (
    sensitivity ===
    "critical"
  ) {

    return "border-red-500/30 bg-red-500/5 text-red-400";
  }


  if (
    sensitivity ===
    "sensitive"
  ) {

    return "border-amber-500/30 bg-amber-500/5 text-amber-400";
  }


  return "border-[#30343c] bg-[#111318] text-zinc-500";
}


export function SuperAdminPermissionsFeature() {

  const governance =
    useSuperAdminPermissions();


  const [
    selectedProfileId,
    setSelectedProfileId,
  ] =
    useState<string | null>(
      null,
    );


  const [
    draftPermissions,
    setDraftPermissions,
  ] =
    useState<string[]>(
      [],
    );


  const [
    reason,
    setReason,
  ] =
    useState(
      "",
    );


  const [
    search,
    setSearch,
  ] =
    useState(
      "",
    );


  const [
    domainFilter,
    setDomainFilter,
  ] =
    useState<DomainFilter>(
      "all",
    );


  const [
    sensitivityFilter,
    setSensitivityFilter,
  ] =
    useState<SensitivityFilter>(
      "all",
    );


  const data =
    governance.data;


  const selected =
    useMemo(
      () =>
        data?.administrators.find(
          (
            administrator,
          ) =>
            administrator.profileId ===
            selectedProfileId,
        ) ??
        null,
      [
        data,
        selectedProfileId,
      ],
    );


  useEffect(
    () => {

      if (
        !data
      ) {

        return;
      }


      const selectedStillExists =
        selectedProfileId &&
        data.administrators.some(
          (
            administrator,
          ) =>
            administrator.profileId ===
            selectedProfileId,
        );


      if (
        selectedStillExists
      ) {

        return;
      }


      const preferred =
        data.administrators.find(
          (
            administrator,
          ) =>
            administrator.effectiveAccess,
        ) ??
        data.administrators[0];


      setSelectedProfileId(
        preferred?.profileId ??
        null,
      );

    },
    [
      data,
      selectedProfileId,
    ],
  );


  useEffect(
    () => {

      setDraftPermissions(
        selected?.effectiveAccess
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


  const domainOptions =
    useMemo(
      () => {

        if (
          !data
        ) {

          return [];
        }


        const seen =
          new Set<string>();


        return data.catalog.filter(
          (
            permission,
          ) => {

            if (
              seen.has(
                permission.domain,
              )
            ) {

              return false;
            }


            seen.add(
              permission.domain,
            );


            return true;
          },
        );

      },
      [
        data,
      ],
    );


  const visiblePermissions =
    useMemo(
      () => {

        if (
          !data
        ) {

          return [];
        }


        const normalizedSearch =
          search
            .trim()
            .toLocaleLowerCase(
              "fr-FR",
            );


        return data.catalog.filter(
          (
            permission,
          ) => {

            if (
              domainFilter !==
                "all" &&
              permission.domain !==
                domainFilter
            ) {

              return false;
            }


            if (
              sensitivityFilter !==
                "all" &&
              permission.sensitivity !==
                sensitivityFilter
            ) {

              return false;
            }


            if (
              !normalizedSearch
            ) {

              return true;
            }


            return [
              permission.code,
              permission.label,
              permission.description ??
                "",
              permission.domainLabel,
              permission.actionLabel,
            ]
              .join(
                " ",
              )
              .toLocaleLowerCase(
                "fr-FR",
              )
              .includes(
                normalizedSearch,
              );
          },
        );

      },
      [
        data,
        domainFilter,
        search,
        sensitivityFilter,
      ],
    );


  const groupedPermissions =
    useMemo(
      () => {

        const groups =
          new Map<
            string,
            SuperAdminPermissionGovernanceItem[]
          >();


        for (
          const permission
          of visiblePermissions
        ) {

          const current =
            groups.get(
              permission.domainLabel,
            ) ??
            [];


          current.push(
            permission,
          );


          groups.set(
            permission.domainLabel,
            current,
          );
        }


        return Array.from(
          groups.entries(),
        );

      },
      [
        visiblePermissions,
      ],
    );


  const dirty =
    selected
      ? !sameCodes(
          draftPermissions,
          selected.permissions,
        )
      : false;


  const added =
    useMemo(
      () =>
        selected
          ? sorted(
              draftPermissions.filter(
                (
                  code,
                ) =>
                  !selected.permissions.includes(
                    code,
                  ),
              ),
            )
          : [],
      [
        draftPermissions,
        selected,
      ],
    );


  const removed =
    useMemo(
      () =>
        selected
          ? sorted(
              selected.permissions.filter(
                (
                  code,
                ) =>
                  !draftPermissions.includes(
                    code,
                  ),
              ),
            )
          : [],
      [
        draftPermissions,
        selected,
      ],
    );


  const criticalChanged =
    useMemo(
      () => {

        if (
          !data
        ) {

          return [];
        }


        const changed =
          new Set([
            ...added,
            ...removed,
          ]);


        return data.catalog.filter(
          (
            permission,
          ) =>
            permission.sensitivity ===
              "critical" &&
            changed.has(
              permission.code,
            ),
        );

      },
      [
        added,
        data,
        removed,
      ],
    );


  if (
    governance.loading
  ) {

    return (
      <SuperAdminLoadingState />
    );
  }


  if (
    governance.error &&
    !data
  ) {

    return (
      <SuperAdminErrorState
        message={
          governance.error
        }
      />
    );
  }


  if (
    !data
  ) {

    return (
      <SuperAdminErrorState
        message="Aucune donnée de gouvernance disponible."
      />
    );
  }


  const validReason =
    reason.trim().length >=
    3;


  const canEdit =
    Boolean(
      selected?.effectiveAccess &&
      selected.consistent,
    );


  function togglePermission(
    code: string,
  ) {

    if (
      !canEdit
    ) {

      return;
    }


    setDraftPermissions(
      (
        current,
      ) =>
        current.includes(
          code,
        )
          ? current.filter(
              (
                item,
              ) =>
                item !==
                code,
            )
          : [
              ...current,
              code,
            ],
    );
  }


  return (
    <div className="space-y-6">

      <header>

        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2588ff]">
          Governance
        </p>


        <h1 className="mt-2 text-2xl font-black sm:text-3xl">
          Gouvernance des permissions
        </h1>


        <p className="mt-2 max-w-4xl text-sm leading-6 text-zinc-500">
          Catalogue canonique des droits Administrateur, classification par domaine et sensibilité, puis attribution contrôlée avec validation explicite.
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
          label="Permissions"
          value={
            data.summary.totalPermissions.toLocaleString(
              "fr-FR",
            )
          }
          detail="Catalogue Admin actif et classifié."
        />


        <SuperAdminKpiCard
          label="Permissions critiques"
          value={
            data.summary.criticalPermissions.toLocaleString(
              "fr-FR",
            )
          }
          detail="Droits nécessitant une vigilance renforcée."
        />


        <SuperAdminKpiCard
          label="Administrateurs actifs"
          value={
            data.summary.activeAdministrators.toLocaleString(
              "fr-FR",
            )
          }
          detail="Accès Admin réellement actifs selon G1."
        />


        <SuperAdminKpiCard
          label="Attributions actives"
          value={
            data.summary.activeAssignments.toLocaleString(
              "fr-FR",
            )
          }
          detail="Permissions actuellement accordées."
        />

      </section>


      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">

        <SuperAdminPanel
          title="Administrateurs"
          subtitle="Sélectionnez le compte à gouverner"
        >

          <div className="space-y-2">

            {data.administrators.map(
              (
                administrator,
              ) => {

                const selectedRow =
                  selectedProfileId ===
                  administrator.profileId;


                return (
                  <button
                    key={
                      administrator.profileId
                    }
                    type="button"
                    onClick={() =>
                      setSelectedProfileId(
                        administrator.profileId,
                      )
                    }
                    className={[
                      "w-full border p-3 text-left transition",

                      selectedRow
                        ? "border-[#2588ff] bg-[#2588ff]/5"
                        : "border-[#272a31] bg-[#0c0d10] hover:border-[#3a3e48]",

                    ].join(
                      " ",
                    )}
                  >

                    <div className="flex items-start justify-between gap-3">

                      <div className="min-w-0">

                        <p className="truncate text-xs font-black text-white">
                          {administrator.fullName}
                        </p>

                        <p className="mt-1 truncate text-[10px] text-zinc-600">
                          {administrator.email}
                        </p>

                      </div>


                      {administrator.effectiveAccess && (

                        <ShieldCheck
                          size={14}
                          className="shrink-0 text-emerald-400"
                        />

                      )}

                    </div>


                    <div className="mt-3 flex items-center justify-between text-[10px]">

                      <span
                        className={
                          statusClass(
                            administrator,
                          )
                        }
                      >
                        {statusLabel(
                          administrator,
                        )}
                      </span>


                      <span className="text-zinc-600">
                        {administrator.permissions.length} droit(s)
                      </span>

                    </div>


                    {!administrator.consistent && (

                      <div className="mt-2 flex items-center gap-1 text-[9px] font-bold text-red-400">

                        <AlertTriangle
                          size={11}
                        />

                        État incohérent

                      </div>

                    )}

                  </button>
                );
              },
            )}


            {!data.administrators.length && (

              <p className="py-6 text-center text-xs text-zinc-600">
                Aucun administrateur gouverné.
              </p>

            )}

          </div>

        </SuperAdminPanel>


        <div className="space-y-6">

          <SuperAdminPanel
            title={
              selected
                ? `Permissions · ${selected.fullName}`
                : "Permissions"
            }
            subtitle={
              selected?.effectiveAccess
                ? "Les cases modifient uniquement le brouillon. Aucun changement n’est appliqué avant confirmation."
                : "Sélectionnez un Administrateur actif pour modifier ses permissions."
            }
          >

            <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_auto_auto]">

              <div className="relative">

                <Search
                  size={14}
                  className="absolute left-3 top-3 text-zinc-600"
                />

                <input
                  value={
                    search
                  }
                  onChange={
                    (
                      event,
                    ) =>
                      setSearch(
                        event.target.value,
                      )
                  }
                  placeholder="Rechercher une permission..."
                  className="h-10 w-full border border-[#30343c] bg-[#0c0d10] pl-9 pr-3 text-xs text-white outline-none focus:border-[#2588ff]"
                />

              </div>


              <select
                value={
                  domainFilter
                }
                onChange={
                  (
                    event,
                  ) =>
                    setDomainFilter(
                      event.target.value as DomainFilter,
                    )
                }
                className="h-10 border border-[#30343c] bg-[#0c0d10] px-3 text-xs text-zinc-300 outline-none"
              >

                <option value="all">
                  Tous les domaines
                </option>


                {domainOptions.map(
                  (
                    permission,
                  ) => (

                    <option
                      key={
                        permission.domain
                      }
                      value={
                        permission.domain
                      }
                    >
                      {permission.domainLabel}
                    </option>

                  ),
                )}

              </select>


              <select
                value={
                  sensitivityFilter
                }
                onChange={
                  (
                    event,
                  ) =>
                    setSensitivityFilter(
                      event.target.value as SensitivityFilter,
                    )
                }
                className="h-10 border border-[#30343c] bg-[#0c0d10] px-3 text-xs text-zinc-300 outline-none"
              >

                <option value="all">
                  Toutes sensibilités
                </option>

                <option value="standard">
                  Standard
                </option>

                <option value="sensitive">
                  Sensible
                </option>

                <option value="critical">
                  Critique
                </option>

              </select>

            </div>


            <div className="mt-6 space-y-6">

              {groupedPermissions.map(
                (
                  [
                    domainLabel,
                    permissions,
                  ],
                ) => (

                  <section
                    key={
                      domainLabel
                    }
                  >

                    <div className="mb-3 flex items-center justify-between">

                      <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400">
                        {domainLabel}
                      </h3>


                      <span className="text-[9px] text-zinc-700">
                        {permissions.length} permission(s)
                      </span>

                    </div>


                    <div className="grid gap-2 lg:grid-cols-2">

                      {permissions.map(
                        (
                          permission,
                        ) => {

                          const checked =
                            draftPermissions.includes(
                              permission.code,
                            );


                          return (
                            <button
                              key={
                                permission.id
                              }
                              type="button"
                              disabled={
                                !canEdit
                              }
                              onClick={() =>
                                togglePermission(
                                  permission.code,
                                )
                              }
                              className={[
                                "flex min-h-[92px] items-start gap-3 border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-60",

                                checked
                                  ? "border-[#2588ff]/60 bg-[#2588ff]/5"
                                  : "border-[#272a31] bg-[#0c0d10] hover:border-[#3a3e48]",

                              ].join(
                                " ",
                              )}
                            >

                              <span
                                className={[
                                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border",

                                  checked
                                    ? "border-[#2588ff] bg-[#2588ff] text-white"
                                    : "border-[#40444d] text-transparent",

                                ].join(
                                  " ",
                                )}
                              >

                                <Check
                                  size={12}
                                />

                              </span>


                              <span className="min-w-0 flex-1">

                                <span className="flex flex-wrap items-center gap-2">

                                  <span className="text-xs font-black text-zinc-200">
                                    {permission.label}
                                  </span>


                                  <span
                                    className={[
                                      "border px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.08em]",

                                      sensitivityClass(
                                        permission.sensitivity,
                                      ),

                                    ].join(
                                      " ",
                                    )}
                                  >
                                    {sensitivityLabel(
                                      permission.sensitivity,
                                    )}
                                  </span>

                                </span>


                                <span className="mt-1 block font-mono text-[9px] text-[#2588ff]">
                                  {permission.code}
                                </span>


                                <span className="mt-2 block text-[10px] leading-4 text-zinc-600">
                                  {permission.actionLabel} · attribuée à {permission.assignedCount} administrateur(s)
                                </span>

                              </span>

                            </button>
                          );
                        },
                      )}

                    </div>

                  </section>

                ),
              )}


              {!visiblePermissions.length && (

                <p className="py-8 text-center text-xs text-zinc-600">
                  Aucune permission ne correspond aux filtres.
                </p>

              )}

            </div>

          </SuperAdminPanel>


          {selected && (

            <SuperAdminPanel
              title="Validation de la décision"
              subtitle="Les modifications ne sont appliquées qu’après confirmation explicite."
            >

              {!selected.effectiveAccess && (

                <div className="mb-4 border border-amber-500/25 bg-amber-500/5 p-4">

                  <p className="text-xs font-black text-amber-400">
                    Modification désactivée
                  </p>

                  <p className="mt-2 text-[11px] leading-5 text-zinc-500">
                    Cet administrateur n’a pas actuellement un accès Admin actif. Utilisez G1 Administrateurs pour le réactiver ou corriger son état.
                  </p>

                </div>

              )}


              <div className="grid gap-4 lg:grid-cols-2">

                <div className="border border-[#272a31] bg-[#0c0d10] p-4">

                  <p className="text-[9px] font-black uppercase tracking-[0.12em] text-zinc-600">
                    Ajouts
                  </p>


                  {added.length ? (

                    <div className="mt-3 space-y-1">

                      {added.map(
                        (
                          code,
                        ) => (

                          <p
                            key={
                              code
                            }
                            className="font-mono text-[10px] text-emerald-400"
                          >
                            + {code}
                          </p>

                        ),
                      )}

                    </div>

                  ) : (

                    <p className="mt-3 text-xs text-zinc-700">
                      Aucun ajout.
                    </p>

                  )}

                </div>


                <div className="border border-[#272a31] bg-[#0c0d10] p-4">

                  <p className="text-[9px] font-black uppercase tracking-[0.12em] text-zinc-600">
                    Retraits
                  </p>


                  {removed.length ? (

                    <div className="mt-3 space-y-1">

                      {removed.map(
                        (
                          code,
                        ) => (

                          <p
                            key={
                              code
                            }
                            className="font-mono text-[10px] text-red-400"
                          >
                            - {code}
                          </p>

                        ),
                      )}

                    </div>

                  ) : (

                    <p className="mt-3 text-xs text-zinc-700">
                      Aucun retrait.
                    </p>

                  )}

                </div>

              </div>


              {criticalChanged.length >
                0 && (

                <div className="mt-4 border border-red-500/25 bg-red-500/5 p-4">

                  <div className="flex items-center gap-2 text-red-400">

                    <AlertTriangle
                      size={15}
                    />

                    <p className="text-[10px] font-black uppercase tracking-[0.12em]">
                      Permission critique modifiée
                    </p>

                  </div>


                  <p className="mt-2 text-xs leading-5 text-zinc-500">
                    La décision concerne {criticalChanged.length} permission(s) classée(s) critique(s). Vérifiez le brouillon avant l’enregistrement.
                  </p>

                </div>

              )}


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
                disabled={
                  !canEdit
                }
                placeholder="Motif de cette modification de permissions..."
                className="mt-4 min-h-24 w-full resize-y border border-[#30343c] bg-[#0c0d10] p-3 text-xs text-white outline-none focus:border-[#2588ff] disabled:opacity-50"
              />


              <div className="mt-2 flex items-center justify-between text-[9px]">

                <span
                  className={
                    dirty
                      ? "font-bold text-amber-400"
                      : "text-zinc-700"
                  }
                >
                  {dirty
                    ? `${added.length} ajout(s) · ${removed.length} retrait(s)`
                    : "Aucun changement en attente"}
                </span>


                <span className="text-zinc-700">
                  {reason.length} / 500
                </span>

              </div>


              <div className="mt-4 flex flex-wrap gap-2">

                <button
                  type="button"
                  disabled={
                    governance.mutationLoading ||
                    !canEdit ||
                    !dirty ||
                    !validReason
                  }
                  onClick={
                    async () => {

                      const success =
                        await governance.savePermissions(
                          selected.profileId,
                          draftPermissions,
                          reason,
                        );


                      if (
                        success
                      ) {

                        setReason(
                          "",
                        );
                      }
                    }
                  }
                  className="flex h-9 items-center gap-2 bg-[#2588ff] px-4 text-xs font-black text-white hover:bg-[#1478e7] disabled:opacity-40"
                >

                  <ShieldCheck
                    size={14}
                  />

                  Enregistrer les changements

                </button>


                <button
                  type="button"
                  disabled={
                    governance.mutationLoading ||
                    !dirty
                  }
                  onClick={() =>
                    setDraftPermissions(
                      selected.permissions,
                    )
                  }
                  className="flex h-9 items-center gap-2 border border-[#30343c] px-4 text-xs font-bold text-zinc-400 hover:text-white disabled:opacity-40"
                >

                  <RotateCcw
                    size={14}
                  />

                  Annuler le brouillon

                </button>

              </div>

            </SuperAdminPanel>

          )}

        </div>

      </div>


      <SuperAdminPanel
        title="Matrice consolidée"
        subtitle="Vue de contrôle en lecture seule · Administrateurs × Permissions"
      >

        <div className="overflow-x-auto">

          <table className="min-w-[1100px] w-full border-collapse text-xs">

            <thead>

              <tr className="border-b border-[#30343c]">

                <th className="sticky left-0 z-10 min-w-[300px] bg-[#111318] p-3 text-left text-[10px] font-black uppercase tracking-[0.12em] text-zinc-500">
                  Permission
                </th>


                {data.administrators.map(
                  (
                    administrator,
                  ) => (

                    <th
                      key={
                        administrator.profileId
                      }
                      className="min-w-[140px] p-3 text-center"
                    >

                      <p className="truncate text-[10px] font-black text-zinc-300">
                        {administrator.fullName}
                      </p>


                      <p
                        className={[
                          "mt-1 text-[8px] font-black uppercase tracking-[0.08em]",

                          statusClass(
                            administrator,
                          ),

                        ].join(
                          " ",
                        )}
                      >
                        {statusLabel(
                          administrator,
                        )}
                      </p>

                    </th>

                  ),
                )}

              </tr>

            </thead>


            <tbody>

              {visiblePermissions.map(
                (
                  permission,
                ) => (

                  <tr
                    key={
                      permission.id
                    }
                    className="border-b border-[#202228]"
                  >

                    <td className="sticky left-0 z-10 bg-[#111318] p-3">

                      <div className="flex flex-wrap items-center gap-2">

                        <span className="text-xs font-bold text-zinc-200">
                          {permission.label}
                        </span>


                        <span
                          className={[
                            "border px-1.5 py-0.5 text-[8px] font-black uppercase",

                            sensitivityClass(
                              permission.sensitivity,
                            ),

                          ].join(
                            " ",
                          )}
                        >
                          {sensitivityLabel(
                            permission.sensitivity,
                          )}
                        </span>

                      </div>


                      <p className="mt-1 font-mono text-[9px] text-zinc-600">
                        {permission.code}
                      </p>

                    </td>


                    {data.administrators.map(
                      (
                        administrator,
                      ) => {

                        const assigned =
                          administrator.permissions.includes(
                            permission.code,
                          );


                        return (
                          <td
                            key={`${permission.id}-${administrator.profileId}`}
                            className="p-3 text-center"
                          >

                            {assigned ? (

                              <span className="inline-flex h-6 w-6 items-center justify-center border border-emerald-500/30 bg-emerald-500/5 text-emerald-400">
                                <Check
                                  size={13}
                                />
                              </span>

                            ) : (

                              <span className="text-zinc-800">
                                —
                              </span>

                            )}

                          </td>
                        );
                      },
                    )}

                  </tr>

                ),
              )}

            </tbody>

          </table>

        </div>

      </SuperAdminPanel>


      <div className="border border-[#30343c] bg-[#111318] p-5">

        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400">
          Contrat G2-A
        </p>


        <p className="mt-3 max-w-6xl text-xs leading-5 text-zinc-600">
          Le rôle Admin ne suffit plus à définir conceptuellement une autorisation. Le moteur canonique has_admin_permission() exige simultanément un rôle Admin réel, un état G1 actif, une permission individuelle attribuée et une permission G2 active. Le Super Admin n’hérite d’aucun droit opérationnel Admin.
        </p>


        <p className="mt-2 max-w-6xl text-xs leading-5 text-zinc-700">
          G2-A installe ce contrat sans modifier encore en masse les routes, RPC métier ou politiques RLS existantes. Leur migration progressive vers ce moteur sera réalisée dans G2-B.
        </p>

      </div>

    </div>
  );
}