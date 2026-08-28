import { fighterMock, type FighterTabSeed } from './helpers';

const profile: Record<string, FighterTabSeed> = {
  'Identité': {
    columns: ['Information', 'Valeur', 'Visibilité', 'Vérification', 'Statut'],
    rows: [
      ['Nom sportif', 'Tiana « The Wall » Rakoto', 'Public', 'Identité vérifiée', 'Conforme'],
      ['Date de naissance', '14 février 1998', 'Privé', 'Document validé', 'Conforme'],
      ['Nationalité', 'Malagasy', 'Public', 'Profil', 'Actif'],
      ['Ville', 'Antananarivo', 'Public', 'Profil', 'Actif'],
    ],
    action: 'Ajouter une information', stages: ['Saisie', 'Justificatif', 'Vérification', 'Publication'], rowActions: ['Rendre public', 'Demander une vérification'],
  },
  'Disciplines': {
    columns: ['Discipline', 'Niveau', 'Depuis', 'Coach', 'Licence', 'Statut'],
    rows: [
      ['MMA', 'Professionnel', '2019', 'Coach Hery Randria', 'MMA-2026-1842', 'Actif'],
      ['Kick-boxing', 'Élite', '2016', 'Coach Feno R.', 'KB-2026-0914', 'Actif'],
      ['Lutte', 'Avancé', '2021', 'Coach Mamy N.', '—', 'En cours'],
    ],
    action: 'Ajouter une discipline', stages: ['Déclaration', 'Niveau', 'Licence', 'Validation'], rowActions: ['Définir principale', 'Renouveler la licence'],
  },
  'Catégories': {
    columns: ['Discipline', 'Catégorie', 'Limite', 'Poids actuel', 'Écart', 'Statut'],
    rows: [
      ['MMA', 'Poids légers', '70,3 kg', '72,1 kg', '+1,8 kg', 'Actif'],
      ['Kick-boxing', '-71 kg', '71 kg', '72,1 kg', '+1,1 kg', 'À surveiller'],
    ],
    action: 'Ajouter une catégorie', stages: ['Choix', 'Contrôle poids', 'Coach', 'Validation'], rowActions: ['Définir principale', 'Lancer un suivi poids'],
  },
  'Clubs': {
    columns: ['Club', 'Rôle', 'Depuis', 'Coach référent', 'Licence', 'Statut'],
    rows: [
      ['Dojo Sakura', 'Combattant senior', '2020', 'Coach Hery Randria', 'Valide 2026', 'Actif'],
      ['Fight Lab Mada', 'Camp partenaire', '2025', 'Feno Razaka', 'Convention', 'Confirmé'],
    ],
    action: 'Rejoindre un club', stages: ['Demande', 'Validation club', 'Licence', 'Activation'], rowActions: ['Contacter le club', 'Quitter le club'],
  },
  'Documents': {
    columns: ['Document', 'Numéro', 'Émission', 'Expiration', 'Contrôle', 'Statut'],
    rows: [
      ['Licence fédérale', 'FMMA-1842', '05 janvier 2026', '31 décembre 2026', 'Fédération', 'Valide'],
      ['Passeport', 'P0128457', '12 juin 2023', '11 juin 2028', 'Identité', 'Valide'],
      ['Assurance sportive', 'AS-260814', '08 janvier 2026', '07 janvier 2027', 'Club', 'Valide'],
      ['Autorisation médicale', 'MED-0826', '10 août 2026', '10 novembre 2026', 'Médecin', 'En attente'],
    ],
    action: 'Téléverser un document', stages: ['Dépôt', 'Lecture', 'Contrôle', 'Validation'], rowActions: ['Télécharger', 'Demander validation'],
  },
};

const career: Record<string, FighterTabSeed> = {
  'Parcours': {
    columns: ['Saison', 'Structure', 'Discipline', 'Niveau', 'Faits marquants', 'Statut'],
    rows: [
      ['2025–2026', 'Dojo Sakura', 'MMA', 'Professionnel', '3 victoires · 1 titre', 'Actif'],
      ['2023–2024', 'Dojo Sakura', 'Kick-boxing', 'Élite', 'Champion Analamanga', 'Terminé'],
      ['2019–2022', 'Fight Academy Tana', 'MMA amateur', 'National', '8 combats', 'Terminé'],
    ],
    action: 'Ajouter une étape', stages: ['Saisie', 'Preuve', 'Vérification', 'Publication'], rowActions: ['Publier', 'Joindre un justificatif'],
  },
  'Record': {
    columns: ['Discipline', 'Combats', 'Victoires', 'Défaites', 'Nuls', 'Finishes', 'Statut'],
    rows: [
      ['MMA professionnel', '14', '11', '2', '1', '7', 'Validé'],
      ['MMA amateur', '8', '7', '1', '0', '4', 'Validé'],
      ['Kick-boxing', '12', '9', '3', '0', '5', 'Validé'],
    ],
    action: 'Déclarer un combat', stages: ['Résultat', 'Preuve', 'Organisateur', 'Fédération'], rowActions: ['Contester', 'Voir le combat'],
  },
  'Classements': {
    columns: ['Classement', 'Discipline', 'Catégorie', 'Rang', 'Évolution', 'Statut'],
    rows: [
      ['National FMMA', 'MMA', 'Poids légers', '#3', '+2 places', 'Actif'],
      ['Ligue Analamanga', 'MMA', 'Poids légers', '#1', 'Stable', 'Actif'],
      ['National Kick-boxing', 'Kick-boxing', '-71 kg', '#7', '+1 place', 'Actif'],
    ],
    action: 'Demander une révision', stages: ['Calcul', 'Contrôle', 'Publication', 'Révision'], rowActions: ['Voir le classement', 'Demander révision'],
  },
  'Palmarès': {
    columns: ['Titre', 'Compétition', 'Date', 'Discipline', 'Niveau', 'Statut'],
    rows: [
      ['Champion Analamanga', 'Ligue régionale 2025', '17 octobre 2025', 'MMA', 'Régional', 'Validé'],
      ['Vice-champion Madagascar', 'National 2024', '08 décembre 2024', 'Kick-boxing', 'National', 'Validé'],
      ['Fight of the Night', 'MFN Vol.2', '26 juillet 2026', 'MMA', 'Professionnel', 'Confirmé'],
    ],
    action: 'Ajouter une distinction', stages: ['Déclaration', 'Justificatif', 'Validation', 'Profil'], rowActions: ['Afficher sur le profil', 'Télécharger le certificat'],
  },
  'Contrats': {
    columns: ['Organisation', 'Type', 'Début', 'Fin', 'Valeur', 'Statut'],
    rows: [
      ['Mahajanga Fight Night', 'Contrat combat', '01 août 2026', '30 août 2026', '4 500 000 Ar', 'Signé'],
      ['Dojo Sakura', 'Représentation sportive', '01 janvier 2026', '31 décembre 2026', 'Partage 12 %', 'Actif'],
      ['Boeny Nutrition', 'Ambassadeur', '01 juin 2026', '31 mai 2027', '9 600 000 Ar', 'Actif'],
    ],
    action: 'Ajouter un contrat', stages: ['Proposition', 'Négociation', 'Signature', 'Exécution'], rowActions: ['Signer', 'Envoyer au conseiller'],
  },
};

export function profileCareerMock(module: 'profile' | 'career', tab: string) {
  return fighterMock(module === 'profile' ? 'Profil sportif' : 'Carrière', tab, (module === 'profile' ? profile : career)[tab]!);
}
