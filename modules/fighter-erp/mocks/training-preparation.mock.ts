import { fighterMock, type FighterTabSeed } from './helpers';

const training: Record<string, FighterTabSeed> = {
  'Planning': {
    columns: ['Date', 'Heure', 'Séance', 'Lieu', 'Coach', 'Statut'],
    rows: [
      ['12 août 2026', '06:30', 'Conditionnement', 'Dojo Sakura', 'Coach Feno R.', 'Confirmé'],
      ['12 août 2026', '17:30', 'Sparring MMA', 'Fight Lab Mada', 'Coach Hery Randria', 'Confirmé'],
      ['13 août 2026', '08:00', 'Lutte & cage', 'Dojo Sakura', 'Coach Mamy N.', 'Planifié'],
      ['13 août 2026', '16:00', 'Récupération active', 'Centre Kiné Plus', 'Dr Lova', 'Planifié'],
    ],
    action: 'Planifier une séance', stages: ['Proposition', 'Coach', 'Confirmation', 'Réalisation'], rowActions: ['Confirmer la présence', 'Reporter'],
  },
  'Séances': {
    columns: ['Séance', 'Date', 'Durée', 'Charge', 'RPE', 'Statut'],
    rows: [
      ['Sparring technique 5×5', '10 août 2026', '75 min', 'Élevée', '8/10', 'Terminé'],
      ['Force maximale', '09 août 2026', '60 min', 'Modérée', '7/10', 'Terminé'],
      ['Cardio zone 2', '08 août 2026', '50 min', 'Faible', '5/10', 'Terminé'],
    ],
    action: 'Enregistrer une séance', stages: ['Planification', 'Exécution', 'Ressenti', 'Validation coach'], rowActions: ['Saisir le ressenti', 'Envoyer au coach'],
  },
  'Programmes': {
    columns: ['Programme', 'Période', 'Objectif', 'Coach', 'Progression', 'Statut'],
    rows: [
      ['Camp MFN Vol.3', '01–29 août 2026', 'Pic de forme', 'Coach Hery Randria', '64 %', 'Actif'],
      ['Renforcement lutte', '15 juin–31 août 2026', 'Défense takedown', 'Coach Mamy N.', '78 %', 'Actif'],
      ['Base aérobie', '01 avril–31 mai 2026', 'Endurance', 'Coach Feno R.', '100 %', 'Terminé'],
    ],
    action: 'Créer un programme', stages: ['Objectifs', 'Plan', 'Validation', 'Suivi', 'Bilan'], rowActions: ['Ouvrir le programme', 'Partager au staff'],
    progress: [
      { label: 'Camp principal', value: 64, detail: '18 jours restants' },
      { label: 'Volume hebdomadaire', value: 82, detail: '8 h 12 / 10 h' },
      { label: 'Récupération', value: 73, detail: 'objectif supérieur à 70 %' },
    ],
  },
  'Présences': {
    columns: ['Date', 'Séance', 'Heure prévue', 'Arrivée', 'Durée', 'Statut'],
    rows: [
      ['10 août 2026', 'Sparring technique', '17:30', '17:24', '75 min', 'Présent'],
      ['09 août 2026', 'Force maximale', '08:00', '07:57', '60 min', 'Présent'],
      ['07 août 2026', 'Lutte & cage', '18:00', '18:11', '80 min', 'Retard'],
    ],
    action: 'Déclarer une présence', stages: ['Convocation', 'Pointage', 'Validation coach'], rowActions: ['Justifier', 'Contester'],
  },
  'Objectifs': {
    columns: ['Objectif', 'Indicateur', 'Cible', 'Actuel', 'Échéance', 'Statut'],
    rows: [
      ['Poids de combat', 'Poids matin', '70,3 kg', '72,1 kg', '29 août 2026', 'En cours'],
      ['Cardio', 'VO2 max', '58 ml/kg/min', '56,4 ml/kg/min', '20 août 2026', 'En cours'],
      ['Défense takedown', 'Réussite', '85 %', '82 %', '24 août 2026', 'Atteint'],
      ['Sommeil', 'Moyenne 7 jours', '8 h', '7 h 34', 'Continu', 'À surveiller'],
    ],
    action: 'Créer un objectif', stages: ['Définition', 'Mesure initiale', 'Suivi', 'Évaluation'], rowActions: ['Mettre à jour', 'Valider avec le coach'],
  },
};

