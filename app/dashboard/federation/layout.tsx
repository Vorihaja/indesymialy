import { RoleGuard } from "@/modules/auth/guards";
import { FinanceErpRouteIntegration } from "@/modules/finance-erp/components/FinanceErpRouteIntegration";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard role="federation">
      <FinanceErpRouteIntegration role="federation">
        {children}
      </FinanceErpRouteIntegration>
    </RoleGuard>
  );
}
