import { RoleGuard } from "@/modules/auth/guards";
import { FinanceErpRouteIntegration } from "@/modules/finance-erp/components/FinanceErpRouteIntegration";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard role="league">
      <FinanceErpRouteIntegration role="ligue">
        {children}
      </FinanceErpRouteIntegration>
    </RoleGuard>
  );
}
