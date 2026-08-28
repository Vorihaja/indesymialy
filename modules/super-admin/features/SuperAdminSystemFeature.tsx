"use client";

import {
  SuperAdminHttpUptimePanel,
} from "../components/SuperAdminHttpUptimePanel";

import {
  SuperAdminKpiCard,
} from "../components/SuperAdminKpiCard";

import {
  SuperAdminErrorState,
  SuperAdminLoadingState,
  SuperAdminPanel,
} from "../components/SuperAdminStates";

import {
  formatBytes,
  formatNumber,
  formatPercent,
} from "../components/formatters";

import {
  useSuperAdminHttpUptimeAnalytics,
} from "../hooks/useSuperAdminHttpUptimeAnalytics";

import {
  useSuperAdminSystemAnalytics,
} from "../hooks/useSuperAdminSystemAnalytics";


function duration(
  seconds: number | null,
): string {

  if (
    seconds === null
  ) {
    return "N/D";
  }


  const days =
    Math.floor(
      seconds /
      86400,
    );


  const hours =
    Math.floor(
      (
        seconds %
        86400
      ) /
      3600,
    );


  const minutes =
    Math.floor(
      (
        seconds %
        3600
      ) /
      60,
    );


  if (
    days >
    0
  ) {
    return `${days} j ${hours} h`;
  }


  if (
    hours >
    0
  ) {
    return `${hours} h ${minutes} min`;
  }


  return `${minutes} min`;
}


function dateTime(
  value: string | null,
): string {

  if (!value) {
    return "N/D";
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
    return "N/D";
  }


  return parsed.toLocaleString(
    "fr-FR",
    {
      dateStyle:
        "short",

      timeStyle:
        "medium",
    },
  );
}


function CoverageRow({
  label,
  available,
  detail,
}: {
  label: string;

  available: boolean;

  detail: string;
}) {

  return (
    <div className="flex flex-col gap-2 border-b border-[#272a31] py-3 first:pt-0 last:border-b-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">

      <div>

        <p className="text-xs font-bold text-zinc-300">
          {label}
        </p>

        <p className="mt-1 text-[10px] leading-4 text-zinc-600">
          {detail}
        </p>

      </div>


      <span
        className={[
          "shrink-0 border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em]",

          available
            ? "border-emerald-500/25 bg-emerald-500/5 text-emerald-400"
            : "border-zinc-700 bg-zinc-900 text-zinc-600",

        ].join(
          " ",
        )}
      >
        {available
          ? "Mesuré"
          : "Source non connectée"}
      </span>

    </div>
  );
}


