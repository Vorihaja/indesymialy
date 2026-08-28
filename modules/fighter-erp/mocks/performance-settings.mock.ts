import { fighterMock, type FighterTabSeed } from './helpers';

const performance: Record<string, FighterTabSeed> = {
  'Synthèse': {
    columns: ['Indicateur', 'Référence', 'Actuel', 'Objectif', 'Évolution', 'Statut'],
    rows: [
      ['Forme globale', 'Camp MFN', '86/100', '90/100', '+7 pts', 'En progression'],
      ['Charge aiguë', '7 jours', '612 UA', '550–680 UA', 'Zone cible', 'Conforme'],
      ['Récupération', 'Moyenne 7 jours', '73 %', '> 70 %', '+4 %', 'Conforme'],
      ['Poids', 'Catégorie 70,3 kg', '72,1 kg', '70,3 kg', '-1,8 kg', 'En cours'],
    ],
    action: 'Ajouter une mesure', stages: ['Collecte', 'Analyse', 'Décision', 'Ajustement'], rowActions: ['Voir la tendance', 'Partager au staff'],
  },
  'Sport': {
    columns: ['Test', 'Date', 'Résultat', 'Référence', 'Écart', 'Statut'],
    rows: [
      ['Défense takedown', '09 août 2026', '82 %', '75 %', '+7 %', 'Atteint'],
      ['Précision striking', '08 août 2026', '47 %', '45 %', '+2 %', 'Atteint'],
      ['Contrôle cage', '07 août 2026', '64 %', '70 %', '-6 %', 'À travailler'],
      ['Sortie de soumission', '05 août 2026', '8/10', '8/10', 'Cible', 'Atteint'],
    ],
    action: 'Ajouter un test', stages: ['Protocole', 'Test', 'Analyse', 'Plan correctif'], rowActions: ['Comparer', 'Créer un objectif'],
  },
  'Condition': {
    columns: ['Mesure', 'Unité', 'Avril', 'Juin', 'Août', 'Statut'],
    rows: [
      ['VO2 max', 'ml/kg/min', '52,1', '54,8', '56,4', 'En progression'],
      ['Force relative squat', '× poids corps', '1,62', '1,71', '1,78', 'En progression'],
      ['Sprint 10 m', 'secondes', '1,91', '1,86', '1,82', 'Atteint'],
      ['HRV moyenne', 'ms', '62', '66', '69', 'Conforme'],
    ],
    action: 'Lancer une évaluation', stages: ['Baseline', 'Mesures', 'Comparaison', 'Prescription'], rowActions: ['Voir le graphique', 'Exporter'],
  },
  'Combats': {
    columns: ['Combat', 'Strikes', 'Takedowns', 'Contrôle', 'Efficacité', 'Résultat'],
    rows: [
      ['vs Fetra Raveloson', '74/151', '4/7', '06:42', '49 %', 'Victoire'],
      ['vs Solofo Ranaivo', '48/82', '2/3', '03:11', '58 %', 'Victoire'],
      ['vs Haja R.', '61/144', '1/5', '02:24', '42 %', 'Défaite'],
    ],
    action: 'Importer des statistiques', stages: ['Vidéo', 'Codage', 'Contrôle', 'Analyse'], rowActions: ['Ouvrir l’analyse', 'Comparer'],
  },
  'Progression': {
    columns: ['Compétence', 'Niveau initial', 'Niveau actuel', 'Cible', 'Gain', 'Statut'],
    rows: [
      ['Striking', '72', '81', '85', '+9', 'En progression'],
      ['Lutte offensive', '65', '78', '82', '+13', 'En progression'],
      ['Jiu-jitsu', '74', '80', '83', '+6', 'Conforme'],
      ['Cardio combat', '70', '86', '88', '+16', 'En progression'],
    ],
    action: 'Créer une évaluation', stages: ['Évaluation', 'Objectif', 'Programme', 'Mesure', 'Bilan'], rowActions: ['Mettre à jour', 'Créer un objectif'],
    progress: [
      { label: 'Striking', value: 81, detail: '+9 points sur 6 mois' },
      { label: 'Lutte', value: 78, detail: '+13 points sur 6 mois' },
      { label: 'Cardio combat', value: 86, detail: '+16 points sur 6 mois' },
    ],
  },
  'Rapports': {
    columns: ['Rapport', 'Période', 'Auteur', 'Destinataires', 'Créé le', 'Statut'],
    rows: [
      ['Bilan semaine 2 · Camp MFN', '04–10 août 2026', 'Coach Hery Randria', 'Staff complet', '11 août 2026', 'Publié'],
      ['Analyse MFN Vol.2', '26 juillet 2026', 'Analyste Soa', 'Combattant · coach', '29 juillet 2026', 'Validé'],
      ['Bilan médical juillet', 'Juillet 2026', 'Dr Lova R.', 'Combattant', '02 août 2026', 'Confidentiel'],
    ],
    action: 'Générer un rapport', stages: ['Sélection données', 'Génération', 'Validation', 'Partage'], rowActions: ['Télécharger', 'Partager'],
  },
};

