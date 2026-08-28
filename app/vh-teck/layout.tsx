import ErpAuthGuard from "@/components/auth/ErpAuthGuard";

import {
  SystemRoleGuard,
} from "@/modules/auth/guards";

import {
  SuperAdminShell,
} from "@/modules/super-admin";

export default function VhTeckLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErpAuthGuard>
      <SystemRoleGuard role="super_admin">
        <SuperAdminShell>
          {children}
        </SuperAdminShell>
      </SystemRoleGuard>
    </ErpAuthGuard>
  );
}
