'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Skeleton } from '@/components/ui';
import { useWorkspaceDashboard } from '../hooks/useWorkspaceDashboard';
import type { WorkspaceRole } from '../types';

export function WorkspaceDashboard({ role }: { role: WorkspaceRole }) {
  const { snapshots, loading } = useWorkspaceDashboard(role);
  const reduceMotion = useReducedMotion();
  if (loading) {
    return (
      <section className='erp-kpi-grid' aria-label='Chargement des indicateurs'>
        {[0, 1, 2].map((item) => <Skeleton key={item} className='h-[170px]' />)}
      </section>
    );
  }

  return (
    <section className='erp-kpi-grid' aria-label='Indicateurs de l’espace'>
      {snapshots.map((item, index) => (
        <motion.article
          key={item.title}
          className='erp-kpi'
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduceMotion ? 0 : index * 0.06, duration: reduceMotion ? 0 : 0.36 }}
        >
          <div className='erp-kpi-index'><span>INDICATEUR</span><span>{String(index + 1).padStart(2, '0')}</span></div>
          <p className='erp-kpi-label'>{item.title}</p>
          <p className='erp-kpi-value'>{item.value}</p>
          <p className='erp-kpi-detail'>{item.detail}</p>
        </motion.article>
      ))}
    </section>
  );
}
