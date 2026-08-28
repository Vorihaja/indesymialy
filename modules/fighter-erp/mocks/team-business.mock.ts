import { fighterMock, type FighterTabSeed } from './helpers';

const team: Record<string, FighterTabSeed> = {
  'Encadrement': {
    columns: ['Personne', 'Rôle', 'Structure', 'Contact', 'Disponibilité', 'Statut'],
    rows: [
      ['Hery Randria', 'Coach principal', 'Dojo Sakura', '@hery.randria', 'Temps plein', 'Confirmé'],
      ['Feno Razaka', 'Préparateur physique', 'Fight Lab Mada', '@feno.razaka', 'Camp', 'Confirmé'],
      ['Lalao Ramanana', 'Manager', 'Indesy Management', '@lalao.r', 'Temps plein', 'Confirmé'],
      ['Dr Lova Rakoto', 'Médecin', 'Clinique Ankoay', '@dr.lova', 'Sur rendez-vous', 'Actif'],
    ],
    action: 'Inviter un membre', stages: ['Invitation', 'Acceptation', 'Droits', 'Collaboration'], rowActions: ['Envoyer un message', 'Gérer les accès'],
  },
  'Coach principal': {
    columns: ['Coach', 'Discipline', 'Depuis', 'Contrat', 'Prochain bilan', 'Statut'],
    rows: [['Hery Randria', 'MMA · striking', '04 janvier 2020', 'Jusqu’au 31 décembre 2026', '01 septembre 2026', 'Actif']],
    action: 'Changer de coach', stages: ['Proposition', 'Accord', 'Contrat', 'Activation'], rowActions: ['Envoyer un message', 'Ouvrir le contrat'],
    focus: { title: 'Responsabilités', items: [
      { label: 'Validation des programmes', value: 'Active', status: 'done' },
      { label: 'Accès données médicales', value: 'Limité', status: 'warning' },
      { label: 'Validation des combats', value: 'Obligatoire', status: 'done' },
    ] },
  },
  'Staff': {
    columns: ['Personne', 'Fonction', 'Mission combat', 'Accès', 'Invitation', 'Statut'],
    rows: [
      ['Feno Razaka', 'Préparateur physique', 'Échauffement', 'Sport & performance', '@feno.razaka', 'Confirmé'],
      ['Mamy Nomenjanahary', 'Coach lutte', 'Coin secondaire', 'Préparation combat', '@mamy.n', 'Confirmé'],
      ['Miora Andry', 'Kinésithérapeute', 'Récupération', 'Médical limité', '@miora.kine', 'En attente'],
    ],
    action: 'Ajouter au staff', stages: ['Sélection', 'Invitation', 'Autorisation', 'Affectation'], rowActions: ['Envoyer une invitation', 'Modifier les accès'],
  },
  'Clubs': {
    columns: ['Club', 'Relation', 'Coach', 'Période', 'Contribution', 'Statut'],
    rows: [
      ['Dojo Sakura', 'Club principal', 'Hery Randria', 'Depuis 2020', 'Coaching · licence', 'Actif'],
      ['Fight Lab Mada', 'Partenaire de camp', 'Feno Razaka', 'Août 2026', 'Sparring · préparation', 'Confirmé'],
    ],
    action: 'Inviter un club', stages: ['Demande', 'Conditions', 'Accord', 'Collaboration'], rowActions: ['Voir le club', 'Envoyer un message'],
  },
  'Invitations': {
    columns: ['Personne', 'Rôle proposé', 'Message', 'Envoyée', 'Expiration', 'Statut'],
    rows: [
      ['Miora Andry', 'Kinésithérapeute', '@miora.kine rejoint mon équipe MFN Vol.3', '10 août 2026', '17 août 2026', 'En attente'],
      ['Tahina R.', 'Nutritionniste', '@tahina.nutrition suivi poids et réhydratation', '09 août 2026', '16 août 2026', 'Acceptée'],
    ],
    action: 'Envoyer une invitation', stages: ['Sélection du profil', 'Message @mention', 'Envoi', 'Réponse', 'Activation'], rowActions: ['Relancer', 'Annuler l’invitation'],
  },
};

