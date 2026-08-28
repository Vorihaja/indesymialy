"use client";
import { AdminDomainFeature, type AdminAccessLevel } from "@/modules/admin-core";
export function AdminControlCenterFeature({ access = "admin" }: { access?: AdminAccessLevel }) { return <AdminDomainFeature domain="dashboard" access={access} />; }
