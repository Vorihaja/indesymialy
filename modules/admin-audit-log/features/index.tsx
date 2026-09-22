"use client";

import type {
  AdminAccessLevel,
} from "@/modules/admin-core";

import {
  AdminAuditLogPanel,
} from "../components";
import {
  useAdminAuditLog,
} from "../hooks";
import type {
  AdminAuditLogDomain,
} from "../types";

export function AdminAuditLogFeature({
  domain = "audit-log",
  access = "admin",
}: {
  domain?: AdminAuditLogDomain;
  access?: AdminAccessLevel;
}) {
  const {
    data,
    loading,
    error,
  } = useAdminAuditLog(
    domain,
  );

  if (loading) {
    return (
      <p className="border border-[#303238] bg-[#151619] p-6 text-sm text-zinc-500">
        Chargement…
      </p>
    );
  }

  if (error) {
    return (
      <p className="border border-red-500/30 bg-red-500/5 p-6 text-sm text-red-400">
        {error}
      </p>
    );
  }

  return data ? (
    <AdminAuditLogPanel
      data={data}
      access={access}
    />
  ) : (
    <p className="border border-dashed border-[#343840] bg-[#151619] p-6 text-sm text-zinc-500">
      Aucune donnée.
    </p>
  );
}