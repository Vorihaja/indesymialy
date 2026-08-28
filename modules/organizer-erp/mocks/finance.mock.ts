import type { OrganizerModuleMock } from '../types';
export const financeMock: OrganizerModuleMock = {
  label: 'Synthèse financière', action: 'Enregistrer une transaction',
  kpis: [{ label: 'Budget prévisionnel', value: '120 M Ar', detail: 'Version validée' }, { label: 'Revenus', value: '94,5 M Ar', detail: '78,8 % du budget', tone: 'green' }, { label: 'Dépenses engagées', value: '61,3 M Ar', detail: '51,1 % du budget', tone: 'amber' }, { label: 'Dépenses payées', value: '48,7 M Ar', detail: '12,6 M Ar à payer' }, { label: 'Solde prévisionnel', value: '33,2 M Ar', detail: 'Marge 27,6 %', tone: 'blue' }],
  columns: ['Date', 'Référence', 'Catégorie', 'Libellé', 'Type', 'Montant', 'Statut'],
  rows: [
    ['10 août', 'FAC-2026-0184', 'Billetterie', 'Ventes web semaine 32', 'Revenu', '+8 420 000 Ar', 'Confirmé'],
    ['09 août', 'PAY-2026-0092', 'Officiels', 'Acompte arbitres', 'Dépense', '-2 400 000 Ar', 'À valider'],
    ['08 août', 'CTR-BOENY-03', 'Sponsors', 'Paiement package BOENY', 'Revenu', '+12 000 000 Ar', 'Reçu'],
    ['07 août', 'FAC-2026-0178', 'Production', 'Son, lumière et écran', 'Dépense', '-7 800 000 Ar', 'Payé'],
    ['06 août', 'FAC-2026-0171', 'Sécurité', 'Prestataire sécurité', 'Dépense', '-4 250 000 Ar', 'Engagé'],
  ],
  progress: [{ label: 'Billetterie', value: 74, detail: '52,4 M / 70 M Ar' }, { label: 'Sponsoring', value: 91, detail: '31,8 M / 35 M Ar' }, { label: 'Dépenses', value: 51, detail: '61,3 M / 120 M Ar' }],
};
