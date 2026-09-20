import { FinanceErpRouteIntegration } from "@/modules/finance-erp/components/FinanceErpRouteIntegration";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <FinanceErpRouteIntegration role="sponsor">
      {children}
    </FinanceErpRouteIntegration>
  );
}