const settings: Record<string, FighterTabSeed> = {
  'Compte': {
    columns: ['Paramètre', 'Valeur', 'Dernière modification', 'Sécurité', 'Statut'],
    rows: [
      ['Adresse e-mail', 'tiana.rakoto@indesy.mg', '02 août 2026', 'Vérifiée', 'Actif'],
      ['Téléphone', '+261 34 12 345 67', '18 juillet 2026', 'Vérifié', 'Actif'],
      ['Mot de passe', 'Modifié il y a 42 jours', '30 juin 2026', 'Fort', 'Conforme'],
      ['Authentification 2FA', 'Application', '01 juillet 2026', 'Activée', 'Actif'],
    ],
    action: 'Ajouter un contact', stages: ['Modification', 'Vérification', 'Confirmation'], rowActions: ['Modifier', 'Vérifier'],
  },
  'Confidentialité': {
    columns: ['Donnée', 'Visibilité', 'Accès équipe', 'Accès organisateur', 'Statut'],
    rows: [
      ['Profil sportif', 'Public', 'Complet', 'Public', 'Actif'],
      ['Données médicales', 'Privé', 'Médecin uniquement', 'Aptitude seulement', 'Protégé'],
      ['Finances', 'Privé', 'Manager', 'Aucun', 'Protégé'],
      ['Statistiques entraînement', 'Équipe', 'Staff sportif', 'Aucun', 'Actif'],
    ],
    action: 'Créer une règle', stages: ['Choix donnée', 'Audience', 'Confirmation', 'Application'], rowActions: ['Modifier la visibilité', 'Révoquer les accès'],
  },
  'Notifications': {
    columns: ['Notification', 'Application', 'E-mail', 'SMS', 'Priorité', 'Statut'],
    rows: [
      ['Invitations combat', 'Oui', 'Oui', 'Oui', 'Critique', 'Actif'],
      ['Planning entraînement', 'Oui', 'Non', 'Non', 'Normale', 'Actif'],
      ['Alertes médicales', 'Oui', 'Oui', 'Oui', 'Critique', 'Actif'],
      ['Sponsors & contrats', 'Oui', 'Oui', 'Non', 'Haute', 'Actif'],
    ],
    action: 'Ajouter une règle', stages: ['Événement', 'Canal', 'Priorité', 'Activation'], rowActions: ['Activer', 'Suspendre'],
  },
  'Préférences': {
    columns: ['Préférence', 'Valeur', 'Portée', 'Synchronisation', 'Statut'],
    rows: [
      ['Langue', 'Français', 'Interface', 'Compte', 'Actif'],
      ['Thème', 'Sombre', 'Interface', 'Appareil', 'Actif'],
      ['Unités de poids', 'Kilogrammes', 'Sport', 'Compte', 'Actif'],
      ['Fuseau horaire', 'Africa/Nairobi', 'Dates', 'Compte', 'Actif'],
    ],
    action: 'Ajouter une préférence', stages: ['Choix', 'Aperçu', 'Application'], rowActions: ['Modifier', 'Réinitialiser'],
  },
};

export function performanceSettingsMock(module: 'performance' | 'settings', tab: string) {
  return fighterMock(module === 'performance' ? 'Performance' : 'Paramètres', tab, (module === 'performance' ? performance : settings)[tab]!);
}
