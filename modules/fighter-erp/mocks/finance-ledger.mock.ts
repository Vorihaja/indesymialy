export type FighterFinanceEntry = {
  id: string;
  date: string;
  label: string;
  category: string;
  source: string;
  reference: string;
  type: 'Recette' | 'Dépense';
  gross: number;
  fees: number;
  amount: number;
  status: 'Reçu' | 'Payé' | 'Validé' | 'À recevoir' | 'Planifié';
};

export const fighterFinanceLedger: FighterFinanceEntry[] = [
  { id: 'fin-001', date: '2026-08-08', label: 'Billet Mahajanga', category: 'Transport', source: 'Air Madagascar', reference: 'E-TICKET-8142', type: 'Dépense', gross: 180000, fees: 0, amount: 180000, status: 'Payé' },
  { id: 'fin-002', date: '2026-08-05', label: 'Sponsoring août', category: 'Sponsoring', source: 'Boeny Nutrition', reference: 'BOENY-AOUT', type: 'Recette', gross: 800000, fees: 0, amount: 800000, status: 'Reçu' },
  { id: 'fin-003', date: '2026-08-05', label: 'Compléments nutrition', category: 'Santé', source: 'Boeny Shop', reference: 'TICKET-BO-811', type: 'Dépense', gross: 245000, fees: 0, amount: 245000, status: 'Validé' },
  { id: 'fin-004', date: '2026-08-02', label: 'Camp Fight Lab', category: 'Entraînement', source: 'Fight Lab Mada', reference: 'FACT-FL-248', type: 'Dépense', gross: 600000, fees: 0, amount: 600000, status: 'Payé' },
  { id: 'fin-005', date: '2026-07-29', label: 'Bonus performance MFN Vol.2', category: 'Prime combat', source: 'Mada Events', reference: 'MFN-2026-02-BONUS', type: 'Recette', gross: 1000000, fees: 120000, amount: 880000, status: 'Reçu' },
  { id: 'fin-006', date: '2026-07-27', label: 'Honoraires coach juillet', category: 'Encadrement', source: 'Coach Hery Randria', reference: 'COACH-0726', type: 'Dépense', gross: 380000, fees: 0, amount: 380000, status: 'Payé' },
  { id: 'fin-007', date: '2026-07-05', label: 'Sponsoring juillet', category: 'Sponsoring', source: 'Boeny Nutrition', reference: 'BOENY-JUILLET', type: 'Recette', gross: 800000, fees: 0, amount: 800000, status: 'Reçu' },
  { id: 'fin-008', date: '2026-06-18', label: 'Équipement de camp', category: 'Matériel', source: 'MadaFight Gear', reference: 'MFG-0618', type: 'Dépense', gross: 420000, fees: 0, amount: 420000, status: 'Payé' },
  { id: 'fin-009', date: '2026-06-05', label: 'Sponsoring juin', category: 'Sponsoring', source: 'Boeny Nutrition', reference: 'BOENY-JUIN', type: 'Recette', gross: 800000, fees: 0, amount: 800000, status: 'Reçu' },
  { id: 'fin-010', date: '2026-05-18', label: 'Prime Tana Fight League 5', category: 'Prime combat', source: 'TFL Promotion', reference: 'TFL-2026-05', type: 'Recette', gross: 3500000, fees: 420000, amount: 3080000, status: 'Reçu' },
  { id: 'fin-011', date: '2026-05-12', label: 'Déplacement Tana Fight League', category: 'Transport', source: 'Logistique combat', reference: 'LOG-TFL-0512', type: 'Dépense', gross: 310000, fees: 0, amount: 310000, status: 'Payé' },
  { id: 'fin-012', date: '2026-05-05', label: 'Sponsoring mai', category: 'Sponsoring', source: 'Boeny Nutrition', reference: 'BOENY-MAI', type: 'Recette', gross: 800000, fees: 0, amount: 800000, status: 'Reçu' },
  { id: 'fin-013', date: '2026-04-22', label: 'Suivi médical trimestriel', category: 'Médical', source: 'Clinique Ankoay', reference: 'MED-0422', type: 'Dépense', gross: 275000, fees: 0, amount: 275000, status: 'Payé' },
  { id: 'fin-014', date: '2026-04-05', label: 'Sponsoring avril', category: 'Sponsoring', source: 'Boeny Nutrition', reference: 'BOENY-AVRIL', type: 'Recette', gross: 800000, fees: 0, amount: 800000, status: 'Reçu' },
  { id: 'fin-015', date: '2026-03-14', label: 'Prime Madagascar Combat 12', category: 'Prime combat', source: 'MC Promotion', reference: 'MC-2026-12', type: 'Recette', gross: 2800000, fees: 336000, amount: 2464000, status: 'Reçu' },
  { id: 'fin-016', date: '2026-03-09', label: 'Camp technique mars', category: 'Entraînement', source: 'Dojo Sakura', reference: 'DS-CAMP-0309', type: 'Dépense', gross: 520000, fees: 0, amount: 520000, status: 'Payé' },
  { id: 'fin-017', date: '2026-02-05', label: 'Sponsoring février', category: 'Sponsoring', source: 'Boeny Nutrition', reference: 'BOENY-FEVRIER', type: 'Recette', gross: 800000, fees: 0, amount: 800000, status: 'Reçu' },
  { id: 'fin-018', date: '2026-01-15', label: 'Licence & assurance 2026', category: 'Administratif', source: 'FMMA', reference: 'FMMA-1842', type: 'Dépense', gross: 340000, fees: 0, amount: 340000, status: 'Payé' },
  { id: 'fin-019', date: '2026-08-30', label: 'Prime combat MFN Vol.3', category: 'Prime combat', source: 'Mada Events', reference: 'MFN-2026-03', type: 'Recette', gross: 4500000, fees: 540000, amount: 3960000, status: 'À recevoir' },
  { id: 'fin-020', date: '2026-08-31', label: 'Honoraires manager août', category: 'Management', source: 'Lalao Ramanana', reference: 'MGT-0826', type: 'Dépense', gross: 300000, fees: 0, amount: 300000, status: 'Planifié' },
];
