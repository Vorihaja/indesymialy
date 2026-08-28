import type { OrganizerAlertMock, OrganizerKpiMock } from '../types';

export const dashboardKpis: OrganizerKpiMock[] = [
  { label: 'Événements actifs', value: '5', detail: '2 dans les 30 prochains jours', tone: 'info' },
  { label: 'Billets vendus', value: '12 842', detail: '+1 264 cette semaine', tone: 'success' },
  { label: 'Taux de remplissage', value: '68 %', detail: 'Capacité cumulée : 18 900' },
  { label: 'Revenus billetterie', value: '52 400 000 Ar', detail: 'Objectif atteint à 74 %', tone: 'success' },
  { label: 'Officiels confirmés', value: '48', detail: '3 confirmations attendues', tone: 'info' },
  { label: 'Sponsors actifs', value: '14', detail: '2 contrats à renouveler', tone: 'danger' },
];

export const priorityEvent = {
  name: 'Mahajanga Fight Night Vol.3', venue: 'Stade Rabemananjara', date: '30 août 2026', readiness: 82,
  countdown: 'J-19 · 06:17:42', fights: 12, tickets: '1 842 / 2 200', status: 'EN PRÉPARATION',
};

export const criticalAlerts: OrganizerAlertMock[] = [
  { label: 'Paiement arbitres en attente', detail: '6 paiements à valider avant le 14 août', severity: 'critical' },
  { label: 'Capacité billetterie proche limite', detail: 'Zone Tribune A remplie à 92 %', severity: 'warning' },
  { label: 'Accréditations expirant bientôt', detail: '8 accréditations expirent sous 7 jours', severity: 'warning' },
  { label: 'Document sécurité manquant', detail: 'Plan d’évacuation final non déposé', severity: 'critical' },
  { label: 'Contrat sponsor à renouveler', detail: 'Package BOENY arrive à échéance', severity: 'info' },
];

export const currentFight = {
  red: 'RAKOTONIANA M.', blue: 'ANDRIAMAHEFA T.', round: '2 / 3', timer: '02:48', referee: 'H. Razafindrakoto', judges: '3 confirmés', status: 'PRÊT',
};

export const overviewBlocks = [
  { label: 'Billetterie', value: '68 %', detail: '1 842 billets vendus', progress: 68 },
  { label: 'Équipe & Officiels', value: '48 / 51', detail: '3 confirmations attendues', progress: 94 },
  { label: 'Checklist opérationnelle', value: '41 / 50', detail: '9 tâches encore ouvertes', progress: 82 },
  { label: 'Finances événement', value: '33,2 M Ar', detail: 'Solde prévisionnel', progress: 72 },
];

export const recentActivity = [
  ['19:04', 'Billetterie', 'Lot Tribune B publié', 'M. Raveloson'],
  ['18:32', 'Fight Center', 'Combat #08 confirmé', 'L. Andria'],
  ['17:48', 'Partenaires', 'Livrable BOENY validé', 'S. Ranaivo'],
  ['16:15', 'Équipe', 'Deux juges accrédités', 'A. Rakoto'],
  ['14:50', 'Opérations', 'Inspection médicale planifiée', 'C. Rasoanaivo'],
];
