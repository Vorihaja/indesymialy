"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
} from "lucide-react";

import {
  SuperAdminKpiCard,
} from "../components/SuperAdminKpiCard";

import {
  SuperAdminPerformanceHistoryChart,
} from "../components/SuperAdminPerformanceHistoryChart";

import {
  SuperAdminStrategicTargetBar,
} from "../components/SuperAdminStrategicTargetBar";

import type {
  StrategicTargetDraft,
} from "../components/SuperAdminStrategicTargetBar";

import {
  SuperAdminErrorState,
  SuperAdminLoadingState,
  SuperAdminPanel,
} from "../components/SuperAdminStates";

import {
  formatNumber,
} from "../components/formatters";

import {
  useSuperAdminPeriod,
} from "../context/super-admin-period-context";

import {
  useSaveSuperAdminPerformanceTargets,
} from "../hooks/useSaveSuperAdminPerformanceTargets";

import {
  useSuperAdminPerformanceAnalytics,
} from "../hooks/useSuperAdminPerformanceAnalytics";

import {
  useSuperAdminPerformanceMonitoring,
} from "../hooks/useSuperAdminPerformanceMonitoring";

import {
  useSuperAdminPerformanceTargets,
} from "../hooks/useSuperAdminPerformanceTargets";

import type {
  SuperAdminKpiTargetConfiguration,
  SuperAdminKpiTargetUpdate,
} from "../performance-target.types";

import type {
  SuperAdminPerformanceMetric,
  SuperAdminPerformanceStatus,
} from "../performance.types";

import type {
  SuperAdminPerformanceTrend,
  SuperAdminStrategicStatus,
} from "../performance-monitoring.types";


interface MetricSignal {
  metric:
    SuperAdminPerformanceMetric;

  configuration:
    SuperAdminKpiTargetConfiguration | null;

  previousValue:
    number | null;

  delta:
    number | null;

  trend:
    SuperAdminPerformanceTrend;

  strategicStatus:
    SuperAdminStrategicStatus;
}


function statusLabel(
  status:
    SuperAdminPerformanceStatus,
): string {

  switch (
    status
  ) {

    case "achieved":
      return "Objectif atteint";

    case "watch":
      return "À surveiller";

    case "critical":
      return "Sous objectif";

    case "not_configured":
      return "Objectif non configuré";

    case "unavailable":
      return "Mesure indisponible";
  }
}


function statusClass(
  status:
    SuperAdminPerformanceStatus,
): string {

  switch (
    status
  ) {

    case "achieved":
      return "border-emerald-500/25 bg-emerald-500/5 text-emerald-400";

    case "watch":
      return "border-amber-500/25 bg-amber-500/5 text-amber-400";

    case "critical":
      return "border-red-500/25 bg-red-500/5 text-red-400";

    case "unavailable":
      return "border-blue-500/20 bg-blue-500/5 text-blue-400";

    default:
      return "border-[#30343c] bg-[#16191f] text-zinc-500";
  }
}


function strategicLabel(
  status:
    SuperAdminStrategicStatus,
): string {

  switch (
    status
  ) {

    case "maturity":
      return "Maturité atteinte";

    case "achieved":
      return "Objectif atteint";

    case "watch":
      return "À surveiller";

    case "critical":
      return "Seuil critique franchi";

    case "not_configured":
      return "Non configuré";

    case "unavailable":
      return "Indisponible";
  }
}


function strategicClass(
  status:
    SuperAdminStrategicStatus,
): string {

  switch (
    status
  ) {

    case "maturity":
      return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";

    case "achieved":
      return "border-emerald-500/25 bg-emerald-500/5 text-emerald-400";

    case "watch":
      return "border-amber-500/25 bg-amber-500/5 text-amber-400";

    case "critical":
      return "border-red-500/35 bg-red-500/10 text-red-300";

    case "unavailable":
      return "border-blue-500/20 bg-blue-500/5 text-blue-400";

    default:
      return "border-[#30343c] bg-[#16191f] text-zinc-500";
  }
}


