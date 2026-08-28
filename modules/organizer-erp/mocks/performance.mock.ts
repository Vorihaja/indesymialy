import type { OrganizerModuleMock } from '../types';
export const performanceMock: OrganizerModuleMock = {
  label: 'Comparaison événementielle', action: 'Exporter le rapport',
  kpis: [{ label: 'Score global', value: '84 / 100', detail: '+9 pts vs Vol.2', tone: 'green' }, { label: 'Audience estimée', value: '38 400', detail: '+26 %', tone: 'blue' }, { label: 'Ponctualité', value: '92 %', detail: '+7 pts' }, { label: 'Satisfaction', value: '4,4 / 5', detail: '1 204 réponses', tone: 'green' }],
  columns: ['Indicateur', 'MFN Vol.2', 'MFN Vol.3', 'Évolution', 'Objectif', 'Statut'],
  rows: [
    ['Spectateurs', '1 540', '1 842', '+19,6 %', '2 000', 'En avance'],
    ['Remplissage', '61 %', '68 %', '+7 pts', '75 %', 'En cours'],
    ['Chiffre d’affaires', '42,8 M Ar', '52,4 M Ar', '+22,4 %', '55 M Ar', 'En avance'],
    ['Incidents', '5', '2', '-60 %', '< 3', 'Atteint'],
    ['Retard programme', '28 min', '12 min', '-16 min', '< 10 min', 'À surveiller'],
    ['Combats confirmés', '10', '12', '+2', '12', 'Atteint'],
    ['Audience digitale', '24 600', '38 400', '+56 %', '35 000', 'Dépassé'],
  ],
  progress: [{ label: 'Sport', value: 88, detail: 'Qualité de la fight card' }, { label: 'Opérations', value: 82, detail: 'Exécution Jour J' }, { label: 'Audience', value: 94, detail: 'Digital et médias' }],
};
