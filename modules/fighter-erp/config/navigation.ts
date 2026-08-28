import type { FighterModule } from '../types';

export const fighterModules: FighterModule[] = [
  { id: 'overview', label: 'Vue d’ensemble', tabs: [] },
  { id: 'profile', label: 'Profil sportif', tabs: ['Identité', 'Disciplines', 'Catégories', 'Clubs', 'Documents'] },
  { id: 'career', label: 'Carrière', tabs: ['Parcours', 'Record', 'Classements', 'Palmarès', 'Contrats'] },
  { id: 'training', label: 'Entraînement', tabs: ['Planning', 'Séances', 'Programmes', 'Présences', 'Objectifs'] },
  { id: 'fight-preparation', label: 'Préparation combat', tabs: ['Camp', 'Adversaire', 'Plan de combat', 'Poids', 'Checklist'] },
  { id: 'competitions', label: 'Compétitions', tabs: ['Invitations', 'Inscriptions', 'Combats', 'Résultats', 'Calendrier'] },
  { id: 'health', label: 'Médical & poids', tabs: ['Suivi médical', 'Certificats', 'Blessures', 'Poids', 'Suspensions'] },
  { id: 'team', label: 'Équipe', tabs: ['Encadrement', 'Coach principal', 'Staff', 'Clubs', 'Invitations'] },
  { id: 'finance', label: 'Contrats & finances', tabs: ['Synthèse', 'Contrats', 'Revenus', 'Dépenses', 'Paiements'] },
  { id: 'sponsors', label: 'Sponsors', tabs: ['Partenaires', 'Offres', 'Contrats', 'Livrables', 'Visibilité'] },
  { id: 'performance', label: 'Performance', tabs: ['Synthèse', 'Sport', 'Condition', 'Combats', 'Progression', 'Rapports'] },
  { id: 'marketplace', label: 'Marketplace', tabs: [] },
  { id: 'calendar', label: 'Agenda', tabs: [] },
  { id: 'settings', label: 'Paramètres', tabs: ['Compte', 'Vérification du profil', 'Confidentialité', 'Notifications', 'Préférences'] },
  { id: 'fight-room', label: 'Fight Room', tabs: ['Direct'], live: true },
];
