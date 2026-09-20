import { FinanceFeature } from '@/modules/finance-erp';

export default function PaymentsPage() {
  return (
    <FinanceFeature
      role='ligue'
      initialTab='transactions'
    />
  );
}
