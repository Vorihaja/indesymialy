"use client";

import ErpAuthGuard from "../../components/auth/ErpAuthGuard";
import { useRoleRequest } from "../../providers/roles/RoleRequestContext";
export { useRoleRequest };

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <ErpAuthGuard>{children}</ErpAuthGuard>;
}
