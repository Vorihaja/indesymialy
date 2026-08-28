"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  Minus,
} from "lucide-react";

interface SuperAdminKpiCardProps {
  label: string;
  value: string;
  detail?: string;
  trend?: number | null;
}

export function SuperAdminKpiCard({
  label,
  value,
  detail,
  trend,
}: SuperAdminKpiCardProps) {
  const positive =
    trend !== null &&
    trend !== undefined &&
    trend > 0;

  const negative =
    trend !== null &&
    trend !== undefined &&
    trend < 0;

  return (
    <article className="group border border-[#272a31] bg-[#111318] p-5 transition hover:border-[#3c414c]">
      <div className="flex items-start justify-between gap-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
          {label}
        </p>

        {trend !== undefined && (
          <div
            className={[
              "flex items-center gap-1 text-[11px] font-bold",
              positive
                ? "text-emerald-400"
                : negative
                  ? "text-red-400"
                  : "text-zinc-500",
            ].join(" ")}
          >
            {positive && (
              <ArrowUpRight size={14} />
            )}

            {negative && (
              <ArrowDownRight size={14} />
            )}

            {!positive && !negative && (
              <Minus size={14} />
            )}

            {trend === null
              ? "N/D"
              : `${trend > 0 ? "+" : ""}${trend.toLocaleString("fr-FR")} %`}
          </div>
        )}
      </div>

      <p className="mt-4 text-3xl font-black tracking-tight text-white">
        {value}
      </p>

      {detail && (
        <p className="mt-2 text-xs text-zinc-500">
          {detail}
        </p>
      )}
    </article>
  );
}