function metricValue(
  value:
    number | null,
  unit:
    string,
): string {

  if (
    value ===
    null
  ) {
    return "N/D";
  }


  if (
    unit ===
    "percent"
  ) {

    return `${value.toLocaleString(
      "fr-FR",
      {
        maximumFractionDigits:
          1,
      },
    )} %`;
  }


  return value.toLocaleString(
    "fr-FR",
  );
}


function ScoreBar({
  score,
}: {
  score:
    number | null;
}) {

  const width =
    score === null
      ? 0
      : Math.max(
          0,
          Math.min(
            100,
            score,
          ),
        );


  return (
    <div className="h-1.5 overflow-hidden bg-[#23262d]">

      <div
        className="h-full bg-[#2588ff] transition-all"
        style={{
          width:
            `${width}%`,
        }}
      />

    </div>
  );
}


function TrendBadge({
  signal,
}: {
  signal:
    MetricSignal;
}) {

  const {
    trend,
    delta,
  } = signal;


  if (
    trend ===
    "unavailable"
  ) {

    return (
      <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-zinc-700">
        Tendance N/D
      </span>
    );
  }


  if (
    trend ===
    "improving"
  ) {

    return (
      <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.1em] text-emerald-400">

        <ArrowUpRight
          size={12}
        />

        Amélioration

        {delta !==
          null && (
          <>
            {" "}
            {delta >
            0
              ? "+"
              : ""}
            {delta.toLocaleString(
              "fr-FR",
              {
                maximumFractionDigits:
                  1,
              },
            )}
          </>
        )}

      </span>
    );
  }


  if (
    trend ===
    "degrading"
  ) {

    return (
      <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.1em] text-red-400">

        <ArrowDownRight
          size={12}
        />

        Dégradation

        {delta !==
          null && (
          <>
            {" "}
            {delta >
            0
              ? "+"
              : ""}
            {delta.toLocaleString(
              "fr-FR",
              {
                maximumFractionDigits:
                  1,
              },
            )}
          </>
        )}

      </span>
    );
  }


  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.1em] text-zinc-500">

      <ArrowRight
        size={12}
      />

      Stable

    </span>
  );
}


function MetricRow({
  signal,
}: {
  signal:
    MetricSignal;
}) {

  const {
    metric,
  } =
    signal;


  return (
    <article className="border-b border-[#272a31] py-5 first:pt-0 last:border-b-0 last:pb-0">

      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">

        <div className="min-w-0 flex-1">

          <div className="flex flex-wrap items-center gap-2">

            <p className="text-sm font-black text-zinc-100">
              {metric.label}
            </p>


            <span className="border border-[#30343c] bg-[#16191f] px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-zinc-500">
              {metric.domainLabel}
            </span>


            <span
              className={[
                "border px-2 py-1 text-[9px] font-black uppercase tracking-[0.1em]",
                strategicClass(
                  signal.strategicStatus,
                ),
              ].join(
                " ",
              )}
            >
              {strategicLabel(
                signal.strategicStatus,
              )}
            </span>

          </div>


          <p className="mt-2 max-w-3xl text-xs leading-5 text-zinc-500">
            {metric.description}
          </p>


          <div className="mt-3">

            <TrendBadge
              signal={
                signal
              }
            />

          </div>

        </div>


        <div className="grid min-w-0 gap-3 sm:grid-cols-4 xl:w-[600px]">

          <div>

            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-zinc-700">
              Mesure
            </p>

            <p className="mt-1 text-sm font-black text-white">
              {metricValue(
                metric.actualValue,
                metric.unit,
              )}
            </p>

          </div>


          <div>

            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-zinc-700">
              Période précédente
            </p>

            <p className="mt-1 text-sm font-black text-white">
              {metricValue(
                signal.previousValue,
                metric.unit,
              )}
            </p>

          </div>


          <div>

            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-zinc-700">
              Objectif
            </p>

            <p className="mt-1 text-sm font-black text-white">
              {metricValue(
                metric.targetValue,
                metric.unit,
              )}
            </p>

          </div>


          <div>

            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-zinc-700">
              Score
            </p>

            <p className="mt-1 text-sm font-black text-white">
              {metric.score ===
              null
                ? "N/D"
                : `${metric.score.toLocaleString(
                    "fr-FR",
                  )} / 100`}
            </p>

          </div>

        </div>

      </div>


      <div className="mt-4">

        <ScoreBar
          score={
            metric.score
          }
        />

      </div>


      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">

        <span
          className={[
            "border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em]",
            statusClass(
              metric.status,
            ),
          ].join(
            " ",
          )}
        >
          Score : {statusLabel(
            metric.status,
          )}
        </span>


        <span className="text-[9px] text-zinc-700">
          {metric.formula}
        </span>

      </div>

    </article>
  );
}


