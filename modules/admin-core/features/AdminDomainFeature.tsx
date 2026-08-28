'use client';

import { PublicEmpty, Skeleton } from '@/components/ui';
import type { AdminAccessLevel, AdminDomain } from '../types';
import { useAdminDomain } from '../hooks/useAdminDomain';
import { AdminDomainView } from '../components/AdminDomainView';

export function AdminDomainFeature({ domain, access = 'admin', detailBasePath }: { domain: AdminDomain; access?: AdminAccessLevel; detailBasePath?: string }) {
  const { data, loading, error } = useAdminDomain(domain);
  if (loading) return <div className='erp-kpi-grid'>{[0, 1, 2, 3].map((item) => <Skeleton key={item} className='h-[170px]' />)}</div>;
  if (error) return <PublicEmpty title='Centre de contrôle indisponible' description={error} />;
  if (!data) return <PublicEmpty title='Aucune donnée disponible' />;
  return <AdminDomainView data={data} access={access} detailBasePath={detailBasePath} />;
}
