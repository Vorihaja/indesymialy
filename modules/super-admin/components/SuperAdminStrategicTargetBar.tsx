"use client";

import {
  useMemo,
  useState,
} from "react";

import type {
  SuperAdminKpiTargetConfiguration,
} from "../performance-target.types";

type StrategicMarker =
  | "critical"
  | "target"
  | "maturity";

export interface StrategicTargetDraft {
  criticalValue: number | null;

  targetValue: number | null;

  maturityValue: number | null;

  enabled: boolean;

  notes: string | null;
}

interface Props {
  label: string;

  description: string;

  actualValue: number | null;

  configuration:
    SuperAdminKpiTargetConfiguration;

  draft:
    StrategicTargetDraft;

  validationMessage:
    string | null;

  onChange:
    (
      draft:
        StrategicTargetDraft,
    ) => void;
}

function clamp(
  value: number,
  min: number,
  max: number,
) {
  return Math.min(
    max,
    Math.max(
      min,
      value,
    ),
  );
}

function percentPosition(
  value: number,
  min: number,
  max: number,
) {

  if (max <= min) {
    return 0;
  }

  return clamp(
    (
      (
        value -
        min
      )
      /
      (
        max -
        min
      )
    ) *
      100,
    0,
    100,
  );
}

function displayValue(
  value: number | null,
) {

  if (value === null) {
    return "Non défini";
  }

  return `${value.toLocaleString(
    "fr-FR",
    {
      maximumFractionDigits: 1,
    },
  )} %`;
}

