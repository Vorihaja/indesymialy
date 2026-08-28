import type { OrganizerModuleId, OrganizerModuleMock } from '../types';
import { eventTabSeeds } from './events-tabs.mock';
import { fightTabSeeds } from './fight-tabs.mock';
import { ticketTabSeeds } from './ticket-tabs.mock';
import { teamTabSeeds } from './team-tabs.mock';
import { operationsTabSeeds } from './operations-tabs.mock';
import { partnerTabSeeds } from './partners-tabs.mock';
import { financeTabSeeds } from './finance-tabs.mock';
import { performanceTabSeeds } from './performance-tabs.mock';
import { settingsTabSeeds } from './settings-tabs.mock';
import type { OrganizerTabSeed } from './tab-workflow.types';

const allSeeds: Partial<Record<OrganizerModuleId, Record<string, OrganizerTabSeed>>> = {
  events: eventTabSeeds,
  'fight-center': fightTabSeeds,
  ticketing: ticketTabSeeds,
  team: teamTabSeeds,
  operations: operationsTabSeeds,
  partners: partnerTabSeeds,
  finance: financeTabSeeds,
  performance: performanceTabSeeds,
  settings: settingsTabSeeds,
};

export function getOrganizerTabWorkflowMock(moduleId: OrganizerModuleId, tab: string, base: OrganizerModuleMock): OrganizerModuleMock {
  const seed = allSeeds[moduleId]?.[tab];
  if (!seed) return base;
  const rows = seed.rows.length > 0 ? seed.rows : base.rows;
  return {
    ...base,
    label: `${base.label} · ${tab}`,
    action: seed.action,
    creationMode: moduleId === 'events' && tab === 'Tous les événements' ? 'event' : undefined,
    kpis: [{ label: `${tab} · éléments`, value: String(rows.length), detail: 'Données mock de la section', tone: 'blue' }, ...base.kpis.slice(0, 4)],
    columns: seed.columns,
    rows,
    workflow: { label: `Workflow · ${tab}`, stages: seed.stages, activeStage: seed.activeStage ?? 1 },
    rowActions: seed.rowActions,
    focus: undefined,
  };
}
