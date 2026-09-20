import { FinanceFeature } from '@/modules/finance-erp';

export default function FederationReportsPage() {
  return (
    <FinanceFeature
      role="federation"
      initialTab="federation-reports"
    />
  );
}