const preparation: Record<string, FighterTabSeed> = {
  'Camp': {
    columns: ['Phase', 'Période', 'Priorité', 'Volume', 'Responsable', 'Statut'],
    rows: [
      ['Développement', '01–09 août 2026', 'Volume & technique', '11 h/semaine', 'Coach Hery Randria', 'Terminé'],
      ['Spécifique', '10–23 août 2026', 'Adversaire & cage', '9 h/semaine', 'Staff complet', 'En cours'],
      ['Affûtage', '24–29 août 2026', 'Vitesse & récupération', '5 h/semaine', 'Coach Feno R.', 'Planifié'],
    ],
    action: 'Ajouter une phase', stages: ['Objectif combat', 'Planification', 'Camp', 'Affûtage', 'Combat'], rowActions: ['Valider la phase', 'Ajuster la charge'],
  },
  'Adversaire': {
    columns: ['Combattant', 'Record', 'Style', 'Forces', 'Faiblesse ciblée', 'Statut'],
    rows: [
      ['Andriamahefa Nomena', '9–3–0', 'Striker orthodoxe', 'Boxe · low kicks', 'Défense lutte', 'Confirmé'],
      ['Derniers 3 combats', '2 V · 1 D', 'Pression', 'Premier round', 'Cardio R3', 'Analysé'],
      ['Profil physique', '178 cm · 180 cm allonge', 'Explosif', 'Distance', 'Clinch', 'Validé'],
    ],
    action: 'Ajouter une observation', stages: ['Identification', 'Collecte vidéo', 'Analyse', 'Plan tactique'], rowActions: ['Ajouter au plan', 'Partager au coach'],
  },
  'Plan de combat': {
    columns: ['Séquence', 'Objectif', 'Consigne', 'Signal coach', 'Risque', 'Statut'],
    rows: [
      ['Round 1', 'Casser la distance', 'Jab · low kick extérieur', 'Tempo', 'Contre droit', 'Validé'],
      ['Round 2', 'Amener au sol', 'Double leg contre cage', 'Niveau', 'Guillotine', 'Validé'],
      ['Round 3', 'Contrôler', 'Clinch et pression', 'Calme', 'Fatigue', 'En cours'],
    ],
    action: 'Ajouter une séquence', stages: ['Analyse', 'Hypothèses', 'Répétition', 'Validation', 'Exécution'], rowActions: ['Marquer maîtrisé', 'Tester en sparring'],
  },
  'Poids': {
    columns: ['Date', 'Poids', 'Cible', 'Écart', 'Hydratation', 'Statut'],
    rows: [
      ['11 août 2026', '72,1 kg', '72,4 kg', '-0,3 kg', '66 %', 'Conforme'],
      ['10 août 2026', '72,5 kg', '72,7 kg', '-0,2 kg', '64 %', 'Conforme'],
      ['09 août 2026', '72,9 kg', '73,0 kg', '-0,1 kg', '67 %', 'Conforme'],
      ['08 août 2026', '73,4 kg', '73,2 kg', '+0,2 kg', '62 %', 'À surveiller'],
    ],
    action: 'Ajouter une pesée', stages: ['Poids initial', 'Descente contrôlée', 'Pesée officielle', 'Réhydratation'], rowActions: ['Notifier le nutritionniste', 'Ajouter une mesure'],
    progress: [
      { label: 'Objectif pesée', value: 77, detail: '1,8 kg restants sur 7,8 kg' },
      { label: 'Hydratation', value: 66, detail: 'zone de vigilance' },
    ],
  },
  'Checklist': {
    columns: ['Élément', 'Catégorie', 'Responsable', 'Échéance', 'Preuve', 'Statut'],
    rows: [
      ['Licence & assurance', 'Administratif', 'Manager Lalao', '20 août 2026', 'Documents déposés', 'Validé'],
      ['Certificat pré-combat', 'Médical', 'Dr Lova', '22 août 2026', 'Rendez-vous 14 août', 'En cours'],
      ['Équipement coin rouge', 'Matériel', 'Coach Feno R.', '28 août 2026', 'Liste complète', 'Confirmé'],
      ['Transport Mahajanga', 'Logistique', 'Manager Lalao', '27 août 2026', 'Billet réservé', 'Confirmé'],
      ['Poids officiel', 'Sport', 'Nutritionniste', '29 août 2026', 'Suivi quotidien', 'En cours'],
    ],
    action: 'Ajouter une tâche', stages: ['Inventaire', 'Attribution', 'Contrôle', 'Prêt au combat'], rowActions: ['Marquer terminé', 'Relancer le responsable'],
  },
};

export function trainingPreparationMock(module: 'training' | 'fight-preparation', tab: string) {
  return fighterMock(module === 'training' ? 'Entraînement' : 'Préparation combat', tab, (module === 'training' ? training : preparation)[tab]!);
}
