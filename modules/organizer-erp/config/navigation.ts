import type { OrganizerModule } from '../types';
import { defineErpTabs } from '@/modules/erp-navigation';

const tab = (id: string, label: string) => ({ id, label, legacyIds: [label] });

export const organizerModules: OrganizerModule[] = [
  { id: 'overview', label: 'Vue d’ensemble', tabs: defineErpTabs([tab('summary', 'Synthèse'), tab('alerts', 'Alertes'), tab('activity', 'Activité'), tab('deadlines', 'Échéances')]) },
  { id: 'events', label: 'Événements', tabs: defineErpTabs([tab('all-events', 'Tous les événements'), tab('competitions', 'Compétitions'), tab('registrations', 'Inscriptions'), tab('categories', 'Catégories'), tab('engaged-clubs', 'Clubs engagés'), tab('coorganizations', 'Coorganisations'), tab('planning', 'Planning')]) },
  { id: 'fight-center', label: 'Fight Center', tabs: defineErpTabs([tab('fight-card', 'Fight Card'), tab('fights', 'Combats'), tab('fighters', 'Combattants'), tab('matchmaking', 'Matchmaking'), tab('weigh-in', 'Pesée'), tab('officials', 'Officiels'), tab('replacements', 'Remplacements'), tab('fight-live', 'Fight Live'), tab('results', 'Résultats')]) },
  { id: 'ticketing', label: 'Billetterie', tabs: defineErpTabs([tab('summary', 'Vue d’ensemble'), tab('ticket-types', 'Types de billets'), tab('sales', 'Ventes'), tab('quotas', 'Quotas'), tab('invitations', 'Invitations'), tab('access-control', 'Contrôle d’accès'), tab('refunds', 'Remboursements')]) },
  { id: 'team', label: 'Équipe & Officiels', tabs: defineErpTabs([tab('staff', 'Staff'), tab('volunteers', 'Bénévoles'), tab('referees', 'Arbitres'), tab('judges', 'Juges'), tab('officials', 'Officiels'), tab('assignments', 'Affectations'), tab('accreditations', 'Accréditations')]) },
  { id: 'operations', label: 'Opérations', tabs: defineErpTabs([tab('planning', 'Planning'), tab('checklists', 'Checklists'), tab('logistics', 'Logistique'), tab('security', 'Sécurité'), tab('medical', 'Médical'), tab('communication', 'Communication'), tab('documents', 'Documents'), tab('incidents', 'Incidents')]) },
  { id: 'partners', label: 'Partenaires', tabs: defineErpTabs([tab('sponsors', 'Sponsors'), tab('partners', 'Partenaires'), tab('contracts', 'Contrats'), tab('packages', 'Packages'), tab('visibility', 'Visibilité'), tab('activations', 'Activations'), tab('deliverables', 'Livrables')]) },
  { id: 'finance', label: 'Finances', tabs: [] },
  { id: 'performance', label: 'Performance', tabs: defineErpTabs([tab('results', 'Résultats'), tab('sport', 'Sport'), tab('ticketing', 'Billetterie'), tab('finance', 'Finances'), tab('operations', 'Opérations'), tab('audience', 'Audience'), tab('reports', 'Rapports')]) },
  { id: 'marketplace', label: 'Marketplace', tabs: [] },
  { id: 'calendar', label: 'Agenda', tabs: [] },
  { id: 'settings', label: 'Paramètres', tabs: defineErpTabs([tab('organization', 'Organisation'), tab('organization-verification', 'Vérification organisation'), tab('users-permissions', 'Utilisateurs & droits'), tab('integrations', 'Intégrations')]) },
  { id: 'personnel', label: 'Personnel', tabs: [] },
  { id: 'control-room', label: 'Jour J / Control Room', tabs: defineErpTabs([tab('live', 'Direct')]), live: true },
];
