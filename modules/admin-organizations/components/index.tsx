"use client";
import { AdminDomainView, type AdminAccessLevel } from "@/modules/admin-core";
import type { AdminOrganizationsData } from "../types";
export function AdminOrganizationsPanel({ data, access, detailBasePath }: { data: AdminOrganizationsData; access: AdminAccessLevel; detailBasePath?: string }) { return <AdminDomainView data={data} access={access} detailBasePath={detailBasePath} />; }
