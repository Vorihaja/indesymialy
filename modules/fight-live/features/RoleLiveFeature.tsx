"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { resolveRoleLiveCapabilities } from "../access";
import type { FightLiveSection, RoleLiveRole } from "../types";
import { FightLiveListFeature } from "./FightLiveListFeature";
import { FightLiveWorkspaceFeature } from "./FightLiveWorkspaceFeature";
import { PublicFightLiveFeature } from "./PublicFightLiveFeature";

const rolePaths: Record<RoleLiveRole, string> = {
  admin: "/dashboard/admin/live",
  "super-admin": "/dashboard/super-admin/live",
  club: "/dashboard/club/live",
  coach: "/dashboard/coach/live",
  fan: "/dashboard/fan/live",
  federation: "/dashboard/federation/live",
  league: "/dashboard/ligue/live",
  seller: "/dashboard/vendeur/live",
  sponsor: "/dashboard/sponsor/live",
};

const managementSections: Array<[FightLiveSection, string]> = [
  ["overview", "Vue live"],
  ["statistics", "Statistiques"],
  ["result", "Résultat"],
];

export function RoleLiveFeature({ role }: { role: RoleLiveRole }) {
  const searchParams = useSearchParams();
  const fightId = searchParams.get("fightId");
  const requestedSection = searchParams.get("view");
  const section = managementSections.some(([value]) => value === requestedSection)
    ? requestedSection as FightLiveSection
    : "overview";
  const capabilities = resolveRoleLiveCapabilities(role);
  const basePath = rolePaths[role];

  if (!fightId) {
    return (
      <div data-fight-live-access={capabilities.accessMode}>
        <FightLiveListFeature
          mode={capabilities.canViewOperationalLive ? "admin" : "public"}
          basePath={basePath}
          detailHref={(id) => `${basePath}?fightId=${encodeURIComponent(id)}`}
        />
      </div>
    );
  }

  return (
    <section
      className="space-y-4"
      data-fight-live-access={capabilities.accessMode}
    >
      <nav className="flex flex-wrap items-center gap-2">
        <Link
          href={basePath}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-xs font-bold dark:border-neutral-700"
        >
          Retour aux combats
        </Link>
        {capabilities.canViewOperationalLive && managementSections.map(([value, label]) => (
          <Link
            key={value}
            href={`${basePath}?fightId=${encodeURIComponent(fightId)}&view=${value}`}
            className={`rounded-lg px-3 py-2 text-xs font-bold ${section === value ? "bg-amber-500 text-black" : "border border-neutral-300 dark:border-neutral-700"}`}
          >
            {label}
          </Link>
        ))}
      </nav>

      {capabilities.canViewOperationalLive ? (
        <FightLiveWorkspaceFeature
          fightId={fightId}
          mode="admin"
          section={section}
          basePath={`${basePath}?fightId=${encodeURIComponent(fightId)}&view=${section}`}
        />
      ) : (
        <PublicFightLiveFeature fightId={fightId} basePath={basePath} />
      )}
    </section>
  );
}
