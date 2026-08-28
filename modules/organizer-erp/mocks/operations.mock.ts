import type { OrganizerModuleMock } from '../types';
export const operationsMock: OrganizerModuleMock = {
  label: 'Centre des opérations', action: 'Créer une tâche',
  kpis: [{ label: 'Checklist', value: '82 %', detail: '41 / 50 tâches', tone: 'blue' }, { label: 'Blocages', value: '3', detail: '1 critique', tone: 'red' }, { label: 'Incidents', value: '2', detail: 'Tous maîtrisés', tone: 'amber' }, { label: 'Équipes terrain', value: '8', detail: 'Toutes joignables', tone: 'green' }],
  columns: ['Heure', 'Catégorie', 'Élément / Incident', 'Gravité', 'Responsable', 'Échéance', 'Statut'],
  rows: [
    ['14:00', 'Logistique', 'Installation cage et inspection', 'Haute', 'Équipe technique', 'J-1 · 18:00', 'En cours'],
    ['15:30', 'Sécurité', 'Briefing équipes et zones', 'Haute', 'H. Ratsimba', 'Jour J · 15:30', 'Planifié'],
    ['16:00', 'Médical', 'Contrôle ambulance et matériel', 'Critique', 'Dr F. Rakoto', 'Jour J · 16:00', 'À valider'],
    ['17:15', 'Production', 'Test son, lumière et écran', 'Moyenne', 'Régie', 'Jour J · 17:15', 'Planifié'],
    ['18:40', 'Incident', 'Barrière accès Sud déplacée', 'Faible', 'Sécurité 02', 'Immédiat', 'Résolu'],
  ],
  focus: { title: 'Logistique Jour J', items: [{ label: 'Cage / Ring', value: 'Installé', status: 'done' }, { label: 'Son & lumière', value: 'Tests à 17:15', status: 'pending' }, { label: 'Vestiaires', value: 'Prêts', status: 'done' }, { label: 'Catering', value: 'Livraison retardée', status: 'warning' }, { label: 'Transport', value: 'Confirmé', status: 'done' }] },
};
