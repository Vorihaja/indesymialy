'use client';

import { usePathname } from 'next/navigation';
import ClubWorkspace from '@/modules/clubs/components/ClubWorkspace';

export default function ClubLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === '/dashboard/club' || pathname === '/dashboard/club/') return children;
  return <ClubWorkspace>{children}</ClubWorkspace>;
}
