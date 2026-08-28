"use client";

import {
  Activity,
  CircleCheck,
  CircleX,
  Clock3,
  Radio,
  RotateCcw,
  ShieldCheck,
  TimerOff,
} from "lucide-react";

import {
  SuperAdminKpiCard,
} from "../components/SuperAdminKpiCard";

import {
  SuperAdminPanel,
} from "../components/SuperAdminStates";

import {
  formatNumber,
} from "../components/formatters";

import {
  useSuperAdminRealtimeObservability,
} from "../hooks/useSuperAdminRealtimeObservability";


function percent(
  value: number | null,
): string {

  if (
    value === null
  ) {

    return "N/D";
  }


  return `${value.toLocaleString(
    "fr-FR",
    {
      maximumFractionDigits:
        2,
    },
  )} %`;
}


function milliseconds(
  value: number | null,
): string {

  if (
    value === null
  ) {

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
        maximumFractionDigits:
          2,
      },
    )} s`;
  }


  return `${Math.round(
    value,
  ).toLocaleString(
    "fr-FR",
  )} ms`;
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


function domainLabel(
  domain: string,
): string {

  if (
    domain ===
    "communication"
  ) {

    return "Communication";
  }


  if (
    domain ===
    "fight_live"
  ) {

    return "Fight Live";
  }


  return domain;
}


function channelLabel(
  channel: string,
): string {

  const labels:
    Record<string, string> = {

      messages:
        "Messages",

      message_reads:
        "Lectures messages",

      conversations:
        "Conversations",

      system_notifications:
        "Notifications",

      fight_proposals:
        "Propositions combat",

      sponsor_offers:
        "Offres sponsor",

      fight_events:
        "Événements combat",

      timer:
        "Chronomètre",

      scores:
        "Scores",

      status:
        "Statut combat",

      result:
        "Résultat",
    };


  return labels[
    channel
  ] ??
    channel;
}


function statusLabel(
  status: string,
  intentional: boolean,
): string {

  if (
    status ===
    "SUBSCRIBED"
  ) {

    return "Abonné";
  }


  if (
    status ===
    "CHANNEL_ERROR"
  ) {

    return "Erreur canal";
  }


  if (
    status ===
    "TIMED_OUT"
  ) {

    return "Timeout";
  }


  if (
    status ===
      "CLOSED" &&
    intentional
  ) {

    return "Fermeture normale";
  }


  if (
    status ===
    "CLOSED"
  ) {

    return "Fermeture inattendue";
  }


  return status;
}


export function SuperAdminRealtimeObservabilityFeature() {

  const {
    data,
    loading,
    error,
  } =
    useSuperAdminRealtimeObservability();


  if (loading) {

    return (
      <section className="border border-[#272a31] bg-[#111318] p-5">

        <p className="text-xs text-zinc-500">
          Chargement de Realtime Observability...
        </p>

      </section>
    );
  }


  if (
    error ||
    !data
  ) {

    return (
      <section className="border border-amber-500/25 bg-amber-500/5 p-5">

        <p className="text-xs font-black uppercase tracking-[0.12em] text-amber-400">
          Realtime Observability indisponible
        </p>

        <p className="mt-2 text-xs text-zinc-500">
          {error ??
            "Aucune donnée disponible."}
        </p>

      </section>
    );
  }


  return (
    <section className="space-y-6">

      <header>

        <div className="flex items-center gap-2 text-[#2588ff]">

          <Radio
            size={16}
          />

          <p className="text-[10px] font-black uppercase tracking-[0.18em]">
            Realtime Observability
          </p>

        </div>


        <h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
          Supabase Realtime
        </h1>


        <p className="mt-2 max-w-4xl text-sm text-zinc-500">
          Observation réelle du cycle de vie des canaux Communication et Fight Live. Les métriques proviennent directement des états retournés par les abonnements Supabase Realtime.
        </p>

      </header>


      {data.subscriptionAttempts ===
      0 && (

        <div className="border border-blue-500/25 bg-blue-500/5 p-5">

          <p className="text-xs font-black text-blue-400">
            Collecte prête
          </p>

          <p className="mt-2 text-xs leading-5 text-zinc-500">
            Aucun canal Communication ou Fight Live n’a encore été ouvert depuis l’installation de 3G-C1. Aucun historique antérieur n’est reconstruit.
          </p>

        </div>

      )}


      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">

        <SuperAdminKpiCard
          label="Abonnements observés"
          value={
            formatNumber(
              data.subscriptionAttempts,
            )
          }
          detail={`${formatNumber(
            data.successfulSubscriptions,
          )} réussi(s) · ${formatNumber(
            data.failedSubscriptions,
          )} échec(s)`}
        />


        <SuperAdminKpiCard
          label="Succès abonnement"
          value={
            percent(
              data.subscriptionSuccessRate,
            )
          }
          detail={
            data.subscriptionSuccessRateDelta ===
            null
              ? "Pas encore de comparaison exploitable."
              : `${data.subscriptionSuccessRateDelta >= 0 ? "+" : ""}${data.subscriptionSuccessRateDelta.toLocaleString(
                  "fr-FR",
                  {
                    maximumFractionDigits:
                      2,
                  },
                )} point(s) vs période précédente`
          }
        />


        <SuperAdminKpiCard
          label="Latence P95 abonnement"
          value={
            milliseconds(
              data.p95SubscriptionMs,
            )
          }
          detail={`Moyenne ${milliseconds(
            data.averageSubscriptionMs,
          )}`}
        />


        <SuperAdminKpiCard
          label="Incidents de canal"
          value={
            formatNumber(
              data.channelErrors +
              data.timeouts +
              data.unexpectedClosures,
            )
          }
          detail={`${formatNumber(
            data.channelErrors,
          )} erreur(s) · ${formatNumber(
            data.timeouts,
          )} timeout(s)`}
        />

      </div>


      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">

        <div className="border border-[#272a31] bg-[#111318] p-4">

          <CircleX
            size={16}
            className="text-red-400"
          />

          <p className="mt-3 text-[9px] font-black uppercase tracking-[0.12em] text-zinc-600">
            Fermetures inattendues
          </p>

          <p className="mt-2 text-xl font-black text-white">
            {formatNumber(
              data.unexpectedClosures,
            )}
          </p>

        </div>


        <div className="border border-[#272a31] bg-[#111318] p-4">

          <TimerOff
            size={16}
            className="text-amber-400"
          />

          <p className="mt-3 text-[9px] font-black uppercase tracking-[0.12em] text-zinc-600">
            Timeouts
          </p>

          <p className="mt-2 text-xl font-black text-white">
            {formatNumber(
              data.timeouts,
            )}
          </p>

        </div>


        <div className="border border-[#272a31] bg-[#111318] p-4">

          <RotateCcw
            size={16}
            className="text-[#2588ff]"
          />

          <p className="mt-3 text-[9px] font-black uppercase tracking-[0.12em] text-zinc-600">
            Réabonnements
          </p>

          <p className="mt-2 text-xl font-black text-white">
            {formatNumber(
              data.reconnections,
            )}
          </p>

        </div>


        <div className="border border-[#272a31] bg-[#111318] p-4">

          <Clock3
            size={16}
            className="text-zinc-400"
          />

          <p className="mt-3 text-[9px] font-black uppercase tracking-[0.12em] text-zinc-600">
            Début couverture
          </p>

          <p className="mt-2 text-xs font-black text-white">
            {dateTime(
              data.coverageStartedAt,
            )}
          </p>

        </div>

      </div>


      <div className="grid gap-6 xl:grid-cols-2">

        <SuperAdminPanel
          title="Domaines Realtime"
          subtitle="Communication et Fight Live"
        >

          {data.domainBreakdown.length ===
          0 ? (

            <p className="py-8 text-center text-sm text-zinc-600">
              Aucun domaine encore observé.
            </p>

          ) : (

            <div className="space-y-4">

              {data.domainBreakdown.map(
                (
                  item,
                ) => (

                  <div
                    key={
                      item.domain
                    }
                    className="border-b border-[#272a31] pb-4 last:border-b-0"
                  >

                    <div className="flex items-center justify-between gap-4">

                      <div>

                        <p className="text-xs font-black text-zinc-200">
                          {domainLabel(
                            item.domain,
                          )}
                        </p>

                        <p className="mt-1 text-[10px] text-zinc-600">
                          {formatNumber(
                            item.attempts,
                          )} abonnement(s)
                        </p>

                      </div>


                      <strong className="text-sm text-white">
                        {percent(
                          item.successRate,
                        )}
                      </strong>

                    </div>


                    <div className="mt-3 grid grid-cols-3 gap-2 text-center">

                      <div className="border border-[#242832] p-2">

                        <p className="text-sm font-black text-red-400">
                          {formatNumber(
                            item.channelErrors,
                          )}
                        </p>

                        <p className="mt-1 text-[8px] uppercase text-zinc-700">
                          Erreurs
                        </p>

                      </div>


                      <div className="border border-[#242832] p-2">

                        <p className="text-sm font-black text-amber-400">
                          {formatNumber(
                            item.timeouts,
                          )}
                        </p>

                        <p className="mt-1 text-[8px] uppercase text-zinc-700">
                          Timeouts
                        </p>

                      </div>


                      <div className="border border-[#242832] p-2">

                        <p className="text-sm font-black text-zinc-300">
                          {milliseconds(
                            item.p95SubscriptionMs,
                          )}
                        </p>

                        <p className="mt-1 text-[8px] uppercase text-zinc-700">
                          P95
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
          title="État récent"
          subtitle="Dernières observations Supabase Realtime"
        >

          {data.recentEvents.length ===
          0 ? (

            <p className="py-8 text-center text-sm text-zinc-600">
              Aucun événement Realtime observé.
            </p>

          ) : (

            <div className="space-y-2">

              {data.recentEvents
                .slice(
                  0,
                  12,
                )
                .map(
                  (
                    event,
                    index,
                  ) => {

                    const healthy =
                      event.status ===
                      "SUBSCRIBED" ||
                      (
                        event.status ===
                          "CLOSED" &&
                        event.intentional
                      );


                    return (
                      <div
                        key={`${event.observedAt}-${index}`}
                        className="flex items-center justify-between gap-4 border-b border-[#272a31] py-2 last:border-b-0"
                      >

                        <div className="flex items-center gap-3">

                          {healthy ? (

                            <CircleCheck
                              size={14}
                              className="text-emerald-400"
                            />

                          ) : (

                            <CircleX
                              size={14}
                              className="text-red-400"
                            />

                          )}


                          <div>

                            <p className="text-xs font-bold text-zinc-300">
                              {domainLabel(
                                event.domain,
                              )}
                              {" · "}
                              {channelLabel(
                                event.channelKind,
                              )}
                            </p>

                            <p className="mt-1 text-[9px] text-zinc-700">
                              {statusLabel(
                                event.status,
                                event.intentional,
                              )}
                              {" · "}
                              {dateTime(
                                event.observedAt,
                              )}
                            </p>

                          </div>

                        </div>


                        <strong className="shrink-0 text-xs text-zinc-400">
                          {milliseconds(
                            event.durationMs,
                          )}
                        </strong>

                      </div>
                    );
                  },
                )}

            </div>

          )}

        </SuperAdminPanel>

      </div>


      <SuperAdminPanel
        title="Canaux observés"
        subtitle="Performance et incidents par type de canal"
      >

        {data.channelBreakdown.length ===
        0 ? (

          <p className="py-8 text-center text-sm text-zinc-600">
            Aucun canal observé.
          </p>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full min-w-[900px] text-left">

              <thead>

                <tr className="border-b border-[#272a31] text-[9px] font-black uppercase tracking-[0.12em] text-zinc-700">

                  <th className="pb-3 pr-4">
                    Domaine
                  </th>

                  <th className="pb-3 pr-4">
                    Canal
                  </th>

                  <th className="pb-3 pr-4">
                    Abonnements
                  </th>

                  <th className="pb-3 pr-4">
                    Succès
                  </th>

                  <th className="pb-3 pr-4">
                    Échecs
                  </th>

                  <th className="pb-3 pr-4">
                    Timeouts
                  </th>

                  <th className="pb-3 pr-4">
                    Fermetures inatt.
                  </th>

                  <th className="pb-3">
                    P95
                  </th>

                </tr>

              </thead>


              <tbody>

                {data.channelBreakdown.map(
                  (
                    item,
                  ) => (

                    <tr
                      key={`${item.domain}-${item.channelKind}`}
                      className="border-b border-[#202329] text-xs last:border-b-0"
                    >

                      <td className="py-3 pr-4 text-zinc-500">
                        {domainLabel(
                          item.domain,
                        )}
                      </td>

                      <td className="py-3 pr-4 font-bold text-zinc-300">
                        {channelLabel(
                          item.channelKind,
                        )}
                      </td>

                      <td className="py-3 pr-4 text-zinc-400">
                        {formatNumber(
                          item.attempts,
                        )}
                      </td>

                      <td className="py-3 pr-4 text-emerald-400">
                        {formatNumber(
                          item.successes,
                        )}
                      </td>

                      <td className="py-3 pr-4 text-red-400">
                        {formatNumber(
                          item.failures,
                        )}
                      </td>

                      <td className="py-3 pr-4 text-amber-400">
                        {formatNumber(
                          item.timeouts,
                        )}
                      </td>

                      <td className="py-3 pr-4 text-red-400">
                        {formatNumber(
                          item.unexpectedClosures,
                        )}
                      </td>

                      <td className="py-3 text-zinc-400">
                        {milliseconds(
                          item.p95SubscriptionMs,
                        )}
                      </td>

                    </tr>

                  ),
                )}

              </tbody>

            </table>

          </div>

        )}

      </SuperAdminPanel>


      <div className="grid gap-4 lg:grid-cols-2">

        <div className="border border-emerald-500/20 bg-emerald-500/5 p-5">

          <div className="flex items-center gap-2">

            <ShieldCheck
              size={15}
              className="text-emerald-400"
            />

            <p className="text-[10px] font-black uppercase tracking-[0.13em] text-emerald-400">
              Périmètre réellement instrumenté
            </p>

          </div>


          <p className="mt-3 text-xs leading-5 text-zinc-500">
            Communication et Fight Live sont observés directement depuis leurs repositories Supabase Realtime. Les identifiants métier et payloads ne sont pas enregistrés.
          </p>

        </div>


        <div className="border border-amber-500/20 bg-amber-500/5 p-5">

          <div className="flex items-center gap-2">

            <Activity
              size={15}
              className="text-amber-400"
            />

            <p className="text-[10px] font-black uppercase tracking-[0.13em] text-amber-400">
              Ce que cette mesure n’est pas
            </p>

          </div>


          <p className="mt-3 text-xs leading-5 text-zinc-500">
            Ce tableau n’est pas un compteur global des WebSockets Supabase et ne représente pas le nombre d’utilisateurs actuellement connectés. Presence n’est pas encore utilisé dans l’application. Breaking News reste également hors du périmètre de 3G-C1.
          </p>

        </div>

      </div>

    </section>
  );
}