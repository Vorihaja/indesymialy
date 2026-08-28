import type { UniversalRoleId } from '@/modules/universal-erp/types';
import type { PersonnelTab } from './types';

export const personnelTabs: Array<{ id: PersonnelTab; label: string }> = [
  { id: 'directory', label: 'Annuaire' },
  { id: 'invitations', label: 'Invitations' },
  { id: 'roles', label: 'Rôles & droits' },
  { id: 'assignments', label: 'Affectations' },
  { id: 'attendance', label: 'Présences' },
  { id: 'leave', label: 'Congés' },
  { id: 'documents', label: 'Documents' },
  { id: 'payroll', label: 'Rémunérations' },
];

export const personnelRoleContexts: Partial<Record<UniversalRoleId, string>> = {
  'super-admin': 'Indesy Mialy Platform',
  admin: 'Administration Indesy Mialy',
  federation: 'Fédération Malagasy des Sports de Combat',
  league: 'Ligue Analamanga',
  club: 'Dojo Sakura',
  coach: 'Équipe Coach Hery',
  sponsor: 'Boeny Nutrition',
  seller: 'Combat Store Madagascar',
};

export const personnelEnabledRoles = new Set<UniversalRoleId>(Object.keys(personnelRoleContexts) as UniversalRoleId[]);
