import { fighterMock, type FighterTabSeed } from './helpers';

const competitions: Record<string, FighterTabSeed> = {
  'Invitations': {
    columns: ['Événement', 'Organisateur', 'Date', 'Proposition', 'Adversaire', 'Statut'],
    rows: [
      ['Mahajanga Fight Night Vol.3', 'Mada Events', '30 août 2026', 'Main card · 4 500 000 Ar', 'Andriamahefa Nomena', 'Acceptée'],
      ['Tana Combat Series 8', 'TCS Promotion', '18 octobre 2026', 'Co-main · 5 200 000 Ar', 'À confirmer', 'En attente'],
      ['Indian Ocean Warriors', 'IOW Mauritius', '12 décembre 2026', 'Main card · 1 800 EUR', 'Jean-Marc Louis', 'À étudier'],
    ],
    action: 'Ajouter une invitation', stages: ['Réception', 'Analyse', 'Négociation', 'Décision', 'Contrat'], rowActions: ['Accepter', 'Refuser', 'Contre-proposer'],
  },
  'Inscriptions': {
    columns: ['Compétition', 'Catégorie', 'Date limite', 'Documents', 'Frais', 'Statut'],
    rows: [
      ['Championnat Madagascar MMA', 'Poids légers', '10 septembre 2026', '6/6', '150 000 Ar', 'Confirmé'],
      ['Open Kick-boxing Analamanga', '-71 kg', '24 septembre 2026', '4/5', '80 000 Ar', 'En attente'],
    ],
    action: 'Nouvelle inscription', stages: ['Formulaire', 'Documents', 'Paiement', 'Validation', 'Convocation'], rowActions: ['Compléter le dossier', 'Payer les frais'],
  },
  'Combats': {
    columns: ['Événement', 'Adversaire', 'Date', 'Catégorie', 'Rounds', 'Coin', 'Statut'],
    rows: [
      ['Mahajanga Fight Night Vol.3', 'Andriamahefa Nomena', '30 août 2026', 'Poids légers', '3 × 5 min', 'Rouge', 'Confirmé'],
      ['Tana Combat Series 8', 'À confirmer', '18 octobre 2026', 'Poids légers', '3 × 5 min', 'À définir', 'Proposé'],
      ['MFN Vol.2', 'Fetra Raveloson', '26 juillet 2026', 'Poids légers', '3 × 5 min', 'Bleu', 'Terminé'],
    ],
    action: 'Ajouter un combat', stages: ['Proposition', 'Accord', 'Contrat', 'Pesée', 'Combat', 'Résultat'], rowActions: ['Ouvrir la préparation', 'Voir la fight card'],
  },
  'Résultats': {
    columns: ['Événement', 'Adversaire', 'Résultat', 'Méthode', 'Round', 'Temps', 'Statut'],
    rows: [
      ['MFN Vol.2', 'Fetra Raveloson', 'Victoire', 'Décision unanime', '3', '05:00', 'Validé'],
      ['Tana Fight League 5', 'Solofo Ranaivo', 'Victoire', 'TKO', '2', '03:18', 'Validé'],
      ['Madagascar Combat 12', 'Haja R.', 'Défaite', 'Décision partagée', '3', '05:00', 'Validé'],
    ],
    action: 'Déclarer un résultat', stages: ['Saisie officielle', 'Arbitre', 'Organisateur', 'Record'], rowActions: ['Voir la feuille officielle', 'Contester'],
  },
  'Calendrier': {
    columns: ['Date', 'Événement', 'Type', 'Lieu', 'Engagement', 'Statut'],
    rows: [
      ['30 août 2026', 'Mahajanga Fight Night Vol.3', 'Combat professionnel', 'Mahajanga', 'Combattant', 'Confirmé'],
      ['20 septembre 2026', 'Stage équipe nationale', 'Stage', 'Antananarivo', 'Participant', 'Confirmé'],
      ['18 octobre 2026', 'Tana Combat Series 8', 'Combat professionnel', 'Antananarivo', 'Invitation', 'En attente'],
    ],
    action: 'Ajouter au calendrier', stages: ['Planification', 'Disponibilité', 'Confirmation', 'Réalisation'], rowActions: ['Confirmer la disponibilité', 'Ajouter un rappel'],
  },
};

