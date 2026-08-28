"use client";

import {
  Activity,
  Clock3,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  ShieldX,
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
  useSuperAdminAuthObservability,
} from "../hooks/useSuperAdminAuthObservability";


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
        "medium",
    },
  );
}


function categoryLabel(
  category: string,
): string {

  const labels:
    Record<string, string> = {

      invalid_credentials:
        "Identifiants incorrects",

      email_not_confirmed:
        "Email non confirmé",

      user_banned:
        "Compte suspendu",

      rate_limited:
        "Limitation de débit",

      network_error:
        "Erreur réseau",

      service_error:
        "Erreur service Auth",

      validation_error:
        "Requête invalide",

      unknown:
        "Autre / inconnue",
    };


  return labels[
    category
  ] ??
    category;
}


function signedPercent(
  value: number | null,
): string {

  if (
    value === null
  ) {

    return "N/D";
  }


  const prefix =
    value >
    0
      ? "+"
      : "";


  return `${prefix}${value.toLocaleString(
    "fr-FR",
    {
      maximumFractionDigits:
        2,
    },
  )} %`;
}


export function SuperAdminAuthObservabilityFeature() {

  const {
    data,
    loading,
    error,
  } =
    useSuperAdminAuthObservability();


  if (loading) {

    return (
      <section className="border border-[#272a31] bg-[#111318] p-5">

        <p className="text-xs text-zinc-500">
          Chargement de Auth Observability...
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
          Auth Observability indisponible
        </p>

        <p className="mt-2 text-xs text-zinc-500">
          {error ??
            "Aucune donnée disponible."}
        </p>

      </section>
    );
  }


  const recentDays =
    [...data.daily]
      .reverse()
      .slice(
        0,
        14,
      );


  return (
    <section className="space-y-5 border-t border-[#30343c] pt-7">

      <header>

        <div className="flex items-center gap-2 text-[#2588ff]">

          <KeyRound
            size={16}
          />

          <p className="text-[10px] font-black uppercase tracking-[0.18em]">
            Auth Observability
          </p>

        </div>


        <h2 className="mt-2 text-xl font-black text-white">
          Connexions & fiabilité Auth
        </h2>


        <p className="mt-2 max-w-4xl text-xs leading-5 text-zinc-500">
          Télémétrie réelle produite par le point central de connexion Indesy. Aucun email, mot de passe, token, adresse IP ou User-Agent n’est conservé.
        </p>

      </header>


      {data.attempts ===
      0 && (

        <div className="border border-blue-500/25 bg-blue-500/5 p-5">

          <p className="text-xs font-black text-blue-400">
            Collecte prête
          </p>

          <p className="mt-2 text-xs leading-5 text-zinc-500">
            Aucun login postérieur à l’installation du Lot 3G-B n’a encore été observé. L’historique commence au prochain essai de connexion ; aucune donnée passée n’est reconstruite.
          </p>

        </div>

      )}


      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">

        <SuperAdminKpiCard
          label="Tentatives Auth"
          value={
            formatNumber(
              data.attempts,
            )
          }
          detail={
            data.attemptGrowthPct ===
            null
              ? "Pas encore de comparaison exploitable."
              : `${signedPercent(
                  data.attemptGrowthPct,
                )} vs période précédente`
          }
        />


        <SuperAdminKpiCard
          label="Taux de réussite"
          value={
            percent(
              data.successRate,
            )
          }
          detail={`${formatNumber(
            data.successes,
          )} connexion(s) réussie(s)`}
        />


        <SuperAdminKpiCard
          label="Taux d’échec"
          value={
            percent(
              data.failureRate,
            )
          }
          detail={
            data.failureRateDelta ===
            null
              ? `${formatNumber(
                  data.failures,
                )} échec(s)`
              : `${signedPercent(
                  data.failureRateDelta,
                )} point(s) vs période précédente`
          }
        />


        <SuperAdminKpiCard
          label="Latence Auth P95"
          value={
            milliseconds(
              data.p95DurationMs,
            )
          }
          detail={
            data.p95DurationChangePct ===
            null
              ? "Temps de réponse signInWithPassword."
              : `${signedPercent(
                  data.p95DurationChangePct,
                )} vs période précédente`
          }
        />

      </div>


      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">

        <div className="border border-[#272a31] bg-[#111318] p-4">

          <Clock3
            size={16}
            className="text-[#2588ff]"
          />

          <p className="mt-3 text-[9px] font-black uppercase tracking-[0.12em] text-zinc-600">
            Latence moyenne
          </p>

          <p className="mt-2 text-lg font-black text-white">
            {milliseconds(
              data.averageDurationMs,
            )}
          </p>

        </div>


        <div className="border border-[#272a31] bg-[#111318] p-4">

          <ShieldCheck
            size={16}
            className="text-emerald-400"
          />

          <p className="mt-3 text-[9px] font-black uppercase tracking-[0.12em] text-zinc-600">
            Moyenne succès
          </p>

          <p className="mt-2 text-lg font-black text-white">
            {milliseconds(
              data.successAverageDurationMs,
            )}
          </p>

        </div>


        <div className="border border-[#272a31] bg-[#111318] p-4">

          <ShieldX
            size={16}
            className="text-red-400"
          />

          <p className="mt-3 text-[9px] font-black uppercase tracking-[0.12em] text-zinc-600">
            Moyenne échecs
          </p>

          <p className="mt-2 text-lg font-black text-white">
            {milliseconds(
              data.failureAverageDurationMs,
            )}
          </p>

        </div>


        <div className="border border-[#272a31] bg-[#111318] p-4">

          <Activity
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
          title="Causes des échecs"
          subtitle="Catégories normalisées — aucun message Auth brut n’est stocké"
        >

          {data.errorCategories.length ===
          0 ? (

            <div className="py-10 text-center">

              <ShieldCheck
                size={22}
                className="mx-auto text-emerald-400"
              />

              <p className="mt-3 text-sm font-bold text-zinc-400">
                Aucun échec observé
              </p>

            </div>

          ) : (

            <div className="space-y-3">

              {data.errorCategories.map(
                (
                  item,
                ) => (

                  <div
                    key={
                      item.category
                    }
                    className="border-b border-[#272a31] pb-3 last:border-b-0"
                  >

                    <div className="flex items-center justify-between gap-4">

                      <span className="text-xs font-bold text-zinc-300">
                        {categoryLabel(
                          item.category,
                        )}
                      </span>

                      <strong className="text-xs text-white">
                        {formatNumber(
                          item.count,
                        )}
                      </strong>

                    </div>


                    <div className="mt-2 h-1.5 overflow-hidden bg-[#1b1e24]">

                      <div
                        className="h-full bg-red-500/70"
                        style={{
                          width:
                            `${Math.min(
                              100,
                              Math.max(
                                0,
                                item.share ??
                                  0,
                              ),
                            )}%`,
                        }}
                      />

                    </div>


                    <p className="mt-1 text-[9px] text-zinc-700">
                      {percent(
                        item.share,
                      )}
                    </p>

                  </div>

                ),
              )}

            </div>

          )}

        </SuperAdminPanel>


        <SuperAdminPanel
          title="Dernières tentatives"
          subtitle="Événements anonymisés"
        >

          {data.recentEvents.length ===
          0 ? (

            <p className="py-10 text-center text-sm text-zinc-600">
              Aucun événement Auth observé.
            </p>

          ) : (

            <div className="space-y-2">

              {data.recentEvents.map(
                (
                  event,
                  index,
                ) => (

                  <div
                    key={`${event.observedAt}-${index}`}
                    className="flex items-center justify-between gap-4 border-b border-[#272a31] py-2 last:border-b-0"
                  >

                    <div className="flex items-center gap-3">

                      {event.outcome ===
                      "success" ? (

                        <ShieldCheck
                          size={14}
                          className="text-emerald-400"
                        />

                      ) : (

                        <ShieldX
                          size={14}
                          className="text-red-400"
                        />

                      )}


                      <div>

                        <p
                          className={
                            event.outcome ===
                            "success"
                              ? "text-xs font-bold text-emerald-400"
                              : "text-xs font-bold text-red-400"
                          }
                        >
                          {event.outcome ===
                          "success"
                            ? "Connexion réussie"
                            : categoryLabel(
                                event.errorCategory ??
                                  "unknown",
                              )}
                        </p>

                        <p className="mt-1 text-[9px] text-zinc-700">
                          {dateTime(
                            event.observedAt,
                          )}
                        </p>

                      </div>

                    </div>


                    <strong className="text-xs text-zinc-300">
                      {milliseconds(
                        event.durationMs,
                      )}
                    </strong>

                  </div>

                ),
              )}

            </div>

          )}

        </SuperAdminPanel>

      </div>


      <SuperAdminPanel
        title="Historique quotidien"
        subtitle="14 derniers jours contenant au moins une tentative"
      >

        {recentDays.length ===
        0 ? (

          <p className="py-8 text-center text-sm text-zinc-600">
            Historique en cours de constitution.
          </p>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full min-w-[760px] text-left">

              <thead>

                <tr className="border-b border-[#272a31] text-[9px] font-black uppercase tracking-[0.12em] text-zinc-700">

                  <th className="pb-3 pr-4">
                    Jour
                  </th>

                  <th className="pb-3 pr-4">
                    Tentatives
                  </th>

                  <th className="pb-3 pr-4">
                    Succès
                  </th>

                  <th className="pb-3 pr-4">
                    Échecs
                  </th>

                  <th className="pb-3 pr-4">
                    Échec %
                  </th>

                  <th className="pb-3">
                    P95
                  </th>

                </tr>

              </thead>


              <tbody>

                {recentDays.map(
                  (
                    item,
                  ) => (

                    <tr
                      key={
                        item.day
                      }
                      className="border-b border-[#202329] text-xs last:border-b-0"
                    >

                      <td className="py-3 pr-4 font-bold text-zinc-300">
                        {item.day}
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

                      <td className="py-3 pr-4 text-zinc-400">
                        {percent(
                          item.failureRate,
                        )}
                      </td>

                      <td className="py-3 text-zinc-400">
                        {milliseconds(
                          item.p95DurationMs,
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

            <LockKeyhole
              size={15}
              className="text-emerald-400"
            />

            <p className="text-[10px] font-black uppercase tracking-[0.13em] text-emerald-400">
              Privacy by design
            </p>

          </div>


          <p className="mt-3 text-xs leading-5 text-zinc-500">
            La télémétrie ne conserve ni identité utilisateur, ni email, ni mot de passe, ni token, ni adresse IP, ni User-Agent.
          </p>

        </div>


        <div className="border border-amber-500/20 bg-amber-500/5 p-5">

          <p className="text-[10px] font-black uppercase tracking-[0.13em] text-amber-400">
            Périmètre de confiance
          </p>

          <p className="mt-3 text-xs leading-5 text-zinc-500">
            Le taux d’échec est une mesure applicative observée au point central de connexion Indesy. Il ne remplace pas les journaux forensiques du serveur Supabase Auth. L’ingestion anonyme est plafonnée afin de limiter la pollution volontaire des métriques.
          </p>

        </div>

      </div>

    </section>
  );
}