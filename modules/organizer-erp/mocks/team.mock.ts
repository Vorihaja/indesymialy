import type { OrganizerModuleMock } from '../types';
export const teamMock: OrganizerModuleMock = {
  label: 'Équipe & Officiels', action: 'Ajouter une personne',
  kpis: [{ label: 'Équipe totale', value: '89', detail: '86 confirmés', tone: 'blue' }, { label: 'Arbitres', value: '6', detail: '100 % confirmés', tone: 'green' }, { label: 'Juges', value: '12', detail: '11 confirmés', tone: 'amber' }, { label: 'Accréditations', value: '74 / 89', detail: '15 à produire' }],
  columns: ['Personne', 'Rôle', 'Mission', 'Zone', 'Horaires', 'Accréditation', 'Statut'],
  rows: [
    ['Hery Razafindrakoto', 'Arbitre central', 'Main card', 'Cage', '19:30–23:00', 'OFF-0018', 'Confirmé'],
    ['Lova Andriamanana', 'Juge', 'Combats 08–12', 'Table A', '19:15–23:00', 'OFF-0021', 'Confirmé'],
    ['Miora Raveloson', 'Responsable accès', 'Supervision entrées', 'Entrée Nord', '16:00–22:30', 'STA-0042', 'Confirmé'],
    ['Toky Randria', 'Bénévole', 'Accueil combattants', 'Backstage', '15:00–21:00', 'VOL-0014', 'À confirmer'],
    ['Fara Rakoto', 'Médecin', 'Médecin de cage', 'Médical', '18:00–23:30', 'MED-0003', 'Confirmé'],
  ],
  progress: [{ label: 'Staff', value: 93, detail: '38 / 41 confirmés' }, { label: 'Officiels', value: 92, detail: '11 / 12 confirmés' }, { label: 'Bénévoles', value: 88, detail: '32 / 36 confirmés' }],
};
