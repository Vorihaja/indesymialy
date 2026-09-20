'use client';

import { FinanceWorkspace } from '../components/FinanceWorkspace';
import type { FinanceTab } from '../types';
import { resolveFinanceExpectedScope } from '../owner-context';

export function FinanceFeature({
  role,
  initialTab = 'overview',
}: {
  role: string;
  initialTab?: FinanceTab;
}) {
  resolveFinanceExpectedScope(role);

  return (
    <FinanceWorkspace
      role={role}
      initialTab={initialTab}
    />
  );
}
