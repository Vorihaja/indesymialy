import { requirePrivateAccess } from "@/modules/auth/private-access/server";
import { SuperAdminShell } from "@/modules/super-admin";

export default async function VhTeckLayout({ children }: { children: React.ReactNode }) {
  await requirePrivateAccess("super_admin");
  return <SuperAdminShell>{children}</SuperAdminShell>;
}