export function SuperAdminSystemFeature() {

  const system =
    useSuperAdminSystemAnalytics();


  const httpUptime =
    useSuperAdminHttpUptimeAnalytics();


  if (
    system.loading
  ) {
    return (
      <SuperAdminLoadingState />
    );
  }


  if (
    system.error ||
    !system.data
  ) {
    return (
      <SuperAdminErrorState
        message={
          system.error ??
          "System Monitoring indisponible."
        }
      />
    );
  }


  const {
    database,
    auth,
    storage,
    realtime,
    migrations,
    coverage,
  } =
    system.data;


  const httpMonitoringMeasured =
    Boolean(
      httpUptime.data?.enabled &&
      httpUptime.data.totalChecks >
        0,
    );


  return (
    <div className="space-y-6">

      <header>

        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2588ff]">
          Infrastructure Observatory
        </p>

        <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
          Système
        </h1>

        <p className="mt-2 max-w-4xl text-sm text-zinc-500">
          Santé technique observée depuis PostgreSQL, Supabase et les sondes HTTP indépendantes de la production Indesy.
        </p>

      </header>


      {system.monitoringError && (

        <div className="border border-amber-500/20 bg-amber-500/5 px-5 py-4 text-xs text-amber-300">
          Les données système sont disponibles, mais l’historisation PostgreSQL signale : {system.monitoringError}
        </div>

      )}


      <SuperAdminHttpUptimePanel
        data={
          httpUptime.data
        }
        loading={
          httpUptime.loading
        }
        error={
          httpUptime.error
        }
      />


      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">

        <SuperAdminKpiCard
          label="PostgreSQL"
          value={
            database.reachable
              ? "Opérationnel"
              : "N/D"
          }
          detail={`Observé ${dateTime(
            system.data.observedAt,
          )}`}
        />


        <SuperAdminKpiCard
          label="Latence RPC Supabase"
          value={`${formatNumber(
            Math.round(
              system.data.rpcRoundTripMs,
            ),
          )} ms`}
          detail="Aller-retour réel navigateur → Supabase pour cette mesure."
        />


        <SuperAdminKpiCard
          label="Uptime PostgreSQL"
          value={
            duration(
              database.uptimeSeconds,
            )
          }
          detail={
            database.startedAt
              ? `Depuis ${dateTime(
                  database.startedAt,
                )}`
              : "Date de démarrage indisponible"
          }
        />


        <SuperAdminKpiCard
          label="Taille base de données"
          value={
            formatBytes(
              database.sizeBytes,
            )
          }
          detail={`${formatNumber(
            database.publicTables,
          )} table(s) public`}
        />


        <SuperAdminKpiCard
          label="Connexions PostgreSQL"
          value={`${formatNumber(
            database.connections,
          )} / ${formatNumber(
            database.maxConnections,
          )}`}
          detail={`${formatNumber(
            database.activeConnections,
          )} active(s) · ${formatNumber(
            database.idleConnections,
          )} idle`}
        />


        <SuperAdminKpiCard
          label="Utilisation connexions"
          value={
            formatPercent(
              database.connectionUsageRate,
            )
          }
        />


        <SuperAdminKpiCard
          label="Cache hit ratio"
          value={
            formatPercent(
              database.cacheHitRate,
            )
          }
          detail="Statistiques PostgreSQL depuis le dernier reset."
        />


        <SuperAdminKpiCard
          label="Rollback ratio"
          value={
            formatPercent(
              database.rollbackRate,
            )
          }
          detail={`${formatNumber(
            database.transactionsRolledBack,
          )} rollback(s) observé(s)`}
        />


        <SuperAdminKpiCard
          label="Deadlocks"
          value={
            formatNumber(
              database.deadlocks,
            )
          }
          detail="Compteur PostgreSQL depuis le reset des statistiques."
        />


        <SuperAdminKpiCard
          label="Fichiers temporaires"
          value={
            formatBytes(
              database.tempBytes,
            )
          }
          detail="Volume temporaire PostgreSQL cumulé."
        />


        <SuperAdminKpiCard
          label="Utilisateurs Auth"
          value={
            auth.available
              ? formatNumber(
                  auth.totalUsers,
                )
              : "N/D"
          }
          detail={
            auth.available
              ? `${formatNumber(
                  auth.signInsPeriod,
                )} compte(s) dont le dernier sign-in tombe dans la période`
              : "Schéma Auth indisponible"
          }
        />


        <SuperAdminKpiCard
          label="Nouveaux comptes Auth"
          value={
            auth.available
              ? formatNumber(
                  auth.newUsersPeriod,
                )
              : "N/D"
          }
          detail={
            auth.lastSignInAt
              ? `Dernier sign-in : ${dateTime(
                  auth.lastSignInAt,
                )}`
              : undefined
          }
        />


        <SuperAdminKpiCard
          label="Storage"
          value={
            storage.available
              ? formatBytes(
                  storage.bytes,
                )
              : "N/D"
          }
          detail={
            storage.available
              ? `${formatNumber(
                  storage.objects,
                )} objet(s) · ${formatNumber(
                  storage.buckets,
                )} bucket(s)`
              : "Source Storage non disponible"
          }
        />


        <SuperAdminKpiCard
          label="Realtime DB"
          value={
            formatNumber(
              realtime.databaseBackends,
            )
          }
          detail="Backends PostgreSQL identifiables comme Realtime — pas utilisateurs WebSocket."
        />


        <SuperAdminKpiCard
          label="Migrations"
          value={
            migrations.available
              ? formatNumber(
                  migrations.count,
                )
              : "N/D"
          }
          detail={
            migrations.latestVersion
              ? `Dernière : ${migrations.latestVersion}`
              : "Historique Supabase indisponible"
          }
        />


        <SuperAdminKpiCard
          label="Dernier reset stats"
          value={
            database.statsResetAt
              ? dateTime(
                  database.statsResetAt,
                )
              : "N/D"
          }
        />

      </section>


      <div className="grid gap-6 xl:grid-cols-2">

        <SuperAdminPanel
          title="PostgreSQL"
          subtitle="Structure et activité de la base"
        >

          <div className="grid gap-4 sm:grid-cols-2">

            <div className="border border-[#272a31] p-4">

              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-zinc-600">
                Transactions validées
              </p>

              <p className="mt-2 text-xl font-black text-white">
                {formatNumber(
                  database.transactionsCommitted,
                )}
              </p>

            </div>


            <div className="border border-[#272a31] p-4">

              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-zinc-600">
                Transactions rollback
              </p>

              <p className="mt-2 text-xl font-black text-white">
                {formatNumber(
                  database.transactionsRolledBack,
                )}
              </p>

            </div>


            <div className="border border-[#272a31] p-4">

              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-zinc-600">
                Index public
              </p>

              <p className="mt-2 text-xl font-black text-white">
                {formatNumber(
                  database.publicIndexes,
                )}
              </p>

            </div>


            <div className="border border-[#272a31] p-4">

              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-zinc-600">
                Extensions PostgreSQL
              </p>

              <p className="mt-2 text-xl font-black text-white">
                {formatNumber(
                  database.extensions,
                )}
              </p>

            </div>

          </div>

        </SuperAdminPanel>


        <SuperAdminPanel
          title="Auth Supabase"
          subtitle="Comptes et connexions réellement observables"
        >

          {auth.available ? (

            <div className="space-y-4">

              <div className="flex items-center justify-between border-b border-[#272a31] pb-3">

                <span className="text-xs text-zinc-500">
                  Total comptes
                </span>

                <strong className="text-sm text-white">
                  {formatNumber(
                    auth.totalUsers,
                  )}
                </strong>

              </div>


              <div className="flex items-center justify-between border-b border-[#272a31] pb-3">

                <span className="text-xs text-zinc-500">
                  Nouveaux sur la période
                </span>

                <strong className="text-sm text-white">
                  {formatNumber(
                    auth.newUsersPeriod,
                  )}
                </strong>

              </div>


              <div className="flex items-center justify-between border-b border-[#272a31] pb-3">

                <span className="text-xs text-zinc-500">
                  Comptes dont le dernier sign-in tombe dans la période
                </span>

                <strong className="text-sm text-white">
                  {formatNumber(
                    auth.signInsPeriod,
                  )}
                </strong>

              </div>


              <div className="flex items-center justify-between gap-4">

                <span className="text-xs text-zinc-500">
                  Dernier sign-in
                </span>

                <strong className="text-right text-xs text-white">
                  {dateTime(
                    auth.lastSignInAt,
                  )}
                </strong>

              </div>

            </div>

          ) : (

            <p className="py-8 text-center text-sm text-zinc-600">
              Les métriques Auth ne sont pas accessibles depuis cette installation.
            </p>

          )}

        </SuperAdminPanel>

      </div>


      <div className="grid gap-6 xl:grid-cols-2">

        <SuperAdminPanel
          title="Tables les plus volumineuses"
          subtitle="Taille totale relation + index"
        >

          <div className="space-y-3">

            {database.topTables.map(
              (
                table,
                index,
              ) => (

                <div
                  key={`${table.name}-${index}`}
                  className="flex items-center justify-between gap-4 border-b border-[#272a31] pb-3 last:border-b-0"
                >

                  <div className="min-w-0">

                    <p className="truncate text-xs font-bold text-zinc-300">
                      {table.name}
                    </p>

                    <p className="mt-1 text-[9px] text-zinc-700">
                      ~ {formatNumber(
                        table.estimatedRows,
                      )} ligne(s) estimée(s)
                    </p>

                  </div>


                  <strong className="shrink-0 text-xs text-white">
                    {formatBytes(
                      table.totalBytes,
                    )}
                  </strong>

                </div>

              ),
            )}

          </div>

        </SuperAdminPanel>


        <SuperAdminPanel
          title="Storage par bucket"
          subtitle="Objets et volume réellement observés"
        >

          {storage.available &&
           storage.topBuckets.length >
            0 ? (

            <div className="space-y-3">

              {storage.topBuckets.map(
                (
                  bucket,
                ) => (

                  <div
                    key={
                      bucket.bucketId
                    }
                    className="flex items-center justify-between gap-4 border-b border-[#272a31] pb-3 last:border-b-0"
                  >

                    <div className="min-w-0">

                      <p className="truncate text-xs font-bold text-zinc-300">
                        {bucket.bucketId}
                      </p>

                      <p className="mt-1 text-[9px] text-zinc-700">
                        {formatNumber(
                          bucket.objects,
                        )} objet(s)
                      </p>

                    </div>


                    <strong className="shrink-0 text-xs text-white">
                      {formatBytes(
                        bucket.bytes,
                      )}
                    </strong>

                  </div>

                ),
              )}

            </div>

          ) : (

            <p className="py-8 text-center text-sm text-zinc-600">
              {storage.available
                ? "Aucun objet Storage enregistré."
                : "Source Storage non disponible."}
            </p>

          )}

        </SuperAdminPanel>

      </div>


      <SuperAdminPanel
        title="Historique des observations PostgreSQL"
        subtitle="Un maximum d’un snapshot par heure et par période Analytics"
      >

        {system.history.length >
        0 ? (

          <div className="overflow-x-auto">

            <table className="w-full min-w-[900px] text-left">

              <thead>

                <tr className="border-b border-[#272a31] text-[9px] font-black uppercase tracking-[0.12em] text-zinc-700">

                  <th className="pb-3 pr-4">
                    Observation
                  </th>

                  <th className="pb-3 pr-4">
                    DB
                  </th>

                  <th className="pb-3 pr-4">
                    Connexions
                  </th>

                  <th className="pb-3 pr-4">
                    Cache
                  </th>

                  <th className="pb-3 pr-4">
                    Rollback
                  </th>

                  <th className="pb-3 pr-4">
                    RPC
                  </th>

                  <th className="pb-3">
                    Storage
                  </th>

                </tr>

              </thead>


              <tbody>

                {system.history.map(
                  (
                    item,
                    index,
                  ) => (

                    <tr
                      key={`${item.capturedAt}-${index}`}
                      className="border-b border-[#202329] text-xs last:border-b-0"
                    >

                      <td className="py-3 pr-4 text-zinc-500">
                        {dateTime(
                          item.capturedAt,
                        )}
                      </td>

                      <td className="py-3 pr-4 font-bold text-zinc-300">
                        {formatBytes(
                          item.databaseSizeBytes,
                        )}
                      </td>

                      <td className="py-3 pr-4 text-zinc-400">
                        {formatNumber(
                          item.databaseConnections,
                        )}
                        {" · "}
                        {formatNumber(
                          item.activeConnections,
                        )} act.
                      </td>

                      <td className="py-3 pr-4 text-zinc-400">
                        {formatPercent(
                          item.cacheHitRate,
                        )}
                      </td>

                      <td className="py-3 pr-4 text-zinc-400">
                        {formatPercent(
                          item.rollbackRate,
                        )}
                      </td>

                      <td className="py-3 pr-4 text-zinc-400">
                        {item.clientRpcLatencyMs ===
                        null
                          ? "N/D"
                          : `${Math.round(
                              item.clientRpcLatencyMs,
                            ).toLocaleString(
                              "fr-FR",
                            )} ms`}
                      </td>

                      <td className="py-3 text-zinc-400">
                        {item.storageAvailable
                          ? formatBytes(
                              item.storageBytes,
                            )
                          : "N/D"}
                      </td>

                    </tr>

                  ),
                )}

              </tbody>

            </table>

          </div>

        ) : (

          <div className="py-10 text-center">

            <p className="text-sm font-bold text-zinc-500">
              Historique en cours de constitution
            </p>

          </div>

        )}

      </SuperAdminPanel>


      <SuperAdminPanel
        title="Couverture du monitoring"
        subtitle="Ce qui est réellement mesuré et ce qui nécessite encore une source"
      >

        <div>

          <CoverageRow
            label="PostgreSQL"
            available={
              coverage.databaseMetrics
            }
            detail="Taille, connexions, cache, transactions, rollback, deadlocks, tables et uptime PostgreSQL."
          />


          <CoverageRow
            label="Supabase Auth"
            available={
              coverage.authMetrics
            }
            detail="Comptes, nouveaux comptes et comptes dont le dernier sign-in appartient à la période."
          />


          <CoverageRow
            label="Supabase Storage"
            available={
              coverage.storageMetrics
            }
            detail="Buckets, nombre d’objets et volume."
          />


          <CoverageRow
            label="Latence RPC Supabase"
            available={
              coverage.supabaseRpcLatency
            }
            detail="Temps aller-retour navigateur Control Center → Supabase."
          />


          <CoverageRow
            label="Disponibilité HTTP production"
            available={
              httpMonitoringMeasured
            }
            detail={
              httpMonitoringMeasured
                ? "Production Vercel sondée automatiquement depuis Supabase avec historique durable."
                : "Infrastructure présente mais aucune sonde exploitable n’a encore été observée."
            }
          />


          <CoverageRow
            label="Historique réseau HTTP"
            available={
              httpMonitoringMeasured
            }
            detail={
              httpMonitoringMeasured
                ? "Sondes périodiques stockées dans platform_http_uptime_checks."
                : "Historique externe non disponible."
            }
          />


          <CoverageRow
            label="Santé applicative complète"
            available={
              false
            }
            detail="La page publique répond, mais /api/health n’est pas encore déployé pour vérifier séparément les dépendances de l’application."
          />


          <CoverageRow
            label="Erreurs Runtime Vercel / Next.js"
            available={
              coverage.vercelErrors
            }
            detail="Nécessite une source de télémétrie applicative dédiée."
          />


          <CoverageRow
            label="Taux d’échec Auth"
            available={
              coverage.authFailureRate
            }
            detail="Nécessite l’instrumentation des tentatives de connexion ; prévu dans 3G-B."
          />


          <CoverageRow
            label="Connexions WebSocket Realtime"
            available={
              coverage.realtimeWebsocketConnections
            }
            detail={`Le système observe actuellement ${formatNumber(
              realtime.databaseBackends,
            )} backend(s) PostgreSQL identifiable(s), pas les sessions WebSocket clientes.`}
          />

        </div>

      </SuperAdminPanel>


      <div className="border border-[#30343c] bg-[#111318] p-5">

        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400">
          Règle de fiabilité
        </p>

        <p className="mt-3 max-w-6xl text-xs leading-5 text-zinc-600">
          L’uptime PostgreSQL et la disponibilité HTTP de la production sont deux mesures distinctes. PostgreSQL décrit la continuité de la base Supabase. La sonde HTTP prouve que la production Indesy répond depuis l’infrastructure Supabase. Aucun score synthétique ni état fictif n’est ajouté lorsque la source nécessaire n’existe pas.
        </p>

      </div>

    </div>
  );
}