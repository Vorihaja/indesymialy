"use client";
import type { AdminAccessLevel } from "@/modules/admin-core";
import type { AdminUsersDomain } from "../types";
import { useAdminUsers } from "../hooks";
import { AdminUsersPanel } from "../components";
export function AdminUsersFeature({ domain = "users", access = "admin", detailBasePath }: { domain?: AdminUsersDomain; access?: AdminAccessLevel; detailBasePath?: string }) { const { data, loading, error } = useAdminUsers(domain); if (loading) return <p className="border border-[#303238] bg-[#151619] p-6 text-sm text-zinc-500">Chargement…</p>; if (error) return <p className="border border-red-500/30 bg-red-500/5 p-6 text-sm text-red-400">{error}</p>; return data ? <AdminUsersPanel data={data} access={access} detailBasePath={detailBasePath} /> : <p className="border border-dashed border-[#343840] bg-[#151619] p-6 text-sm text-zinc-500">Aucune donnée.</p>; }
