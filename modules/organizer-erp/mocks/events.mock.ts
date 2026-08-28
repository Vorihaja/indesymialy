import type { OrganizerModuleMock } from '../types';
export const eventsMock: OrganizerModuleMock = {
  label: 'Portefeuille événements', action: 'Créer un événement', creationMode: 'event',
  kpis: [
    { label: 'Événements', value: '18', detail: '5 actifs', tone: 'blue' },
    { label: 'À publier', value: '3', detail: 'Validation requise', tone: 'amber' },
    { label: 'Inscriptions', value: '426', detail: '+38 cette semaine', tone: 'green' },
    { label: 'Readiness moyen', value: '76 %', detail: 'Tous événements' },
  ],
  columns: ['Événement', 'Discipline', 'Date', 'Lieu', 'Statut', 'Combats', 'Remplissage', 'Readiness'],
  rows: [
    ['Mahajanga Fight Night Vol.3', 'MMA', '30 août 2026', 'Mahajanga', 'Préparation', '12', '84 %', '82 %'],
    ['Tana Striking Series', 'Kickboxing', '18 sept. 2026', 'Antananarivo', 'Publié', '10', '61 %', '74 %'],
    ['Boeny Grappling Open', 'Jiu-jitsu', '04 oct. 2026', 'Mahajanga', 'Brouillon', '28', '—', '46 %'],
    ['Moraingy National Cup', 'Moraingy', '22 nov. 2026', 'Toamasina', 'Inscriptions', '16', '39 %', '58 %'],
    ['Fight League Finals', 'MMA', '12 déc. 2026', 'Antsirabe', 'Planifié', '14', '22 %', '31 %'],
  ],
  progress: [{ label: 'Mahajanga Fight Night', value: 82, detail: '41 tâches terminées sur 50' }, { label: 'Tana Striking Series', value: 74, detail: 'Billetterie et staff en cours' }],
};
