"use client";
import { AdminDomainView, type AdminAccessLevel } from "@/modules/admin-core";
import type { AdminAnalyticsData } from "../types";
export function AdminAnalyticsPanel({ data, access, detailBasePath }: { data: AdminAnalyticsData; access: AdminAccessLevel; detailBasePath?: string }) { return <AdminDomainView data={data} access={access} detailBasePath={detailBasePath} />; }
