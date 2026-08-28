"use client";

import {
  Activity,
  CircleCheck,
  CircleX,
  Clock3,
  Globe2,
  Radio,
} from "lucide-react";

import {
  SuperAdminKpiCard,
} from "./SuperAdminKpiCard";

import {
  SuperAdminPanel,
} from "./SuperAdminStates";

import {
  formatNumber,
} from "./formatters";

import type {
  SuperAdminHttpUptimeAnalytics,
  SuperAdminHttpUptimeStatus,
} from "../http-uptime.types";


function formatPercentPrecise(
  value: number | null,
): string {

  if (value === null) {
    return "N/D";
  }


  return `${value.toLocaleString(
    "fr-FR",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3,
    },
  )} %`;
}


function formatLatency(
  value: number | null,
): string {

  if (value === null) {
    return "N/D";
  }


  if (
    value >=
    1000
  ) {

    return `${(
      value /
      1000
    ).toLocaleString(
      "fr-FR",
      {
        maximumFractionDigits: 2,
      },
    )} s`;
  }


  return `${Math.round(
    value,
  ).toLocaleString(
    "fr-FR",
  )} ms`;
}


function formatDateTime(
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


function formatDuration(
  seconds: number,
): string {

  if (
    seconds <
    60
  ) {
    return `${seconds} s`;
  }


  const minutes =
    Math.floor(
      seconds /
      60,
    );


  if (
    minutes <
    60
  ) {
    return `${minutes} min`;
  }


  const hours =
    Math.floor(
      minutes /
      60,
    );


  if (
    hours <
    24
  ) {

    return `${hours} h ${minutes % 60} min`;
  }


  const days =
    Math.floor(
      hours /
      24,
    );


  return `${days} j ${hours % 24} h`;
}


function statusLabel(
  status: SuperAdminHttpUptimeStatus,
): string {

  switch (
    status
  ) {

    case "up":
      return "Disponible";

    case "down":
      return "Indisponible";

    default:
      return "En attente";
  }
}


function statusClasses(
  status: SuperAdminHttpUptimeStatus,
): string {

  switch (
    status
  ) {

    case "up":
      return "border-emerald-500/25 bg-emerald-500/5 text-emerald-400";

    case "down":
      return "border-red-500/25 bg-red-500/5 text-red-400";

    default:
      return "border-zinc-700 bg-zinc-900 text-zinc-500";
  }
}


export function SuperAdminHttpUptimePanel({
  data,
  loading,
  error,
}: {
  data:
    SuperAdminHttpUptimeAnalytics | null;

  loading:
    boolean;

  error:
    string | null;
}) {

  if (loading) {

    return (
      <div className="border border-[#272a31] bg-[#111318] p-5">

        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <Radio
            size={15}
            className="animate-pulse"
          />

          Lecture du monitoring HTTP production...
        </div>

      </div>
    );
  }


  if (
    error
  ) {

    return (
      <div className="border border-amber-500/25 bg-amber-500/5 p-5">

        <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-400">
          Monitoring HTTP temporairement indisponible
        </p>

        <p className="mt-2 text-xs text-zinc-500">
          {error}
        </p>

      </div>
    );
  }


  if (!data) {
    return null;
  }


  const latest =
    data.latest;


  const matureSample =
    data.totalChecks >=
    20;


  return (
    <section className="space-y-4">

      <div className="flex flex-col gap-4 border border-[#272a31] bg-[#111318] p-5 lg:flex-row lg:items-center lg:justify-between">

        <div className="flex min-w-0 items-start gap-3">

          <div className="border border-[#30343c] bg-[#16191f] p-2.5 text-[#2588ff]">
            <Globe2
              size={18}
            />
          </div>


          <div className="min-w-0">

            <p className="text-[10px] font-black uppercase tracking-[0.17em] text-[#2588ff]">
              Production HTTP Observatory
            </p>

            <p className="mt-1 text-sm font-black text-white">
              Production Vercel observée depuis Supabase
            </p>


            {data.targetUrl && (

              <p className="mt-1 truncate font-mono text-[10px] text-zinc-600">
                {data.targetUrl}
              </p>

            )}

          </div>

        </div>


        <div className="flex flex-wrap items-center gap-2">

          <span
            className={[
              "border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em]",
              latest
                ? statusClasses(
                    latest.status,
                  )
                : statusClasses(
                    "pending",
                  ),
            ].join(
              " ",
            )}
          >
            {latest
              ? statusLabel(
                  latest.status,
                )
              : "Aucune sonde"}
          </span>


          <span className="border border-[#30343c] bg-[#16191f] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.1em] text-zinc-500">
            toutes les {data.intervalMinutes} min
          </span>

        </div>

      </div>


      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">

        <SuperAdminKpiCard
          label="Disponibilité HTTP"
          value={
            formatPercentPrecise(
              data.uptimeRate,
            )
          }
          detail={`${formatNumber(
            data.healthyChecks,
          )} succès / ${formatNumber(
            data.totalChecks,
          )} sondes terminées`}
        />


        <SuperAdminKpiCard
          label="Latence moyenne"
          value={
            formatLatency(
              data.averageResponseMs,
            )
          }
          detail="Temps de réponse observé depuis Supabase."
        />


        <SuperAdminKpiCard
          label="Latence P95"
          value={
            formatLatency(
              data.p95ResponseMs,
            )
          }
          detail={
            matureSample
              ? "95 % des sondes se situent sous cette valeur."
              : "Échantillon encore jeune : le P95 se stabilisera avec davantage de sondes."
          }
        />


        <SuperAdminKpiCard
          label="Dernière sonde"
          value={
            latest
              ? statusLabel(
                  latest.status,
                )
              : "N/D"
          }
          detail={
            latest
              ? `${formatDateTime(
                  latest.checkedAt,
                )} · ${formatLatency(
                  latest.responseMs,
                )}`
              : "Aucune observation enregistrée."
          }
        />

      </div>


      {data.activeIncident && (

        <div className="border border-red-500/30 bg-red-500/5 p-5">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-start gap-3">

              <CircleX
                size={18}
                className="mt-0.5 shrink-0 text-red-400"
              />


              <div>

                <p className="text-xs font-black uppercase tracking-[0.13em] text-red-400">
                  Incident HTTP actif
                </p>

                <p className="mt-2 text-xs leading-5 text-zinc-500">
                  La production n’a pas répondu correctement à une ou plusieurs sondes externes.
                </p>

              </div>

            </div>


            <div className="text-left sm:text-right">

              <p className="text-lg font-black text-red-300">
                {formatDuration(
                  data.activeIncident.durationSeconds,
                )}
              </p>

              <p className="mt-1 text-[10px] text-zinc-600">
                {formatNumber(
                  data.activeIncident.failureCount,
                )} échec(s)
              </p>

            </div>

          </div>

        </div>

      )}


      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">

        <SuperAdminPanel
          title="Dernières sondes HTTP"
          subtitle="Observations conservées indépendamment de Vercel"
        >

          {data.recentChecks.length ===
          0 ? (

            <div className="py-10 text-center text-sm text-zinc-600">
              Aucune sonde terminée.
            </div>

          ) : (

            <div className="space-y-1">

              {data.recentChecks.map(
                (
                  check,
                  index,
                ) => (

                  <div
                    key={`${check.checkedAt}-${index}`}
                    className="flex flex-col gap-3 border-b border-[#24272e] py-3 first:pt-0 last:border-b-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                  >

                    <div className="flex items-center gap-3">

                      {check.status ===
                      "up" ? (

                        <CircleCheck
                          size={15}
                          className="shrink-0 text-emerald-400"
                        />

                      ) : (

                        <CircleX
                          size={15}
                          className="shrink-0 text-red-400"
                        />

                      )}


                      <div>

                        <p className="text-xs font-bold text-zinc-300">
                          {statusLabel(
                            check.status,
                          )}
                        </p>

                        <p className="mt-1 text-[9px] text-zinc-700">
                          {formatDateTime(
                            check.checkedAt,
                          )}
                        </p>

                      </div>

                    </div>


                    <div className="flex items-center gap-5 sm:text-right">

                      <div>

                        <p className="text-xs font-black text-white">
                          HTTP {check.httpStatus ?? "N/D"}
                        </p>

                        {check.errorCode && (

                          <p className="mt-1 text-[9px] text-red-400">
                            {check.errorCode}
                          </p>

                        )}

                      </div>


                      <div className="min-w-[76px]">

                        <p className="text-xs font-black text-zinc-300">
                          {formatLatency(
                            check.responseMs,
                          )}
                        </p>

                        <p className="mt-1 text-[9px] text-zinc-700">
                          latence
                        </p>

                      </div>

                    </div>

                  </div>

                ),
              )}

            </div>

          )}

        </SuperAdminPanel>


        <SuperAdminPanel
          title="Couverture HTTP"
          subtitle="Périmètre exact de la mesure"
        >

          <div className="space-y-4">

            <div className="flex items-start gap-3">

              <Activity
                size={16}
                className="mt-0.5 shrink-0 text-emerald-400"
              />

              <div>

                <p className="text-xs font-bold text-zinc-300">
                  Joignabilité réelle
                </p>

                <p className="mt-1 text-[10px] leading-4 text-zinc-600">
                  Supabase effectue réellement une requête HTTP vers la production Vercel.
                </p>

              </div>

            </div>


            <div className="flex items-start gap-3">

              <Clock3
                size={16}
                className="mt-0.5 shrink-0 text-[#2588ff]"
              />

              <div>

                <p className="text-xs font-bold text-zinc-300">
                  Historique autonome
                </p>

                <p className="mt-1 text-[10px] leading-4 text-zinc-600">
                  Les sondes sont exécutées automatiquement par pg_cron et stockées dans Supabase.
                </p>

              </div>

            </div>


            <div className="border-t border-[#272a31] pt-4">

              <p className="text-[10px] leading-5 text-zinc-600">
                Cette mesure prouve que la page publique répond correctement en HTTP. Elle ne prouve pas encore séparément la santé des dépendances internes de Next.js, ni les erreurs Runtime Vercel.
              </p>

            </div>


            <div className="border-t border-[#272a31] pt-4">

              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-zinc-700">
                Historique depuis
              </p>

              <p className="mt-2 text-xs font-bold text-zinc-400">
                {formatDateTime(
                  data.coverageStartedAt,
                )}
              </p>

            </div>

          </div>

        </SuperAdminPanel>

      </div>

    </section>
  );
}