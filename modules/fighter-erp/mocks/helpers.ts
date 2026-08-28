import type { OrganizerModuleMock } from '@/modules/organizer-erp/types';

export type FighterTabSeed = {
  columns: string[];
  rows: string[][];
  action: string;
  stages: string[];
  activeStage?: number;
  rowActions?: string[];
  progress?: OrganizerModuleMock['progress'];
  focus?: OrganizerModuleMock['focus'];
};

export function fighterMock(label: string, tab: string, seed: FighterTabSeed): OrganizerModuleMock {
  return {
    label,
    action: seed.action,
    kpis: [
      { label: 'Éléments', value: String(seed.rows.length), detail: `${tab} · suivi actif`, tone: 'blue' },
      { label: 'À traiter', value: String(Math.max(1, seed.rows.filter((row) => /attente|à faire|brouillon|planifié/i.test(row.at(-1) ?? '')).length)), detail: 'action requise', tone: 'amber' },
      { label: 'Validés', value: String(seed.rows.filter((row) => /validé|confirmé|actif|terminé|conforme|atteint/i.test(row.at(-1) ?? '')).length), detail: 'workflow complété', tone: 'green' },
      { label: 'Progression', value: `${Math.min(96, 52 + seed.rows.length * 7)} %`, detail: 'niveau de complétion', tone: 'red' },
    ],
    columns: seed.columns,
    rows: seed.rows,
    workflow: { label: `Workflow · ${tab}`, stages: seed.stages, activeStage: seed.activeStage ?? Math.min(2, seed.stages.length - 1) },
    rowActions: seed.rowActions ?? ['Valider', 'Envoyer une notification'],
    progress: seed.progress,
    focus: seed.focus,
  };
}

export const genericSeed: FighterTabSeed = {
  columns: ['Élément', 'Responsable', 'Échéance', 'Priorité', 'Statut'],
  rows: [
    ['Dossier principal', 'Rakoto Andry', '18 août 2026', 'Haute', 'En cours'],
    ['Validation complémentaire', 'Mialy R.', '22 août 2026', 'Normale', 'En attente'],
    ['Contrôle final', 'Coach Hery', '28 août 2026', 'Haute', 'Planifié'],
  ],
  action: 'Ajouter',
  stages: ['Création', 'Contrôle', 'Validation', 'Clôture'],
};
