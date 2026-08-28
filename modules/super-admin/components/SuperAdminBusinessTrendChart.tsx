"use client";

import type {
  SuperAdminBusinessDailyPoint,
} from "../business.types";

export function SuperAdminBusinessTrendChart({
  data,
}: {
  data: SuperAdminBusinessDailyPoint[];
}) {

  const width = 800;
  const height = 280;

  const paddingX = 38;
  const paddingY = 30;

  if (!data.length) {
    return (
      <div className="flex min-h-[270px] items-center justify-center text-sm text-zinc-600">
        Aucune activité Business sur cette période.
      </div>
    );
  }

  const maximum =
    Math.max(
      1,
      ...data.map(
        (item) =>
          Math.max(
            item.marketplace,
            item.ticketing,
            item.sponsorship,
            item.total,
          ),
      ),
    );

  const xFor =
    (index: number) =>
      data.length === 1
        ? width / 2
        : paddingX +
          (
            index /
            (
              data.length -
              1
            )
          ) *
          (
            width -
            paddingX * 2
          );

  function points(
    selector:
      (
        item:
          SuperAdminBusinessDailyPoint,
      ) => number,
  ) {

    return data
      .map(
        (
          item,
          index,
        ) => {

          const x =
            xFor(
              index,
            );

          const y =
            height -
            paddingY -
            (
              selector(
                item,
              ) /
              maximum
            ) *
            (
              height -
              paddingY * 2
            );

          return `${x},${y}`;
        },
      )
      .join(" ");
  }

  const labelStep =
    Math.max(
      1,
      Math.floor(
        data.length /
        6,
      ),
    );

  return (
    <div>

      <div className="mb-5 flex flex-wrap gap-5 text-[10px] font-bold uppercase tracking-[0.1em]">

        <span className="text-blue-400">
          ● Marketplace
        </span>

        <span className="text-emerald-400">
          ● Billetterie
        </span>

        <span className="text-orange-400">
          ● Sponsoring
        </span>

        <span className="text-zinc-200">
          ● Total
        </span>

      </div>


      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-[280px] w-full"
        role="img"
        aria-label="Évolution du volume Business"
      >

        {[0.25, 0.5, 0.75].map(
          (ratio) => (

            <line
              key={ratio}
              x1={paddingX}
              x2={
                width -
                paddingX
              }
              y1={
                height *
                ratio
              }
              y2={
                height *
                ratio
              }
              stroke="currentColor"
              className="text-zinc-800"
              strokeWidth="1"
            />

          ),
        )}


        <polyline
          fill="none"
          stroke="rgb(96 165 250)"
          strokeWidth="2.5"
          points={
            points(
              (item) =>
                item.marketplace,
            )
          }
        />


        <polyline
          fill="none"
          stroke="rgb(52 211 153)"
          strokeWidth="2.5"
          points={
            points(
              (item) =>
                item.ticketing,
            )
          }
        />


        <polyline
          fill="none"
          stroke="rgb(251 146 60)"
          strokeWidth="2.5"
          points={
            points(
              (item) =>
                item.sponsorship,
            )
          }
        />


        <polyline
          fill="none"
          stroke="rgb(228 228 231)"
          strokeWidth="3"
          points={
            points(
              (item) =>
                item.total,
            )
          }
        />


        {data.map(
          (
            item,
            index,
          ) => {

            const visible =
              index === 0 ||
              index ===
                data.length - 1 ||
              index %
                labelStep ===
                0;

            if (!visible) {
              return null;
            }

            return (
              <text
                key={
                  `${item.date}-${index}`
                }
                x={
                  xFor(
                    index,
                  )
                }
                y={
                  height -
                  5
                }
                textAnchor={
                  index === 0
                    ? "start"
                    : index ===
                        data.length - 1
                      ? "end"
                      : "middle"
                }
                fontSize="9"
                fill="rgb(113 113 122)"
              >
                {new Date(
                  `${item.date}T00:00:00`,
                ).toLocaleDateString(
                  "fr-FR",
                  {
                    day: "2-digit",
                    month: "short",
                  },
                )}
              </text>
            );
          },
        )}

      </svg>

    </div>
  );
}
