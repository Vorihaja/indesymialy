"use client";

import {
  useEffect,
  useMemo,
} from "react";

import {
  useGeography,
} from "../hooks/useGeography";

import type {
  GeographyValue,
} from "../types";


interface Props {
  value: GeographyValue;
  onChange(
    value: GeographyValue,
  ): void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  mode?: "commune" | "city";
}


const fieldClass =
  "h-10 min-w-0 border border-[#303238] bg-[#0d0f12] px-3 text-xs text-zinc-200 outline-none transition-colors hover:border-[#454951] focus:border-[#3d92ff] disabled:cursor-not-allowed disabled:opacity-50";

const labelClass =
  "grid gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-500";


export function GeographySelector({
  value,
  onChange,
  required,
  disabled,
  className = "",
  mode = "commune",
}: Props) {
  const {
    data,
    loading,
    error,
  } =
    useGeography();


  useEffect(() => {
    if (
      mode !== "commune" ||
      !data ||
      !value.cityId ||
      (
        value.districtId &&
        value.communeId
      )
    ) {
      return;
    }

    const city =
      data.cities.find(
        (item) =>
          item.id ===
          value.cityId,
      );

    const commune =
      data.communes.find(
        (item) =>
          item.cityId ===
            value.cityId &&
          (
            !city?.districtId ||
            item.districtId ===
              city.districtId
          ),
      ) ??
      data.communes.find(
        (item) =>
          item.cityId ===
          value.cityId,
      );

    const next = {
      ...value,

      regionId:
        value.regionId ||
        city?.regionId ||
        commune?.regionId ||
        "",

      districtId:
        value.districtId ||
        city?.districtId ||
        commune?.districtId ||
        "",

      communeId:
        value.communeId ||
        commune?.id ||
        "",
    };

    if (
      next.regionId !==
        value.regionId ||
      next.districtId !==
        value.districtId ||
      next.communeId !==
        value.communeId
    ) {
      onChange(
        next,
      );
    }
  }, [
    data,
    mode,
    onChange,
    value,
  ]);


  const districts =
    useMemo(
      () =>
        data?.districts.filter(
          (item) =>
            item.regionId ===
            value.regionId,
        ) ?? [],
      [
        data,
        value.regionId,
      ],
    );


  const communes =
    useMemo(
      () =>
        data?.communes.filter(
          (item) =>
            item.districtId ===
            value.districtId,
        ) ?? [],
      [
        data,
        value.districtId,
      ],
    );


  const cities =
    useMemo(
      () =>
        data?.cities.filter(
          (item) =>
            item.districtId ===
            value.districtId,
        ) ?? [],
      [
        data,
        value.districtId,
      ],
    );


  function set(
    patch:
      Partial<GeographyValue>,
  ) {
    onChange({
      ...value,
      ...patch,
    });
  }


  return (
    <div
      className={`grid gap-3 md:grid-cols-3 ${className}`}
    >
      <label
        className={
          labelClass
        }
      >
        Région

        <select
          aria-label="Région"
          required={
            required
          }
          disabled={
            disabled ||
            loading
          }
          value={
            value.regionId
          }
          onChange={(
            event,
          ) =>
            set({
              regionId:
                event.target
                  .value,
              districtId:
                "",
              cityId: "",
              communeId:
                "",
            })
          }
          className={
            fieldClass
          }
        >
          <option value="">
            Sélectionner
          </option>

          {data?.regions.map(
            (item) => (
              <option
                key={
                  item.id
                }
                value={
                  item.id
                }
              >
                {item.name}
              </option>
            ),
          )}
        </select>
      </label>


      <label
        className={
          labelClass
        }
      >
        District

        <select
          aria-label="District"
          required={
            required
          }
          disabled={
            disabled ||
            !value.regionId
          }
          value={
            value.districtId
          }
          onChange={(
            event,
          ) =>
            set({
              districtId:
                event.target
                  .value,
              cityId: "",
              communeId:
                "",
            })
          }
          className={
            fieldClass
          }
        >
          <option value="">
            Sélectionner
          </option>

          {districts.map(
            (item) => (
              <option
                key={
                  item.id
                }
                value={
                  item.id
                }
              >
                {item.name}
              </option>
            ),
          )}
        </select>
      </label>


      {mode ===
      "city" ? (
        <label
          className={
            labelClass
          }
        >
          Ville

          <select
            aria-label="Ville"
            required={
              required
            }
            disabled={
              disabled ||
              !value.districtId
            }
            value={
              value.cityId
            }
            onChange={(
              event,
            ) =>
              set({
                cityId:
                  event.target
                    .value,
                communeId:
                  "",
              })
            }
            className={
              fieldClass
            }
          >
            <option value="">
              Sélectionner
            </option>

            {cities.map(
              (item) => (
                <option
                  key={
                    item.id
                  }
                  value={
                    item.id
                  }
                >
                  {item.name}
                </option>
              ),
            )}
          </select>
        </label>
      ) : (
        <label
          className={
            labelClass
          }
        >
          Commune / ville

          <select
            aria-label="Commune ou ville"
            required={
              required
            }
            disabled={
              disabled ||
              !value.districtId
            }
            value={
              value.communeId
            }
            onChange={(
              event,
            ) => {
              const commune =
                communes.find(
                  (item) =>
                    item.id ===
                    event.target
                      .value,
                );

              set({
                communeId:
                  event.target
                    .value,
                cityId:
                  commune?.cityId ??
                  "",
              });
            }}
            className={
              fieldClass
            }
          >
            <option value="">
              Sélectionner
            </option>

            {communes.map(
              (item) => (
                <option
                  key={
                    item.id
                  }
                  value={
                    item.id
                  }
                >
                  {item.name}
                </option>
              ),
            )}
          </select>
        </label>
      )}


      {error ? (
        <p
          role="alert"
          className="text-xs text-red-500 md:col-span-3"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}