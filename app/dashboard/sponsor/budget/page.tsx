import { FinanceFeature } from '@/modules/finance-erp';

export default function SponsorBudgetPage() {
  return (
    <FinanceFeature
      role="sponsor"
      initialTab="sponsor-budget"
    />
  );
}
