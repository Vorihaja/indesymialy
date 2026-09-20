'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, ChevronRight, CircleDot, Plus, ShieldAlert } from 'lucide-react';
import { Alert, Badge, Progress, SectionHeader, Table } from '@/components/ui';
import type { OrganizerSectionSnapshot } from '../types';
import { OrganizerKpiGrid } from './OrganizerKpiGrid';

const statusLabel = { done: 'Terminé', active: 'En cours', blocked: 'Bloqué', planned: 'Planifié' } as const;
const statusTone = { done: 'success', active: 'info', blocked: 'danger', planned: 'neutral' } as const;

export function OrganizerSectionView({ snapshot }: { snapshot: OrganizerSectionSnapshot }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div className='organizer-control' initial={reduceMotion ? undefined : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Link className='organizer-back-link' href='/dashboard/organisateur'><ArrowLeft size={15} /> Centre de contrôle</Link>
      <SectionHeader eyebrow={snapshot.eyebrow} title={snapshot.title} description={snapshot.description} actions={snapshot.primaryAction ? <Link href='/dashboard/organisateur/events/new' className='ds-button ds-primary'><Plus size={16} />{snapshot.primaryAction}</Link> : undefined} />
      <div className='organizer-event-signal'><div><span className='organizer-live-dot' aria-hidden='true' /><span>POSTE OPÉRATIONNEL</span></div><strong>Données synchronisées</strong><span className='ds-caption'>Préparation globale {snapshot.readiness}%</span></div>
      <OrganizerKpiGrid metrics={snapshot.metrics} />
      {snapshot.records && <section className='erp-section-panel' aria-labelledby='records-heading'>
        <div className='organizer-panel-heading'><div><span className='ds-label'>DONNÉES OPÉRATIONNELLES</span><h2 id='records-heading' className='ds-h2'>Éléments opérationnels</h2></div><Badge tone='success'>{snapshot.records.length} résultat{snapshot.records.length > 1 ? 's' : ''}</Badge></div>
        {snapshot.records.length ? <Table><thead><tr><th>Élément</th><th>Détail</th><th>Statut</th><th>Accès</th></tr></thead><tbody>{snapshot.records.map((record) => <tr key={record.id}><td><strong>{record.title}</strong></td><td>{record.detail}</td><td><Badge tone='info'>{record.status}</Badge></td><td>{record.href ? <Link className='organizer-text-link' href={record.href}>Ouvrir <ChevronRight size={14} /></Link> : <span className='ds-caption'>—</span>}</td></tr>)}</tbody></Table> : <p className='organizer-empty-row'>Aucune donnée persistée pour l’événement actif.</p>}
      </section>}
      <section className='erp-section-panel' aria-labelledby='capabilities-heading'>
        <div className='organizer-panel-heading'><div><span className='ds-label'>COUVERTURE MÉTIER</span><h2 id='capabilities-heading' className='ds-h2'>Fonctions du poste</h2></div></div>
        <div className='organizer-capability-grid'>{snapshot.capabilities.map((capability, index) => <article key={capability}><span>{String(index + 1).padStart(2, '0')}</span><strong>{capability}</strong><Badge tone='info'>Préparé</Badge></article>)}</div>
      </section>
      <div className='organizer-layout organizer-layout-main'>
        <section className='erp-section-panel' aria-labelledby='workflow-heading'>
          <div className='organizer-panel-heading'><div><span className='ds-label'>PROCESSUS</span><h2 id='workflow-heading' className='ds-h2'>Chaîne de validation</h2></div><CircleDot aria-hidden='true' /></div>
          <ol className='organizer-workflow'>
            {snapshot.workflow.map((step, index) => <li key={step.id}><span className='organizer-workflow-index'>{String(index + 1).padStart(2, '0')}</span><div><strong>{step.label}</strong><p>{step.owner} · {step.due}</p></div><Badge tone={statusTone[step.status]}>{statusLabel[step.status]}</Badge>{step.status === 'done' ? <CheckCircle2 aria-hidden='true' /> : <ChevronRight aria-hidden='true' />}</li>)}
          </ol>
        </section>
        <aside className='erp-section-panel organizer-alerts' aria-labelledby='section-alerts-heading'>
          <div className='organizer-panel-heading'><div><span className='ds-label'>CONTRÔLES</span><h2 id='section-alerts-heading' className='ds-h2'>Points d’attention</h2></div><ShieldAlert aria-hidden='true' /></div>
          {snapshot.alerts.map((alert) => <Alert key={alert.id} tone={alert.severity === 'critical' ? 'danger' : 'warning'} title={alert.title}>{alert.detail}</Alert>)}
          <div className='organizer-readiness-card'><div><span className='ds-label'>NIVEAU DE PRÉPARATION</span><strong>{snapshot.readiness}%</strong></div><Progress value={snapshot.readiness} /></div>
        </aside>
      </div>
    </motion.div>
  );
}
