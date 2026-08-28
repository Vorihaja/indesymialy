"use client";

import type { GuardProps } from "./types";
import { useRole } from "../hooks/useRole";

function LoadingState() {
  return (
    <div className="flex min-h-[180px] items-center justify-center border border-[#303238] bg-[#151619] px-6 py-8 text-sm font-medium text-zinc-400">
      <div className="flex items-center gap-3">
        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#2588ff]" />
        <span>Chargement des autorisations...</span>
      </div>
    </div>
  );
}

function DeniedState() {
  return (
    <div className="flex min-h-[180px] items-center justify-center border border-red-500/30 bg-red-500/5 px-6 py-8 text-center text-sm text-red-200">
      <div className="max-w-md space-y-2">
        <p className="font-semibold uppercase tracking-[0.25em] text-red-400">
          Accès refusé
        </p>
        <p>Vous n&apos;avez pas les autorisations nécessaires.</p>
      </div>
    </div>
  );
}

export default function AdminGuard({
  children,
  fallback = null,
}: GuardProps) {
  const { hasSystemRole, loading } = useRole();

  if (loading) {
    return <LoadingState />;
  }

  const isAdmin =
    hasSystemRole("admin") || hasSystemRole("super_admin");

  if (!isAdmin) {
    return <>{fallback ?? <DeniedState />}</>;
  }

  return <>{children}</>;
}
