import type { FighterModule } from '../types';
import { defineErpTabs } from '@/modules/erp-navigation';

const tab = (id: string, label: string) => ({ id, label, legacyIds: [label] });

export const fighterModules: FighterModule[] = [
  { id: 'overview', label: 'Vue d’ensemble', tabs: [] },
  { id: 'profile', label: 'Profil sportif', tabs: defineErpTabs([tab('identity', 'Identité'), tab('disciplines', 'Disciplines'), tab('categories', 'Catégories'), tab('clubs', 'Clubs'), tab('documents', 'Documents')]) },
  { id: 'career', label: 'Carrière', tabs: defineErpTabs([tab('path', 'Parcours'), tab('record', 'Record'), tab('rankings', 'Classements'), tab('honors', 'Palmarès'), tab('contracts', 'Contrats')]) },
  { id: 'competitions', label: 'Compétitions', tabs: defineErpTabs([tab('invitations', 'Invitations'), tab('registrations', 'Inscriptions'), tab('fights', 'Combats'), tab('results', 'Résultats'), tab('calendar', 'Calendrier')]) },
  { id: 'finance', label: 'Finances', tabs: [] },
  { id: 'performance', label: 'Performance', tabs: defineErpTabs([tab('summary', 'Synthèse'), tab('sport', 'Sport'), tab('condition', 'Condition'), tab('fights', 'Combats')]) },
  { id: 'marketplace', label: 'Marketplace', tabs: [] },
  { id: 'calendar', label: 'Agenda', tabs: [] },
  { id: 'settings', label: 'Paramètres', tabs: defineErpTabs([tab('account', 'Compte'), tab('profile-verification', 'Vérification du profil'), tab('privacy', 'Confidentialité'), tab('notifications', 'Notifications'), tab('preferences', 'Préférences')]) },
  {
    id: 'fight-room',
    label: 'Fight Room',
    tabs: defineErpTabs([tab('live', 'Direct')]),
    live: true,
  },
];

// Conservés pour les lots futurs, mais volontairement absents du shell Fighter V1.
export const fighterFutureModules: FighterModule[] = [
  {
    id: 'training',
    label: 'Entraînement',
    tabs: defineErpTabs([tab('planning', 'Planning'), tab('sessions', 'Séances'), tab('programs', 'Programmes'), tab('attendance', 'Présences'), tab('goals', 'Objectifs')]),
  },
  {
    id: 'fight-preparation',
    label: 'Préparation combat',
    tabs: defineErpTabs([tab('camp', 'Camp'), tab('opponent', 'Adversaire'), tab('game-plan', 'Plan de combat'), tab('weight', 'Poids'), tab('checklist', 'Checklist')]),
  },
  {
    id: 'health',
    label: 'Médical & poids',
    tabs: defineErpTabs([tab('medical-follow-up', 'Suivi médical'), tab('certificates', 'Certificats'), tab('injuries', 'Blessures'), tab('weight', 'Poids'), tab('suspensions', 'Suspensions')]),
  },
  {
    id: 'team',
    label: 'Équipe',
    tabs: defineErpTabs([tab('staff', 'Encadrement'), tab('head-coach', 'Coach principal'), tab('staff-members', 'Staff'), tab('clubs', 'Clubs'), tab('invitations', 'Invitations')]),
  },
  {
    id: 'sponsors',
    label: 'Sponsors',
    tabs: defineErpTabs([tab('partners', 'Partenaires'), tab('offers', 'Offres'), tab('contracts', 'Contrats'), tab('deliverables', 'Livrables'), tab('visibility', 'Visibilité')]),
  },
];
