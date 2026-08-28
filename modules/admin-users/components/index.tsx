"use client";
import { AdminDomainView, type AdminAccessLevel } from "@/modules/admin-core";
import type { AdminUsersData } from "../types";
export function AdminUsersPanel({ data, access, detailBasePath }: { data: AdminUsersData; access: AdminAccessLevel; detailBasePath?: string }) { return <AdminDomainView data={data} access={access} detailBasePath={detailBasePath} />; }
