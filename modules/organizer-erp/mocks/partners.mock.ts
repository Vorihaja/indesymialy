import type { OrganizerModuleMock } from '../types';
export const partnersMock: OrganizerModuleMock = {
  label: 'Sponsors & Partenaires', action: 'Ajouter un sponsor',
  kpis: [{ label: 'Sponsors actifs', value: '14', detail: '6 premium', tone: 'blue' }, { label: 'Valeur contrats', value: '38,5 M Ar', detail: '+18 % vs Vol.2', tone: 'green' }, { label: 'Livrables', value: '46 / 51', detail: '5 à finaliser', tone: 'amber' }, { label: 'Paiements reçus', value: '91 %', detail: '3,4 M Ar attendus' }],
  columns: ['Sponsor', 'Package', 'Contrat', 'Montant', 'Paiement', 'Livrables', 'Responsable'],
  rows: [
    ['BOENY', 'Title Partner', 'Signé', '12 000 000 Ar', 'Reçu', '4 / 5', 'S. Ranaivo'],
    ['TELMA', 'Gold', 'Signé', '8 500 000 Ar', 'Reçu', '6 / 6', 'M. Raveloson'],
    ['STAR', 'Gold', 'Signé', '7 000 000 Ar', 'Partiel', '5 / 6', 'S. Ranaivo'],
    ['BMOI', 'Silver', 'À renouveler', '4 500 000 Ar', 'En attente', '3 / 4', 'T. Andria'],
    ['AIR MADAGASCAR', 'Transport', 'Signé', 'En nature', 'Validé', '4 / 4', 'M. Raveloson'],
  ],
  focus: { title: 'BOENY · suivi activation', items: [{ label: 'Contrat', value: 'Signé', status: 'done' }, { label: 'Paiement', value: 'Reçu', status: 'done' }, { label: 'Logo affiche', value: 'Livré', status: 'done' }, { label: 'Cage', value: 'Installé', status: 'done' }, { label: 'Stand VIP', value: 'À confirmer', status: 'warning' }, { label: 'Publication', value: 'Publiée', status: 'done' }] },
};
