"use client";
import { AdminDomainView, type AdminAccessLevel } from "@/modules/admin-core";
import type { AdminModerationData } from "../types";
export function AdminModerationPanel({ data, access, detailBasePath }: { data: AdminModerationData; access: AdminAccessLevel; detailBasePath?: string }) { return <AdminDomainView data={data} access={access} detailBasePath={detailBasePath} />; }