function makeDraft(
  configuration:
    SuperAdminKpiTargetConfiguration,
): StrategicTargetDraft {

  return {
    criticalValue:
      configuration.criticalValue,

    targetValue:
      configuration.targetValue,

    maturityValue:
      configuration.maturityValue,

    enabled:
      configuration.enabled,

    notes:
      configuration.notes,
  };
}


function validationMessage(
  configuration:
    SuperAdminKpiTargetConfiguration,
  draft:
    StrategicTargetDraft,
): string | null {

  const {
    criticalValue,
    targetValue,
    maturityValue,
  } = draft;


  if (
    targetValue === null &&
    (
      criticalValue !== null ||
      maturityValue !== null
    )
  ) {

    return "Un seuil critique ou une maturité nécessite d’abord un objectif.";
  }


  if (
    configuration.direction ===
    "higher_is_better"
  ) {

    if (
      criticalValue !== null &&
      targetValue !== null &&
      criticalValue >
      targetValue
    ) {

      return "Le seuil critique doit être inférieur ou égal à l’objectif.";
    }


    if (
      targetValue !== null &&
      maturityValue !== null &&
      targetValue >
      maturityValue
    ) {

      return "La maturité doit être supérieure ou égale à l’objectif.";
    }

  } else {

    if (
      criticalValue !== null &&
      targetValue !== null &&
      criticalValue <
      targetValue
    ) {

      return "Pour cet indicateur, le seuil critique doit être supérieur ou égal à l’objectif.";
    }


    if (
      targetValue !== null &&
      maturityValue !== null &&
      targetValue <
      maturityValue
    ) {

      return "Pour cet indicateur, la maturité doit être inférieure ou égale à l’objectif.";
    }

  }


  return null;
}


function buildSignal(
  metric:
    SuperAdminPerformanceMetric,

  previousMetric:
    SuperAdminPerformanceMetric | null,

  configuration:
    SuperAdminKpiTargetConfiguration | null,
): MetricSignal {

  const current =
    metric.actualValue;

  const previous =
    previousMetric?.actualValue ??
    null;


  let trend:
    SuperAdminPerformanceTrend =
      "unavailable";


  let delta:
    number | null =
      null;


  if (
    current !==
      null &&
    previous !==
      null
  ) {

    delta =
      current -
      previous;


    if (
      Math.abs(
        delta,
      ) <
      0.1
    ) {

      trend =
        "stable";

    } else if (
      metric.direction ===
      "higher_is_better"
    ) {

      trend =
        delta >
        0
          ? "improving"
          : "degrading";

    } else {

      trend =
        delta <
        0
          ? "improving"
          : "degrading";
    }
  }


  let strategicStatus:
    SuperAdminStrategicStatus;


  if (
    !configuration ||
    !configuration.enabled ||
    configuration.targetValue ===
      null
  ) {

    strategicStatus =
      "not_configured";

  } else if (
    current ===
    null
  ) {

    strategicStatus =
      "unavailable";

  } else {

    const {
      criticalValue,
      targetValue,
      maturityValue,
      direction,
    } =
      configuration;


    const maturityReached =
      maturityValue !==
        null &&
      (
        direction ===
        "higher_is_better"
          ? current >=
            maturityValue
          : current <=
            maturityValue
      );


    const criticalBreached =
      criticalValue !==
        null &&
      (
        direction ===
        "higher_is_better"
          ? current <
            criticalValue
          : current >
            criticalValue
      );


    const targetReached =
      direction ===
      "higher_is_better"
        ? current >=
          targetValue
        : current <=
          targetValue;


    if (
      maturityReached
    ) {

      strategicStatus =
        "maturity";

    } else if (
      criticalBreached
    ) {

      strategicStatus =
        "critical";

    } else if (
      targetReached
    ) {

      strategicStatus =
        "achieved";

    } else {

      strategicStatus =
        "watch";
    }
  }


  return {
    metric,
    configuration,
    previousValue:
      previous,
    delta,
    trend,
    strategicStatus,
  };
}


