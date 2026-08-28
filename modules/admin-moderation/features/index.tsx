"use client";
import type { AdminAccessLevel } from "@/modules/admin-core";
import type { AdminModerationDomain } from "../types";
import { useAdminModeration } from "../hooks";
import { AdminModerationPanel } from "../components";
export function AdminModerationFeature({ domain = "moderation", access = "admin", detailBasePath }: { domain?: AdminModerationDomain; access?: AdminAccessLevel; detailBasePath?: string }) { const { data, loading, error } = useAdminModeration(domain); if (loading) return <p className="border border-[#303238] bg-[#151619] p-6 text-sm text-zinc-500">Chargement…</p>; if (error) return <p className="border border-red-500/30 bg-red-500/5 p-6 text-sm text-red-400">{error}</p>; return data ? <AdminModerationPanel data={data} access={access} detailBasePath={detailBasePath} /> : <p className="border border-dashed border-[#343840] bg-[#151619] p-6 text-sm text-zinc-500">Aucune donnée.</p>; }
