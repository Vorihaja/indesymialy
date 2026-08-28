import { getWorkspaceDefinition, getWorkspaceSectionLabel } from '../config';
import type { WorkspaceRole, WorkspaceSection } from '../types';

export function WorkspaceSectionPage({ role, section }: { role: WorkspaceRole; section: WorkspaceSection }) {
  const workspace = getWorkspaceDefinition(role);
  return (
    <section className='erp-section-panel'>
      <p className='public-card-kicker'>{workspace.label} · Module opérationnel</p>
      <h2 className='ds-h2 mt-4'>{getWorkspaceSectionLabel(section)}</h2>
      <p className='mt-4 max-w-2xl text-sm leading-6 text-[var(--ds-text-2)]'>
        Fonctionnalité en cours de finalisation. La route, la navigation et l’architecture métier sont opérationnelles.
      </p>
      <div className='mt-8 grid grid-cols-3 gap-px bg-[var(--ds-border)]'>
        {['Accès sécurisé', 'Données synchronisées', 'Espace actif'].map((label) => (
          <div key={label} className='bg-[var(--ds-surface)] p-4'>
            <span className='text-[9px] font-extrabold uppercase tracking-[.14em] text-[var(--ds-muted)]'>{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