export function SuperAdminStrategicTargetBar({
  label,
  description,
  actualValue,
  configuration,
  draft,
  validationMessage,
  onChange,
}: Props) {

  const [
    activeMarker,
    setActiveMarker,
  ] =
    useState<StrategicMarker>(
      "target",
    );

  const {
    minValue,
    maxValue,
    stepValue,
    direction,
  } = configuration;


  const currentValue =
    activeMarker ===
    "critical"
      ? draft.criticalValue

      : activeMarker ===
          "maturity"
        ? draft.maturityValue
        : draft.targetValue;


  const actualPosition =
    actualValue === null
      ? null
      : percentPosition(
          actualValue,
          minValue,
          maxValue,
        );


  const markerValues =
    useMemo(
      () => ({
        critical:
          draft.criticalValue,

        target:
          draft.targetValue,

        maturity:
          draft.maturityValue,
      }),
      [
        draft,
      ],
    );


  function seedValue() {

    if (actualValue !== null) {
      return clamp(
        actualValue,
        minValue,
        maxValue,
      );
    }

    return (
      minValue +
      maxValue
    ) / 2;
  }


  function setMarker(
    marker:
      StrategicMarker,
    value:
      number | null,
  ) {

    if (
      marker ===
      "critical"
    ) {

      onChange({
        ...draft,
        criticalValue:
          value,
      });

      return;
    }


    if (
      marker ===
      "maturity"
    ) {

      onChange({
        ...draft,
        maturityValue:
          value,
      });

      return;
    }


    onChange({
      ...draft,
      targetValue:
        value,

      criticalValue:
        value === null
          ? null
          : draft.criticalValue,

      maturityValue:
        value === null
          ? null
          : draft.maturityValue,
    });
  }


  function activate(
    marker:
      StrategicMarker,
  ) {

    setActiveMarker(
      marker,
    );

    if (
      markerValues[
        marker
      ] === null
    ) {

      setMarker(
        marker,
        seedValue(),
      );
    }
  }


  const activeConfigured =
    currentValue !== null;


  return (
    <article className="border border-[#272a31] bg-[#111318] p-5">

      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">

        <div className="max-w-xl">

          <div className="flex flex-wrap items-center gap-3">

            <h3 className="text-sm font-black text-white">
              {label}
            </h3>

            <span className="border border-[#30343c] px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-zinc-500">
              {direction ===
              "higher_is_better"
                ? "Plus haut = mieux"
                : "Plus bas = mieux"}
            </span>

          </div>


          <p className="mt-2 text-xs leading-5 text-zinc-500">
            {description}
          </p>

        </div>


        <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">

          <input
            type="checkbox"
            checked={
              draft.enabled
            }
            onChange={
              (event) =>
                onChange({
                  ...draft,
                  enabled:
                    event.target.checked,
                })
            }
            className="h-4 w-4 accent-[#2588ff]"
          />

          Inclure dans le score

        </label>

      </div>


      <div className="mt-8">

        <div className="relative h-16">

          <div className="absolute left-0 right-0 top-7 h-1 bg-[#272a31]" />


          {actualPosition !==
            null && (

            <div
              className="absolute top-2 -translate-x-1/2"
              style={{
                left:
                  `${actualPosition}%`,
              }}
            >

              <div className="mx-auto h-9 w-px bg-orange-400" />

              <div className="mt-1 whitespace-nowrap text-[9px] font-black text-orange-400">
                RÉEL {displayValue(
                  actualValue,
                )}
              </div>

            </div>

          )}


          {(
            [
              {
                marker:
                  "critical" as const,

                value:
                  draft.criticalValue,

                label:
                  "C",

                className:
                  "bg-red-500",
              },

              {
                marker:
                  "target" as const,

                value:
                  draft.targetValue,

                label:
                  "O",

                className:
                  "bg-[#2588ff]",
              },

              {
                marker:
                  "maturity" as const,

                value:
                  draft.maturityValue,

                label:
                  "M",

                className:
                  "bg-emerald-500",
              },
            ]
          ).map(
            (marker) => {

              if (
                marker.value ===
                null
              ) {
                return null;
              }


              const position =
                percentPosition(
                  marker.value,
                  minValue,
                  maxValue,
                );


              return (
                <button
                  key={
                    marker.marker
                  }
                  type="button"
                  onClick={
                    () =>
                      setActiveMarker(
                        marker.marker,
                      )
                  }
                  className={[
                    "absolute top-5 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full text-[8px] font-black text-white ring-2 ring-[#090a0d] transition",
                    marker.className,
                    activeMarker ===
                    marker.marker
                      ? "scale-125"
                      : "",
                  ].join(
                    " ",
                  )}
                  style={{
                    left:
                      `${position}%`,
                  }}
                  title={
                    `${marker.marker} : ${displayValue(
                      marker.value,
                    )}`
                  }
                >
                  {marker.label}
                </button>
              );
            },
          )}


          <span className="absolute left-0 top-10 text-[9px] font-bold text-zinc-700">
            {displayValue(
              minValue,
            )}
          </span>

          <span className="absolute right-0 top-10 text-[9px] font-bold text-zinc-700">
            {displayValue(
              maxValue,
            )}
          </span>

        </div>


        <div className="mt-3 grid gap-2 sm:grid-cols-3">

          <button
            type="button"
            onClick={
              () =>
                activate(
                  "critical",
                )
            }
            className={[
              "border px-3 py-3 text-left transition",
              activeMarker ===
              "critical"
                ? "border-red-500/50 bg-red-500/5"
                : "border-[#30343c] hover:border-red-500/30",
            ].join(" ")}
          >

            <span className="block text-[9px] font-black uppercase tracking-[0.12em] text-red-400">
              Seuil critique
            </span>

            <strong className="mt-1 block text-sm text-white">
              {displayValue(
                draft.criticalValue,
              )}
            </strong>

          </button>


          <button
            type="button"
            onClick={
              () =>
                activate(
                  "target",
                )
            }
            className={[
              "border px-3 py-3 text-left transition",
              activeMarker ===
              "target"
                ? "border-[#2588ff]/60 bg-[#2588ff]/5"
                : "border-[#30343c] hover:border-[#2588ff]/30",
            ].join(" ")}
          >

            <span className="block text-[9px] font-black uppercase tracking-[0.12em] text-[#2588ff]">
              Objectif
            </span>

            <strong className="mt-1 block text-sm text-white">
              {displayValue(
                draft.targetValue,
              )}
            </strong>

          </button>


          <button
            type="button"
            onClick={
              () =>
                activate(
                  "maturity",
                )
            }
            className={[
              "border px-3 py-3 text-left transition",
              activeMarker ===
              "maturity"
                ? "border-emerald-500/50 bg-emerald-500/5"
                : "border-[#30343c] hover:border-emerald-500/30",
            ].join(" ")}
          >

            <span className="block text-[9px] font-black uppercase tracking-[0.12em] text-emerald-400">
              Maturité
            </span>

            <strong className="mt-1 block text-sm text-white">
              {displayValue(
                draft.maturityValue,
              )}
            </strong>

          </button>

        </div>


        {activeConfigured ? (

          <div className="mt-5 border border-[#272a31] bg-[#0d0f13] p-4">

            <div className="flex flex-wrap items-center justify-between gap-4">

              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-zinc-500">
                Déplacer le curseur
              </p>


              <div className="flex items-center gap-2">

                <input
                  type="number"
                  min={
                    minValue
                  }
                  max={
                    maxValue
                  }
                  step={
                    stepValue
                  }
                  value={
                    currentValue ??
                    ""
                  }
                  onChange={
                    (event) => {

                      const next =
                        Number(
                          event.target.value,
                        );

                      if (
                        Number.isFinite(
                          next,
                        )
                      ) {
                        setMarker(
                          activeMarker,
                          clamp(
                            next,
                            minValue,
                            maxValue,
                          ),
                        );
                      }
                    }
                  }
                  className="h-9 w-24 border border-[#30343c] bg-[#111318] px-2 text-right text-xs font-black text-white outline-none focus:border-[#2588ff]"
                />

                <span className="text-xs text-zinc-500">
                  %
                </span>


                <button
                  type="button"
                  onClick={
                    () =>
                      setMarker(
                        activeMarker,
                        null,
                      )
                  }
                  className="h-9 border border-[#30343c] px-3 text-[10px] font-bold text-zinc-500 hover:border-red-500/40 hover:text-red-400"
                >
                  Retirer
                </button>

              </div>

            </div>


            <input
              type="range"
              min={
                minValue
              }
              max={
                maxValue
              }
              step={
                stepValue
              }
              value={
                currentValue ??
                seedValue()
              }
              onChange={
                (event) =>
                  setMarker(
                    activeMarker,
                    Number(
                      event.target.value,
                    ),
                  )
              }
              className="mt-5 w-full accent-[#2588ff]"
            />

          </div>

        ) : (

          <div className="mt-5 border border-dashed border-[#30343c] p-4 text-center">

            <p className="text-xs text-zinc-600">
              Ce repère n’est pas encore défini. Sélectionne-le pour commencer.
            </p>

          </div>

        )}


        {validationMessage && (

          <div className="mt-4 border border-red-500/30 bg-red-500/5 px-4 py-3 text-xs text-red-300">
            {validationMessage}
          </div>

        )}

      </div>

    </article>
  );
}
