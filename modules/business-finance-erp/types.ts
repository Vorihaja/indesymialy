export type BusinessTransaction = {
  id: string;
  date: string;
  type: 'Recette' | 'Dépense';
  category: string;
  label: string;
  reference: string;
  amount: number;
  method: string;
  status: 'Confirmé' | 'En attente';
};
