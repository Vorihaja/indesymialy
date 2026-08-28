"use client";

import type {
  SuperAdminBreakdownItem,
  SuperAdminGrowthPoint,
} from "../types";

interface LineChartProps {
  data: SuperAdminGrowthPoint[];
}

export function SuperAdminGrowthChart({
  data,
}: LineChartProps) {
  const width = 760;
  const height = 260;
  const paddingX = 34;
  const paddingY = 28;

  if (!data.length) {
    return (
      <div className="flex min-h-[260px] items-center justify-center text-sm text-zinc-600">
        Aucune donnée sur cette période.
      </div>
    );
  }

  const maxValue = Math.max(
    1,
    ...data.flatMap((item) => [
      item.users,
      item.fighters,
      item.events,
    ]),
  );

  const buildPoints = (
    key: "users" | "fighters" | "events",
  ) =>
    data
      .map((item, index) => {
        const x =
          data.length === 1
            ? width / 2
            : paddingX +
              (index /
                (data.length - 1)) *
                (width - paddingX * 2);

        const y =
          height -
          paddingY -
          (item[key] / maxValue) *
            (height - paddingY * 2);

        return `${x},${y}`;
      })
      .join(" ");

  const labels = data.filter(
    (_, index) =>
      index === 0 ||
      index === data.length - 1 ||
      index %
        Math.max(
          1,
          Math.floor(data.length / 5),
        ) ===
        0,
  );

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-5 text-[10px] font-bold uppercase tracking-[0.12em]">
        <span className="text-blue-400">
          ● Utilisateurs
        </span>

        <span className="text-emerald-400">
          ● Combattants
        </span>

        <span className="text-amber-400">
          ● Événements
        </span>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-[260px] w-full"
        role="img"
        aria-label="Évolution quotidienne"
      >
        {[0.25, 0.5, 0.75].map((ratio) => (
          <line
            key={ratio}
            x1={paddingX}
            x2={width - paddingX}
            y1={height * ratio}
            y2={height * ratio}
            stroke="currentColor"
            className="text-zinc-800"
            strokeWidth="1"
          />
        ))}

        <polyline
          fill="none"
          stroke="rgb(96 165 250)"
          strokeWidth="3"
          points={buildPoints("users")}
        />

        <polyline
          fill="none"
          stroke="rgb(52 211 153)"
          strokeWidth="2.5"
          points={buildPoints("fighters")}
        />

        <polyline
          fill="none"
          stroke="rgb(251 191 36)"
          strokeWidth="2.5"
          points={buildPoints("events")}
        />

        {labels.map((item) => {
          const index = data.indexOf(item);

          const x =
            data.length === 1
              ? width / 2
              : paddingX +
                (index /
                  (data.length - 1)) *
                  (width - paddingX * 2);

          return (
            <text
              key={`${item.date}-${index}`}
              x={x}
              y={height - 5}
              textAnchor={
                index === 0
                  ? "start"
                  : index === data.length - 1
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
        })}
      </svg>
    </div>
  );
}

export function SuperAdminBarChart({
  data,
  limit = 10,
}: {
  data: SuperAdminBreakdownItem[];
  limit?: number;
}) {
  const rows = data.slice(0, limit);
  const max = Math.max(
    1,
    ...rows.map((item) => item.value),
  );

  if (!rows.length) {
    return (
      <div className="flex min-h-[180px] items-center justify-center text-sm text-zinc-600">
        Aucune donnée disponible.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {rows.map((item) => {
        const percent =
          (item.value / max) * 100;

        return (
          <div key={`${item.label}-${item.value}`}>
            <div className="mb-1.5 flex items-center justify-between gap-4">
              <span className="truncate text-xs font-semibold text-zinc-300">
                {item.label}
              </span>

              <span className="text-xs font-black tabular-nums text-white">
                {item.value.toLocaleString(
                  "fr-FR",
                )}
              </span>
            </div>

            <div className="h-1.5 overflow-hidden bg-[#23262d]">
              <div
                className="h-full bg-[#2588ff]"
                style={{
                  width: `${Math.max(
                    2,
                    percent,
                  )}%`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
