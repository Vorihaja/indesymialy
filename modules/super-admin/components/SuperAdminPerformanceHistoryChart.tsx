"use client";

import type {
  SuperAdminPerformanceSnapshot,
} from "../performance-monitoring.types";

export function SuperAdminPerformanceHistoryChart({
  data,
}: {
  data:
    SuperAdminPerformanceSnapshot[];
}) {

  const valid =
    data.filter(
      (
        item,
      ) =>
        item.overallScore !==
        null,
    );


  if (
    valid.length === 0
  ) {

    return (
      <div className="flex min-h-[240px] items-center justify-center text-center">

        <div>

          <p className="text-sm font-bold text-zinc-500">
            Historique en cours de constitution
          </p>

          <p className="mt-2 max-w-md text-xs leading-5 text-zinc-700">
            Les snapshots apparaîtront ici à mesure que la Performance sera observée avec des objectifs configurés.
          </p>

        </div>

      </div>
    );
  }


  const width =
    760;

  const height =
    250;

  const paddingX =
    34;

  const paddingY =
    30;


  const xFor =
    (
      index:
        number,
    ) => {

      if (
        valid.length ===
        1
      ) {
        return width / 2;
      }

      return (
        paddingX +
        (
          index /
          (
            valid.length -
            1
          )
        ) *
        (
          width -
          paddingX * 2
        )
      );
    };


  const yFor =
    (
      value:
        number,
    ) => {

      const normalized =
        Math.max(
          0,
          Math.min(
            100,
            value,
          ),
        );

      return (
        height -
        paddingY -
        (
          normalized /
          100
        ) *
        (
          height -
          paddingY * 2
        )
      );
    };


  const points =
    valid
      .map(
        (
          item,
          index,
        ) =>
          `${xFor(
            index,
          )},${yFor(
            item.overallScore ??
              0,
          )}`,
      )
      .join(
        " ",
      );


  return (
    <div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-[250px] w-full"
        role="img"
        aria-label="Historique du score exécutif"
      >

        {[25, 50, 75, 100].map(
          (
            score,
          ) => {

            const y =
              yFor(
                score,
              );

            return (
              <g
                key={
                  score
                }
              >

                <line
                  x1={
                    paddingX
                  }
                  x2={
                    width -
                    paddingX
                  }
                  y1={
                    y
                  }
                  y2={
                    y
                  }
                  stroke="currentColor"
                  className="text-zinc-800"
                  strokeWidth="1"
                />

                <text
                  x="2"
                  y={
                    y + 3
                  }
                  fontSize="8"
                  fill="rgb(113 113 122)"
                >
                  {score}
                </text>

              </g>
            );
          },
        )}


        <polyline
          fill="none"
          stroke="rgb(37 136 255)"
          strokeWidth="3"
          points={
            points
          }
        />


        {valid.map(
          (
            item,
            index,
          ) => {

            const score =
              item.overallScore ??
              0;

            return (
              <g
                key={
                  `${item.snapshotDate}-${index}`
                }
              >

                <circle
                  cx={
                    xFor(
                      index,
                    )
                  }
                  cy={
                    yFor(
                      score,
                    )
                  }
                  r="4"
                  fill="rgb(37 136 255)"
                />


                <text
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
                    index ===
                    0
                      ? "start"
                      : index ===
                          valid.length -
                          1
                        ? "end"
                        : "middle"
                  }
                  fontSize="8"
                  fill="rgb(113 113 122)"
                >

                  {new Date(
                    `${item.snapshotDate}T00:00:00`,
                  ).toLocaleDateString(
                    "fr-FR",
                    {
                      day:
                        "2-digit",

                      month:
                        "short",
                    },
                  )}

                </text>

              </g>
            );
          },
        )}

      </svg>

    </div>
  );
}
