"use client";
import { AdminDomainView, type AdminAccessLevel } from "@/modules/admin-core";
import type { AdminSettingsData } from "../types";
export function AdminSettingsPanel({ data, access, detailBasePath }: { data: AdminSettingsData; access: AdminAccessLevel; detailBasePath?: string }) { return <AdminDomainView data={data} access={access} detailBasePath={detailBasePath} />; }