const finance: Record<string, FighterTabSeed> = {
  'Synthèse': {
    columns: ['Indicateur', 'Période', 'Prévision', 'Réalisé', 'Écart', 'Statut'],
    rows: [
      ['Revenus combats', '2026', '18 000 000 Ar', '12 500 000 Ar', '-5 500 000 Ar', 'En cours'],
      ['Sponsoring', '2026', '14 400 000 Ar', '9 600 000 Ar', '-4 800 000 Ar', 'En cours'],
      ['Dépenses sportives', '2026', '8 500 000 Ar', '6 120 000 Ar', '+2 380 000 Ar', 'Conforme'],
      ['Solde net', '2026', '23 900 000 Ar', '15 980 000 Ar', '66,8 %', 'Positif'],
    ],
    action: 'Ajouter une opération', stages: ['Saisie', 'Justificatif', 'Catégorisation', 'Validation'], rowActions: ['Voir le détail', 'Exporter'],
  },
  'Contrats': {
    columns: ['Contrat', 'Partie', 'Valeur', 'Début', 'Fin', 'Statut'],
    rows: [
      ['Combat MFN Vol.3', 'Mada Events', '4 500 000 Ar', '01 août 2026', '30 août 2026', 'Signé'],
      ['Ambassadeur Boeny', 'Boeny Nutrition', '800 000 Ar / mois', '01 juin 2026', '31 mai 2027', 'Actif'],
      ['Management', 'Indesy Management', '12 % des revenus', '01 janvier 2026', '31 décembre 2026', 'Actif'],
    ],
    action: 'Ajouter un contrat', stages: ['Proposition', 'Révision', 'Signature', 'Exécution', 'Clôture'], rowActions: ['Signer', 'Demander une révision'],
  },
  'Revenus': {
    columns: ['Source', 'Référence', 'Date', 'Brut', 'Retenues', 'Net', 'Statut'],
    rows: [
      ['Prime combat', 'MFN-2026-03', '30 août 2026', '4 500 000 Ar', '540 000 Ar', '3 960 000 Ar', 'À recevoir'],
      ['Sponsoring', 'BOENY-AOÛT', '05 août 2026', '800 000 Ar', '0 Ar', '800 000 Ar', 'Reçu'],
      ['Bonus performance', 'MFN-2026-02', '29 juillet 2026', '1 000 000 Ar', '120 000 Ar', '880 000 Ar', 'Reçu'],
    ],
    action: 'Déclarer un revenu', stages: ['Facturation', 'Échéance', 'Encaissement', 'Rapprochement'], rowActions: ['Marquer reçu', 'Relancer le payeur'],
  },
  'Dépenses': {
    columns: ['Dépense', 'Catégorie', 'Date', 'Montant', 'Justificatif', 'Statut'],
    rows: [
      ['Camp Fight Lab', 'Entraînement', '02 août 2026', '600 000 Ar', 'Facture FL-248', 'Payé'],
      ['Billet Mahajanga', 'Transport', '08 août 2026', '180 000 Ar', 'E-ticket', 'Payé'],
      ['Compléments nutrition', 'Santé', '05 août 2026', '245 000 Ar', 'Ticket BO-811', 'Validé'],
    ],
    action: 'Ajouter une dépense', stages: ['Saisie', 'Justificatif', 'Validation', 'Comptabilisation'], rowActions: ['Valider', 'Télécharger le justificatif'],
  },
  'Paiements': {
    columns: ['Paiement', 'Destinataire', 'Échéance', 'Montant', 'Canal', 'Statut'],
    rows: [
      ['Part coach MFN Vol.3', 'Coach Hery Randria', '02 septembre 2026', '450 000 Ar', 'Mobile Money', 'Planifié'],
      ['Honoraires manager août', 'Lalao Ramanana', '31 août 2026', '300 000 Ar', 'Virement', 'À valider'],
      ['Kiné camp', 'Miora Andry', '25 août 2026', '220 000 Ar', 'Mobile Money', 'En attente'],
    ],
    action: 'Planifier un paiement', stages: ['Création', 'Validation', 'Exécution', 'Confirmation'], rowActions: ['Payer', 'Reporter'],
  },
};

