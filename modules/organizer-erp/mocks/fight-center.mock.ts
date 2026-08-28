import type { OrganizerModuleMock } from '../types';
export const fightCenterMock: OrganizerModuleMock = {
  label: 'Fight Card · Mahajanga Fight Night', action: 'Ajouter un combat',
  kpis: [
    { label: 'Combats', value: '12', detail: '10 confirmés', tone: 'red' },
    { label: 'Combattants', value: '24', detail: '22 validés', tone: 'blue' },
    { label: 'Pesées validées', value: '18 / 24', detail: '6 attendues', tone: 'amber' },
    { label: 'Remplacements', value: '2', detail: '1 à confirmer' },
  ],
  columns: ['#', 'Segment', 'Coin rouge', 'Coin bleu', 'Catégorie', 'Rounds', 'Statut', 'Horaire'],
  rows: [
    ['12', 'Main Event', 'Rakotoniana M.', 'Andriamahefa T.', 'Middleweight', '3 × 5 min', 'Confirmé', '22:10'],
    ['11', 'Co-Main Event', 'Raveloson J.', 'Randrianasolo P.', 'Lightweight', '3 × 5 min', 'Confirmé', '21:35'],
    ['10', 'Main Card', 'Razafindrakoto A.', 'Raharison K.', 'Welterweight', '3 × 5 min', 'Pesée', '21:00'],
    ['09', 'Main Card', 'Andrianjafy S.', 'Rakotoarisoa N.', 'Bantamweight', '3 × 3 min', 'Confirmé', '20:30'],
    ['08', 'Préliminaire', 'Rasolo F.', 'Rakotobe M.', 'Featherweight', '3 × 3 min', 'Remplaçant', '19:55'],
  ],
  focus: { title: 'Matchmaking · comparaison', items: [
    { label: 'Poids', value: '77,0 kg / 76,8 kg', status: 'done' }, { label: 'Record', value: '8-1-0 / 7-2-0', status: 'done' },
    { label: 'Expérience', value: '6 ans / 5 ans', status: 'done' }, { label: 'Disponibilité', value: 'Confirmée / Confirmée', status: 'done' },
  ] },
};
