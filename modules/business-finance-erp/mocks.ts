import type { BusinessTransaction } from './types';

export function createBusinessFinanceMock(roleLabel: string): BusinessTransaction[] {
  const activity = roleLabel === 'Vendeur' ? 'Ventes marketplace' : roleLabel === 'Sponsor' ? 'Prestations marketing' : roleLabel === 'Fan' ? 'Remboursement billet' : roleLabel === 'Arbitre' || roleLabel === 'Juge' ? 'Indemnité événement' : roleLabel === 'Coach' ? 'Honoraires coaching' : 'Revenus d’activité';
  return [
    { id: 'trx-001', date: '2026-08-12', type: 'Recette', category: activity, label: `${activity} · août`, reference: 'REC-2026-0842', amount: 8420000, method: 'Virement', status: 'Confirmé' },
    { id: 'trx-002', date: '2026-08-10', type: 'Dépense', category: 'Opérations', label: 'Prestations et logistique', reference: 'DEP-2026-0318', amount: 3180000, method: 'Mobile money', status: 'Confirmé' },
    { id: 'trx-003', date: '2026-08-08', type: 'Recette', category: 'Partenariats', label: 'Acompte contrat partenaire', reference: 'REC-2026-0794', amount: 6400000, method: 'Virement', status: 'Confirmé' },
    { id: 'trx-004', date: '2026-08-06', type: 'Dépense', category: 'Personnel', label: 'Rémunérations et vacations', reference: 'DEP-2026-0297', amount: 4250000, method: 'Virement', status: 'Confirmé' },
    { id: 'trx-005', date: '2026-08-03', type: 'Dépense', category: 'Équipement', label: 'Matériel et consommables', reference: 'DEP-2026-0264', amount: 1860000, method: 'Carte', status: 'Confirmé' },
    { id: 'trx-006', date: '2026-07-29', type: 'Recette', category: 'Services', label: 'Règlement prestation', reference: 'REC-2026-0718', amount: 9750000, method: 'Virement', status: 'Confirmé' },
    { id: 'trx-007', date: '2026-07-24', type: 'Dépense', category: 'Déplacement', label: 'Transport et hébergement', reference: 'DEP-2026-0211', amount: 2340000, method: 'Carte', status: 'Confirmé' },
    { id: 'trx-008', date: '2026-08-15', type: 'Recette', category: 'À recevoir', label: 'Paiement attendu', reference: 'REC-2026-0880', amount: 3600000, method: 'Virement', status: 'En attente' },
  ];
}