const sponsors: Record<string, FighterTabSeed> = {
  'Partenaires': {
    columns: ['Sponsor', 'Secteur', 'Contact', 'Contribution', 'Renouvellement', 'Statut'],
    rows: [
      ['Boeny Nutrition', 'Nutrition sportive', '@boeny.nutrition', '800 000 Ar / mois', 'Mai 2027', 'Actif'],
      ['MadaFight Gear', 'Équipement', '@madafight.gear', 'Matériel · 3 200 000 Ar', 'Décembre 2026', 'Actif'],
      ['Telma Mobile', 'Télécom', '@telma.sport', 'Proposition en cours', '—', 'En négociation'],
    ],
    action: 'Ajouter un sponsor', stages: ['Prospection', 'Proposition', 'Négociation', 'Contrat', 'Activation'], rowActions: ['Envoyer un message', 'Ouvrir la fiche'],
  },
  'Offres': {
    columns: ['Marque', 'Offre', 'Durée', 'Valeur', 'Exclusivité', 'Statut'],
    rows: [
      ['Telma Mobile', 'Ambassadeur digital', '12 mois', '18 000 000 Ar', 'Télécom', 'À étudier'],
      ['Vita Malagasy', 'Image campagne', '3 mois', '4 500 000 Ar', 'Boisson', 'En négociation'],
    ],
    action: 'Ajouter une offre', stages: ['Réception', 'Analyse valeur', 'Compatibilité', 'Négociation', 'Décision'], rowActions: ['Accepter', 'Refuser', 'Contre-proposer'],
  },
  'Contrats': {
    columns: ['Sponsor', 'Package', 'Début', 'Fin', 'Valeur', 'Statut'],
    rows: [
      ['Boeny Nutrition', 'Partenaire officiel', '01 juin 2026', '31 mai 2027', '9 600 000 Ar', 'Signé'],
      ['MadaFight Gear', 'Équipementier', '01 janvier 2026', '31 décembre 2026', '3 200 000 Ar', 'Actif'],
    ],
    action: 'Créer un contrat', stages: ['Term sheet', 'Validation', 'Signature', 'Activation'], rowActions: ['Signer', 'Télécharger'],
  },
  'Livrables': {
    columns: ['Livrable', 'Sponsor', 'Échéance', 'Canal', 'Preuve', 'Statut'],
    rows: [
      ['Publication camp', 'Boeny Nutrition', '14 août 2026', 'Instagram', 'Brouillon prêt', 'À valider'],
      ['Logo short de combat', 'MadaFight Gear', '29 août 2026', 'Équipement', 'BAT approuvé', 'Confirmé'],
      ['Interview après combat', 'Boeny Nutrition', '31 août 2026', 'Vidéo', 'Script reçu', 'Planifié'],
    ],
    action: 'Ajouter un livrable', stages: ['Brief', 'Production', 'Validation sponsor', 'Publication', 'Preuve'], rowActions: ['Soumettre pour validation', 'Marquer livré'],
  },
  'Visibilité': {
    columns: ['Activation', 'Sponsor', 'Audience', 'Impressions', 'Engagement', 'Statut'],
    rows: [
      ['Road to MFN · épisode 2', 'Boeny Nutrition', '42 800', '67 400', '8,6 %', 'Publié'],
      ['Annonce équipement', 'MadaFight Gear', '28 500', '39 200', '6,9 %', 'Publié'],
      ['Fight week stories', 'Boeny Nutrition', 'Est. 55 000', '—', '—', 'Planifié'],
    ],
    action: 'Créer une activation', stages: ['Brief', 'Contenu', 'Validation', 'Diffusion', 'Rapport'], rowActions: ['Publier', 'Exporter le rapport'],
  },
};

export function teamBusinessMock(module: 'team' | 'finance' | 'sponsors', tab: string) {
  const map = module === 'team' ? team : module === 'finance' ? finance : sponsors;
  const label = module === 'team' ? 'Équipe' : module === 'finance' ? 'Contrats & finances' : 'Sponsors';
  return fighterMock(label, tab, map[tab]!);
}