const health: Record<string, FighterTabSeed> = {
  'Suivi médical': {
    columns: ['Consultation', 'Praticien', 'Date', 'Conclusion', 'Prochain contrôle', 'Statut'],
    rows: [
      ['Examen pré-combat', 'Dr Lova R.', '10 août 2026', 'Apte sous réserve ECG', '14 août 2026', 'En cours'],
      ['Suivi kinésithérapie', 'Kiné Miora', '08 août 2026', 'Mobilité épaule 92 %', '13 août 2026', 'Conforme'],
      ['Bilan sanguin', 'Laboratoire Ankoay', '03 août 2026', 'Valeurs normales', '—', 'Validé'],
    ],
    action: 'Planifier une consultation', stages: ['Rendez-vous', 'Examen', 'Résultat', 'Aptitude'], rowActions: ['Voir le compte rendu', 'Envoyer au médecin'],
  },
  'Certificats': {
    columns: ['Certificat', 'Médecin', 'Émission', 'Expiration', 'Usage', 'Statut'],
    rows: [
      ['Aptitude sportive', 'Dr Lova R.', '15 janvier 2026', '15 janvier 2027', 'Licence', 'Valide'],
      ['Aptitude pré-combat', 'Dr Lova R.', 'Prévu 14 août 2026', '30 août 2026', 'MFN Vol.3', 'En attente'],
      ['Test ophtalmologique', 'Dr Hanitra', '04 août 2026', '04 août 2027', 'Combat', 'Valide'],
    ],
    action: 'Ajouter un certificat', stages: ['Examen', 'Signature', 'Dépôt', 'Validation'], rowActions: ['Télécharger', 'Partager à l’organisateur'],
  },
  'Blessures': {
    columns: ['Blessure', 'Date', 'Zone', 'Gravité', 'Prise en charge', 'Statut'],
    rows: [
      ['Tension épaule droite', '02 août 2026', 'Épaule', 'Légère', 'Kiné · mobilité', 'En suivi'],
      ['Entorse cheville', '18 mars 2025', 'Cheville gauche', 'Modérée', 'Repos 21 jours', 'Résolu'],
      ['Coupure arcade', '07 novembre 2024', 'Arcade droite', 'Légère', '3 points', 'Résolu'],
    ],
    action: 'Déclarer une blessure', stages: ['Signalement', 'Diagnostic', 'Traitement', 'Reprise', 'Clôture'], rowActions: ['Mettre à jour', 'Demander autorisation de reprise'],
  },
  'Poids': {
    columns: ['Date', 'Heure', 'Poids', 'Masse grasse', 'Hydratation', 'Statut'],
    rows: [
      ['11 août 2026', '06:12', '72,1 kg', '10,8 %', '66 %', 'Conforme'],
      ['10 août 2026', '06:15', '72,5 kg', '10,9 %', '64 %', 'Conforme'],
      ['09 août 2026', '06:08', '72,9 kg', '11,1 %', '67 %', 'Conforme'],
      ['08 août 2026', '06:20', '73,4 kg', '11,3 %', '62 %', 'À surveiller'],
    ],
    action: 'Enregistrer le poids', stages: ['Mesure', 'Tendance', 'Ajustement nutrition', 'Validation'], rowActions: ['Ajouter une mesure', 'Alerter le nutritionniste'],
  },
  'Suspensions': {
    columns: ['Motif', 'Autorité', 'Début', 'Fin', 'Condition de levée', 'Statut'],
    rows: [
      ['Repos médical post-combat', 'FMMA', '27 juillet 2026', '10 août 2026', 'Contrôle médical', 'Terminée'],
      ['Suspension KO', '—', '—', '—', 'Aucune', 'Inactive'],
    ],
    action: 'Ajouter un suivi', stages: ['Notification', 'Repos', 'Contrôle', 'Levée'], rowActions: ['Demander la levée', 'Joindre un certificat'],
  },
};

export function competitionsHealthMock(module: 'competitions' | 'health', tab: string) {
  return fighterMock(module === 'competitions' ? 'Compétitions' : 'Médical & poids', tab, (module === 'competitions' ? competitions : health)[tab]!);
}
