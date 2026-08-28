import type { OrganizerModule } from '../types';

export const organizerModules: OrganizerModule[] = [
  { id: 'overview', label: 'Vue d’ensemble', tabs: ['Synthèse', 'Alertes', 'Activité', 'Échéances'] },
  { id: 'events', label: 'Événements', tabs: ['Tous les événements', 'Compétitions', 'Inscriptions', 'Catégories', 'Clubs engagés', 'Coorganisations', 'Planning'] },
  { id: 'fight-center', label: 'Fight Center', tabs: ['Fight Card', 'Combats', 'Combattants', 'Matchmaking', 'Pesée', 'Officiels', 'Remplacements', 'Fight Live', 'Résultats'] },
  { id: 'ticketing', label: 'Billetterie', tabs: ['Vue d’ensemble', 'Types de billets', 'Ventes', 'Quotas', 'Invitations', 'Contrôle d’accès', 'Remboursements'] },
  { id: 'team', label: 'Équipe & Officiels', tabs: ['Staff', 'Bénévoles', 'Arbitres', 'Juges', 'Officiels', 'Affectations', 'Accréditations'] },
  { id: 'operations', label: 'Opérations', tabs: ['Planning', 'Checklists', 'Logistique', 'Sécurité', 'Médical', 'Communication', 'Documents', 'Incidents'] },
  { id: 'partners', label: 'Partenaires', tabs: ['Sponsors', 'Partenaires', 'Contrats', 'Packages', 'Visibilité', 'Activations', 'Livrables'] },
  { id: 'finance', label: 'Finances', tabs: ['Vue business', 'Synthèse', 'Budget', 'Revenus', 'Dépenses', 'Paiements', 'Transactions', 'Factures'] },
  { id: 'performance', label: 'Performance', tabs: ['Résultats', 'Sport', 'Billetterie', 'Finances', 'Opérations', 'Audience', 'Rapports'] },
  { id: 'marketplace', label: 'Marketplace', tabs: [] },
  { id: 'calendar', label: 'Agenda', tabs: [] },
  { id: 'settings', label: 'Paramètres', tabs: ['Organisation', 'Vérification organisation', 'Utilisateurs & droits', 'Intégrations'] },
  { id: 'personnel', label: 'Personnel', tabs: [] },
  { id: 'control-room', label: 'Jour J / Control Room', tabs: ['Direct'], live: true },
];