export function SuperAdminPerformanceFeature() {

  const {
    data,
    loading,
    error,
  } =
    useSuperAdminPerformanceAnalytics();


  const {
    data:
      targetConfigurations,

    loading:
      targetsLoading,

    error:
      targetsError,
  } =
    useSuperAdminPerformanceTargets();


  const monitoring =
    useSuperAdminPerformanceMonitoring(
      data,
    );


  const {
    save,
    saving,
    error:
      saveError,
  } =
    useSaveSuperAdminPerformanceTargets();


  const {
    refresh,
  } =
    useSuperAdminPeriod();


  const [
    editing,
    setEditing,
  ] =
    useState(
      false,
    );


  const [
    drafts,
    setDrafts,
  ] =
    useState<
      Record<
        string,
        StrategicTargetDraft
      >
    >({});


  const [
    successMessage,
    setSuccessMessage,
  ] =
    useState<
      string | null
    >(
      null,
    );


  const configurationByCode =
    useMemo(
      () =>
        new Map(
          targetConfigurations.map(
            (
              configuration,
            ) => [
              configuration.metricCode,
              configuration,
            ],
          ),
        ),
      [
        targetConfigurations,
      ],
    );


  const previousByCode =
    useMemo(
      () =>
        new Map(
          (
            monitoring.previous
              ?.metrics ??
            []
          ).map(
            (
              metric,
            ) => [
              metric.code,
              metric,
            ],
          ),
        ),
      [
        monitoring.previous,
      ],
    );


  if (
    loading ||
    targetsLoading
  ) {

    return (
      <SuperAdminLoadingState />
    );
  }


  if (
    error ||
    targetsError ||
    !data
  ) {

    return (
      <SuperAdminErrorState
        message={
          error ??
          targetsError ??
          "Performance exécutive indisponible."
        }
      />
    );
  }


  const {
    summary,
    domains,
    metrics,
  } =
    data;


  const signals =
    metrics.map(
      (
        metric,
      ) =>
        buildSignal(

          metric,

          previousByCode.get(
            metric.code,
          ) ??
            null,

          configurationByCode.get(
            metric.code,
          ) ??
            null,

        ),
    );


  const strategicCritical =
    signals.filter(
      (
        signal,
      ) =>
        signal.strategicStatus ===
        "critical",
    );


  const strategicWatch =
    signals.filter(
      (
        signal,
      ) =>
        signal.strategicStatus ===
        "watch",
    );


  const improving =
    signals.filter(
      (
        signal,
      ) =>
        signal.trend ===
        "improving",
    );


  const degrading =
    signals.filter(
      (
        signal,
      ) =>
        signal.trend ===
        "degrading",
    );


  const maturity =
    signals.filter(
      (
        signal,
      ) =>
        signal.strategicStatus ===
        "maturity",
    );


  function startCalibration() {

    const initial:
      Record<
        string,
        StrategicTargetDraft
      > = {};


    targetConfigurations.forEach(
      (
        configuration,
      ) => {

        initial[
          configuration.metricCode
        ] =
          makeDraft(
            configuration,
          );

      },
    );


    setDrafts(
      initial,
    );

    setSuccessMessage(
      null,
    );

    setEditing(
      true,
    );
  }


  function cancelCalibration() {

    setEditing(
      false,
    );

    setDrafts(
      {},
    );

    setSuccessMessage(
      null,
    );
  }


  const invalidDraft =
    targetConfigurations.some(
      (
        configuration,
      ) => {

        const draft =
          drafts[
            configuration.metricCode
          ];


        if (
          !draft
        ) {
          return false;
        }


        return (
          validationMessage(
            configuration,
            draft,
          ) !==
          null
        );
      },
    );


  async function saveCalibration() {

    if (
      invalidDraft
    ) {
      return;
    }


    const payload:
      SuperAdminKpiTargetUpdate[] =
      targetConfigurations.map(
        (
          configuration,
        ) => {

          const draft =
            drafts[
              configuration.metricCode
            ] ??
            makeDraft(
              configuration,
            );


          return {
            metricCode:
              configuration.metricCode,

            criticalValue:
              draft.criticalValue,

            targetValue:
              draft.targetValue,

            maturityValue:
              draft.maturityValue,

            enabled:
              draft.enabled,

            notes:
              draft.notes,
          };
        },
      );


    try {

      const updated =
        await save(
          payload,
        );


      setEditing(
        false,
      );

      setDrafts(
        {},
      );


      setSuccessMessage(
        `${updated} objectif(s) stratégique(s) mis à jour.`,
      );


      refresh();

    } catch {

      // Erreur exposée par le hook.

    }
  }


  return (
    <div className="space-y-6">

      <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">

        <div>

          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2588ff]">
            Executive Scorecard
          </p>

          <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
            Performance
          </h1>

          <p className="mt-2 max-w-4xl text-sm text-zinc-500">
            Pilotage des résultats, objectifs, seuils critiques, tendances et trajectoire stratégique.
          </p>

        </div>


        {!editing ? (

          <button
            type="button"
            onClick={
              startCalibration
            }
            className="h-10 border border-[#2588ff]/50 bg-[#2588ff]/10 px-4 text-xs font-black uppercase tracking-[0.1em] text-[#6dadff] transition hover:border-[#2588ff] hover:text-white"
          >
            Modifier les objectifs
          </button>

        ) : (

          <div className="flex flex-wrap gap-2">

            <button
              type="button"
              onClick={
                cancelCalibration
              }
              disabled={
                saving
              }
              className="h-10 border border-[#30343c] px-4 text-xs font-bold text-zinc-400 hover:text-white disabled:opacity-50"
            >
              Annuler
            </button>


            <button
              type="button"
              onClick={
                () =>
                  void saveCalibration()
              }
              disabled={
                saving ||
                invalidDraft
              }
              className="h-10 border border-emerald-500/50 bg-emerald-500/10 px-4 text-xs font-black uppercase tracking-[0.1em] text-emerald-400 hover:border-emerald-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >

              {saving
                ? "Enregistrement..."
                : "Enregistrer les objectifs"}

            </button>

          </div>

        )}

      </header>


      {successMessage && (

        <div className="border border-emerald-500/25 bg-emerald-500/5 px-5 py-4 text-sm text-emerald-300">
          {successMessage}
        </div>

      )}


      {saveError && (

        <div className="border border-red-500/30 bg-red-500/5 px-5 py-4 text-sm text-red-300">
          {saveError}
        </div>

      )}


      {monitoring.error && (

        <div className="border border-amber-500/20 bg-amber-500/5 px-5 py-4 text-xs text-amber-300">
          Les métriques principales restent disponibles, mais le monitoring historique signale : {monitoring.error}
        </div>

      )}


      {editing && (

        <section className="space-y-4 border border-[#2588ff]/30 bg-[#0d1016] p-5">

          <div className="border-b border-[#272a31] pb-5">

            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#2588ff]">
              Mode calibration stratégique
            </p>

            <p className="mt-2 max-w-5xl text-xs leading-5 text-zinc-500">
              C = seuil critique · O = objectif utilisé par le score · M = maturité · RÉEL = valeur calculée et non modifiable.
            </p>

          </div>


          {metrics.map(
            (
              metric,
            ) => {

              const configuration =
                configurationByCode.get(
                  metric.code,
                );


              if (
                !configuration
              ) {
                return null;
              }


              const draft =
                drafts[
                  metric.code
                ] ??
                makeDraft(
                  configuration,
                );


              return (
                <SuperAdminStrategicTargetBar
                  key={
                    metric.code
                  }
                  label={
                    metric.label
                  }
                  description={
                    metric.description
                  }
                  actualValue={
                    metric.actualValue
                  }
                  configuration={
                    configuration
                  }
                  draft={
                    draft
                  }
                  validationMessage={
                    validationMessage(
                      configuration,
                      draft,
                    )
                  }
                  onChange={
                    (
                      nextDraft,
                    ) =>
                      setDrafts(
                        (
                          current,
                        ) => ({
                          ...current,

                          [
                            metric.code
                          ]:
                            nextDraft,
                        }),
                      )
                  }
                />
              );
            },
          )}

        </section>

      )}


      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">

        <SuperAdminKpiCard
          label="Score exécutif"
          value={
            summary.overallScore ===
            null
              ? "N/D"
              : `${summary.overallScore.toLocaleString(
                  "fr-FR",
                )} / 100`
          }
          detail={`${summary.evaluatedMetrics} KPI évalué(s)`}
        />


        <SuperAdminKpiCard
          label="Alertes critiques"
          value={
            formatNumber(
              strategicCritical.length,
            )
          }
          detail="Seuil critique réellement franchi"
        />


        <SuperAdminKpiCard
          label="En amélioration"
          value={
            formatNumber(
              improving.length,
            )
          }
          detail={`${formatNumber(
            degrading.length,
          )} en dégradation`}
        />


        <SuperAdminKpiCard
          label="Maturité atteinte"
          value={
            formatNumber(
              maturity.length,
            )
          }
          detail={`${formatNumber(
            summary.configuredMetrics,
          )} objectif(s) configuré(s)`}
        />

      </section>


      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">

        <SuperAdminPanel
          title="Historique du score exécutif"
          subtitle="Snapshots quotidiens pour la période Analytics sélectionnée"
        >

          <SuperAdminPerformanceHistoryChart
            data={
              monitoring.history
            }
          />

        </SuperAdminPanel>


        <SuperAdminPanel
          title="Tendance actuelle"
          subtitle="Comparaison avec la période précédente équivalente"
        >

          <div className="grid grid-cols-2 gap-4">

            <div className="border border-emerald-500/20 bg-emerald-500/5 p-4">

              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-emerald-400">
                Amélioration
              </p>

              <p className="mt-3 text-3xl font-black text-white">
                {formatNumber(
                  improving.length,
                )}
              </p>

            </div>


            <div className="border border-red-500/20 bg-red-500/5 p-4">

              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-red-400">
                Dégradation
              </p>

              <p className="mt-3 text-3xl font-black text-white">
                {formatNumber(
                  degrading.length,
                )}
              </p>

            </div>

          </div>


          <p className="mt-5 text-xs leading-5 text-zinc-600">
            Le sens de l’évolution tient compte du KPI : une baisse du taux d’annulation ou du stock faible est considérée comme une amélioration.
          </p>

        </SuperAdminPanel>

      </div>


      <div className="grid gap-6 xl:grid-cols-2">

        <SuperAdminPanel
          title="Alertes stratégiques"
          subtitle="Franchissement des seuils réellement configurés"
        >

          {strategicCritical.length ===
            0 &&
           strategicWatch.length ===
            0 ? (

            <div className="flex min-h-[220px] items-center justify-center text-center">

              <div>

                <p className="text-sm font-bold text-zinc-400">
                  Aucune alerte stratégique
                </p>

                <p className="mt-2 max-w-md text-xs leading-5 text-zinc-600">
                  Aucun KPI mesurable n’a franchi un seuil critique ou ne se situe actuellement sous son objectif.
                </p>

              </div>

            </div>

          ) : (

            <div className="space-y-3">

              {[
                ...strategicCritical,
                ...strategicWatch,
              ].map(
                (
                  signal,
                ) => (

                  <div
                    key={
                      signal.metric.code
                    }
                    className={[
                      "border p-4",
                      strategicClass(
                        signal.strategicStatus,
                      ),
                    ].join(
                      " ",
                    )}
                  >

                    <div className="flex items-center justify-between gap-4">

                      <strong className="text-xs">
                        {signal.metric.label}
                      </strong>

                      <span className="text-[9px] font-black uppercase">
                        {strategicLabel(
                          signal.strategicStatus,
                        )}
                      </span>

                    </div>


                    <p className="mt-2 text-[10px] opacity-75">

                      Réel : {metricValue(
                        signal.metric.actualValue,
                        signal.metric.unit,
                      )}

                      {" · "}

                      Objectif : {metricValue(
                        signal.configuration
                          ?.targetValue ??
                          null,
                        signal.metric.unit,
                      )}

                      {signal.configuration
                        ?.criticalValue !==
                        null &&
                       signal.configuration
                        ?.criticalValue !==
                        undefined
                        ? ` · Critique : ${metricValue(
                            signal.configuration
                              .criticalValue,
                            signal.metric.unit,
                          )}`
                        : ""}

                    </p>


                    <div className="mt-3">

                      <TrendBadge
                        signal={
                          signal
                        }
                      />

                    </div>

                  </div>

                ),
              )}

            </div>

          )}

        </SuperAdminPanel>


        <SuperAdminPanel
          title="Performance par domaine"
          subtitle="Score moyen des KPI configurés et mesurables"
        >

          <div className="space-y-5">

            {domains.map(
              (
                domain,
              ) => (

                <div
                  key={
                    domain.domain
                  }
                >

                  <div className="mb-2 flex items-center justify-between gap-4">

                    <div>

                      <p className="text-xs font-bold text-zinc-300">
                        {domain.label}
                      </p>

                      <p className="mt-1 text-[9px] text-zinc-700">
                        {domain.evaluatedMetrics} / {domain.configuredMetrics} KPI évalué(s)
                      </p>

                    </div>


                    <strong className="text-sm text-white">
                      {domain.score ===
                      null
                        ? "N/D"
                        : `${domain.score.toLocaleString(
                            "fr-FR",
                          )} / 100`}
                    </strong>

                  </div>


                  <ScoreBar
                    score={
                      domain.score
                    }
                  />

                </div>

              ),
            )}

          </div>

        </SuperAdminPanel>

      </div>


      <SuperAdminPanel
        title="Scorecard détaillée"
        subtitle="Mesure actuelle, période précédente, objectif, tendance et score"
      >

        <div>

          {signals.map(
            (
              signal,
            ) => (

              <MetricRow
                key={
                  signal.metric.code
                }
                signal={
                  signal
                }
              />

            ),
          )}

        </div>

      </SuperAdminPanel>


      <div className="border border-[#30343c] bg-[#111318] p-5">

        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400">
          Lecture stratégique
        </p>

        <p className="mt-3 max-w-6xl text-xs leading-5 text-zinc-600">
          Une alerte critique n’est créée que lorsqu’un seuil critique a été explicitement configuré et que la mesure réelle le franchit. La tendance compare la période sélectionnée à la période précédente de même durée. Les KPI où une valeur faible est favorable utilisent automatiquement le sens inverse.
        </p>

        <p className="mt-3 max-w-6xl text-xs leading-5 text-zinc-600">
          L’historique commence avec l’installation de ce module. Un snapshot maximum par jour et par période Analytics est conservé lorsque la page Performance est consultée ou actualisée. Il n’existe donc aucune reconstruction artificielle d’anciens scores.
        </p>

      </div>

    </div>
  );
}
