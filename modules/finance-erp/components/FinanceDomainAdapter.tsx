import { SponsorBudgetFinanceView } from '../domain/SponsorBudgetFinanceView';
import { FederationFinanceReportsView } from '../domain/FederationFinanceReportsView';
import { LeagueFinanceReportsView } from '../domain/LeagueFinanceReportsView';

export type FinanceDomainAdapterView =
  | 'sponsor-budget'
  | 'federation-reports'
  | 'league-reports';

export function FinanceDomainAdapter({
  view,
}: {
  view: FinanceDomainAdapterView;
}) {
  if (view === 'sponsor-budget') {
    return <SponsorBudgetFinanceView />;
  }

  if (view === 'federation-reports') {
    return <FederationFinanceReportsView />;
  }

  return <LeagueFinanceReportsView />;
}
