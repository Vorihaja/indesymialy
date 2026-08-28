'use client';

import Link from 'next/link';
import { Badge, Button, SearchBar, Select } from '@/components/ui';
import type { AdminAccessLevel, AdminDomainData } from '../types';

export function AdminDomainView({ data, access, detailBasePath }: { data: AdminDomainData; access: AdminAccessLevel; detailBasePath?: string }) {
  return (
    <div className='space-y-7'>
      <header className='flex flex-wrap items-end justify-between gap-5 border-b border-[var(--ds-border)] pb-5'>
        <div>
          <p className='public-card-kicker'>{access === 'super-admin' ? 'Gouvernance système' : 'Administration opérationnelle'}</p>
          <h2 className='ds-h2 mt-3 uppercase'>{data.title}</h2>
          <p className='mt-3 max-w-3xl text-sm text-[var(--ds-text-2)]'>{data.description}</p>
        </div>
        <div className='flex flex-wrap gap-2'>
          {data.actions.map((action) => <Button key={action} type='button' variant='outline' size='sm'>{action}</Button>)}
        </div>
      </header>

      {data.metrics.length > 0 && (
        <section className='erp-kpi-grid' aria-label='Indicateurs administratifs'>
          {data.metrics.map((metric, index) => (
            <article key={metric.id} className='erp-kpi'>
              <div className='erp-kpi-index'><span>SYSTÈME</span><span>{String(index + 1).padStart(2, '0')}</span></div>
              <p className='erp-kpi-label'>{metric.label}</p>
              <p className='erp-kpi-value'>{metric.value.toLocaleString('fr-FR')}</p>
              <p className={metric.trend >= 0 ? 'erp-kpi-detail ds-success-text' : 'erp-kpi-detail ds-danger-text'}>
                {metric.trend >= 0 ? '▲ +' : '▼ '}{metric.trend}%
              </p>
            </article>
          ))}
        </section>
      )}

      <section className='overflow-hidden border border-[var(--ds-border-strong)] bg-[var(--ds-card)]'>
        <div className='grid gap-3 border-b border-[var(--ds-border)] p-3 sm:grid-cols-[1fr_220px_auto]'>
          <SearchBar aria-label='Rechercher' placeholder='Rechercher dans le registre…' />
          <Select aria-label='Filtrer'><option>Tous les statuts</option><option>Actif</option><option>En attente</option><option>Suspendu</option></Select>
          <Badge tone='info'>{data.rows.length} entrées</Badge>
        </div>
        {data.rows.length === 0 ? (
          <p className='p-10 text-center text-sm text-[var(--ds-muted)]'>Aucune donnée disponible.</p>
        ) : (
          <div className='overflow-x-auto'>
            <table className='min-w-[720px] text-sm'>
              <thead><tr>{data.columns.map((column) => <th key={column}>{column}</th>)}{detailBasePath && <th>Détail</th>}</tr></thead>
              <tbody>
                {data.rows.map((row) => (
                  <tr key={row.id}>
                    {row.cells.map((cell, index) => <td key={row.id + '-' + data.columns[index]}>{cell}</td>)}
                    {detailBasePath && <td><Link href={detailBasePath + '/' + row.id} className='font-bold uppercase text-[var(--ds-primary)]'>Ouvrir →</Link></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
