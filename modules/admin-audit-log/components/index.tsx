"use client";

import {
  AdminDomainView,
  type AdminAccessLevel,
} from "@/modules/admin-core";

import type {
  AdminAuditLogData,
} from "../types";

export function AdminAuditLogPanel({
  data,
  access,
}: {
  data: AdminAuditLogData;
  access: AdminAccessLevel;
}) {
  return (
    <AdminDomainView
      data={data}
      access={access}
    />
  );
}