"use client";

import type {
  SuperAdminMarketplaceDailyPoint,
} from "../marketplace.types";

export function SuperAdminMarketplaceTrendChart({
  data,
}: {
  data: SuperAdminMarketplaceDailyPoint[];
}) {

  const width = 780;
  const height = 270;

  const paddingX = 36;
  const paddingY = 28;

  if (!data.length) {
    return (
      <div className="flex min-h-[260px] items-center justify-center text-sm text-zinc-600">
        Aucune activité Marketplace sur cette période.
      </div>
    );
  }

  const maxOrders =
    Math.max(
      1,
      ...data.map(
        (item) =>
          item.orders,
      ),
    );

  const maxGmv =
    Math.max(
      1,
      ...data.map(
        (item) =>
          item.gmv,
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

  const orderPoints =
    data
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
              item.orders /
              maxOrders
            ) *
            (
              height -
              paddingY * 2
            );

          return `${x},${y}`;
        },
      )
      .join(" ");

  const gmvPoints =
    data
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
              item.gmv /
              maxGmv
            ) *
            (
              height -
              paddingY * 2
            );

          return `${x},${y}`;
        },
      )
      .join(" ");

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
      <div className="mb-5 flex flex-wrap gap-5 text-[10px] font-bold uppercase tracking-[0.12em]">

        <span className="text-blue-400">
          ● Commandes
        </span>

        <span className="text-emerald-400">
          ● GMV
        </span>

      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-[270px] w-full"
        role="img"
        aria-label="Évolution Marketplace"
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
          strokeWidth="3"
          points={orderPoints}
        />

        <polyline
          fill="none"
          stroke="rgb(52 211 153)"
          strokeWidth="3"
          points={gmvPoints}
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
