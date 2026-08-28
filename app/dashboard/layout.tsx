"use client";
import ErpAuthGuard from "../../components/auth/ErpAuthGuard";
import { ErpShell } from "@/modules/dashboard";
import { ProfileCompletionPrompt } from "@/components/auth/ProfileCompletionPrompt";
import { useRoleRequest } from "../../providers/roles/RoleRequestContext";
export { useRoleRequest };
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <ErpAuthGuard><ProfileCompletionPrompt /><ErpShell>{children}</ErpShell></ErpAuthGuard>;
}
