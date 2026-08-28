'use client';

import type { ReactNode } from 'react';
import { useDashboardContext } from '../hooks';

export function ErpWorkspace({ children }: { children: ReactNode }) {
  const { sidebarCollapsed } = useDashboardContext();

  return (
    <div className='erp-workspace' data-collapsed={sidebarCollapsed}>
      <div className='erp-workspace-inner'>{children}</div>
    </div>
  );
}