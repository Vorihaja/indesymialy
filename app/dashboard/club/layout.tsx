'use client';

import { usePathname } from 'next/navigation';
import ClubWorkspace from '@/modules/clubs/components/ClubWorkspace';
import { FinanceErpRouteIntegration } from '@/modules/finance-erp/components/FinanceErpRouteIntegration';

export default function ClubLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const routeContent = (
    <FinanceErpRouteIntegration role="club">
      {children}
    </FinanceErpRouteIntegration>
  );

  if (pathname === '/dashboard/club' || pathname === '/dashboard/club/') {
    return routeContent;
  }

  return <ClubWorkspace>{routeContent}</ClubWorkspace>;
}
