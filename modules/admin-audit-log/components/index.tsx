"use client";
import { AdminDomainView, type AdminAccessLevel } from "@/modules/admin-core";
import type { AdminAuditLogData } from "../types";
export function AdminAuditLogPanel({ data, access, detailBasePath }: { data: AdminAuditLogData; access: AdminAccessLevel; detailBasePath?: string }) { return <AdminDomainView data={data} access={access} detailBasePath={detailBasePath} />; }
