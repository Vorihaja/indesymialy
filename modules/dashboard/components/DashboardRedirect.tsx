
"use client";

import {
  useEffect,
  useMemo,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  useAuthContext,
} from "@/providers/auth/auth-context";

import {
  getWorkspaceDashboardPath,
  getWorkspaceRegistryEntry,
} from "@/modules/workspace-registry";

export function DashboardRedirect() {
  const router = useRouter();

  const {
    primaryRole,
    systemRoles,
    loading,
  } = useAuthContext();

  const activeRole = useMemo(() => {
    const systemWorkspaceRole =
      systemRoles
        .map((role) => role.code)
        .find((role) => {
          const entry =
            getWorkspaceRegistryEntry(
              role,
            );

          return (
            entry?.accessKind ===
            "system"
          );
        });

    return (
      systemWorkspaceRole ??
      primaryRole
    );
  }, [
    primaryRole,
    systemRoles,
  ]);

  const destination =
    activeRole
      ? getWorkspaceDashboardPath(
          activeRole,
        )
      : null;

  useEffect(() => {
    if (
      !loading &&
      destination
    ) {
      router.replace(destination);
    }
  }, [
    destination,
    loading,
    router,
  ]);

  return (
    <div className="grid min-h-[calc(100vh-84px)] place-items-center bg-[#060a14] text-xs font-bold uppercase tracking-widest text-neutral-400">
      {loading || destination
        ? "Redirection vers votre espace…"
        : "Aucun rôle actif n’est associé à ce compte."}
    </div>
  );
}
