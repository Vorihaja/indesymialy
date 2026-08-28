"use client";
import { AdminDomainView, type AdminAccessLevel } from "@/modules/admin-core";
import type { AdminPlatformHealthData } from "../types";
export function AdminPlatformHealthPanel({ data, access, detailBasePath }: { data: AdminPlatformHealthData; access: AdminAccessLevel; detailBasePath?: string }) { return <AdminDomainView data={data} access={access} detailBasePath={detailBasePath} />; }
