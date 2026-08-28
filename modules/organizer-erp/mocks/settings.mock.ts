import type { OrganizerModuleMock } from '../types';
export const settingsMock: OrganizerModuleMock = {
  label: 'Organisation & accès', action: 'Inviter un utilisateur',
  kpis: [{ label: 'Utilisateurs', value: '18', detail: '16 actifs', tone: 'blue' }, { label: 'Administrateurs', value: '3', detail: 'Accès complet' }, { label: 'Intégrations', value: '4 / 6', detail: '2 à configurer', tone: 'amber' }, { label: 'Dernière sauvegarde', value: '19:36', detail: 'Aujourd’hui', tone: 'green' }],
  columns: ['Utilisateur', 'Email', 'Rôle interne', 'Périmètre', 'Dernière activité', 'Statut'],
  rows: [
    ['Mamy Raveloson', 'mamy@indesy.mg', 'Administrateur', 'Organisation', 'Il y a 3 min', 'Actif'],
    ['Sarah Ranaivo', 'sarah@indesy.mg', 'Partenariats', 'Sponsors', 'Il y a 18 min', 'Actif'],
    ['Lova Andria', 'lova@indesy.mg', 'Fight Manager', 'Fight Center', 'Il y a 31 min', 'Actif'],
    ['Hery Ratsimba', 'hery@indesy.mg', 'Opérations', 'Jour J', 'Hier · 22:14', 'Actif'],
    ['Tiana Razafy', 'tiana@indesy.mg', 'Finance', 'Lecture seule', '05 août · 14:08', 'Invité'],
  ],
  focus: { title: 'Intégrations', items: [{ label: 'Paiement mobile', value: 'Connecté', status: 'done' }, { label: 'Email transactionnel', value: 'Connecté', status: 'done' }, { label: 'Contrôle d’accès', value: 'Connecté', status: 'done' }, { label: 'Streaming Fight Live', value: 'À configurer', status: 'warning' }] },
};
