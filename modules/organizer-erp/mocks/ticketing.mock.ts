import type { OrganizerModuleMock } from '../types';
export const ticketingMock: OrganizerModuleMock = {
  label: 'Pilotage billetterie', action: 'Créer un type de billet',
  kpis: [
    { label: 'Billets vendus', value: '1 842', detail: 'sur 2 700', tone: 'blue' },
    { label: 'Chiffre d’affaires', value: '52,4 M Ar', detail: '+12 % vs objectif', tone: 'green' },
    { label: 'Remplissage', value: '68 %', detail: 'Tribune A à 92 %', tone: 'amber' },
    { label: 'Scans valides', value: '1 406', detail: '76 % des ventes' },
  ],
  columns: ['Heure', 'Billet', 'Nom', 'Zone', 'Résultat', 'Agent', 'Canal'],
  rows: [
    ['19:41:08', 'MFN-VIP-01842', 'R. Andriantsalama', 'VIP', 'Valide', 'Poste 03', 'Web'],
    ['19:40:52', 'MFN-TA-01026', 'H. Rakotovao', 'Tribune A', 'Valide', 'Poste 01', 'Mobile money'],
    ['19:40:39', 'MFN-TB-00882', 'M. Razafy', 'Tribune B', 'Déjà scanné', 'Poste 02', 'Revendeur'],
    ['19:40:21', 'INV-SP-00044', 'S. Raveloson', 'Sponsor', 'Valide', 'Poste VIP', 'Invitation'],
    ['19:39:58', 'MFN-TA-01104', 'T. Rajaonarivo', 'Tribune A', 'Refusé', 'Poste 01', 'Web'],
  ],
  progress: [{ label: 'VIP', value: 88, detail: '220 / 250' }, { label: 'Tribune A', value: 92, detail: '736 / 800' }, { label: 'Tribune B', value: 55, detail: '660 / 1 200' }],
  ticketTypes: {
    columns: ['Nom', 'Code', 'Catégorie', 'Zone', 'Prix', 'Quota', 'Vendus', 'Période de vente', 'Canaux', 'Statut'],
    rows: [
      ['VIP Gold', 'MFN-VIP', 'VIP', 'Salon VIP + Cage', '150 000 Ar', '250', '220', '01 juin → 29 août', 'Web, Revendeurs', 'Publié'],
      ['Tribune A', 'MFN-TA', 'Standard', 'Tribune A', '45 000 Ar', '800', '736', '01 juin → 30 août', 'Tous les canaux', 'Publié'],
      ['Tribune B', 'MFN-TB', 'Standard', 'Tribune B', '25 000 Ar', '1 200', '660', '15 juin → 30 août', 'Web, Mobile money', 'Publié'],
      ['Early Bird', 'MFN-EARLY', 'Promotionnel', 'Tribunes A et B', '20 000 Ar', '300', '300', '01 → 15 juin', 'Web', 'Épuisé'],
      ['Invitation Sponsor', 'INV-SP', 'Invitation', 'VIP + Sponsor', 'Gratuit', '150', '94', '01 juillet → 30 août', 'Back-office', 'Actif'],
    ],
  },
};
