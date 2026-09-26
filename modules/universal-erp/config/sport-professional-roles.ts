import type { UniversalRoleDefinition } from '../types';
import { defineErpTabs } from '@/modules/erp-navigation';
const tab = (id: string, label: string) => ({ id, label, legacyIds: [label] });

export const sportProfessionalRoleDefinitions: UniversalRoleDefinition[] = [
  {
    id: 'coach', label: 'Coach', guardRole: 'coach', workspaceStatus: 'Encadrement actif',
    modules: [
      { id: 'overview', label: 'Vue d’ensemble', tabs: [], icon: 'overview' },
      { id: 'athletes', label: 'Combattants', tabs: defineErpTabs([tab('roster', 'Roster'), tab('profiles', 'Profils'), tab('availability', 'Disponibilités'), tab('invitations', 'Invitations')]), icon: 'users' },
      { id: 'training', label: 'Entraînement', tabs: defineErpTabs([tab('planning', 'Planning'), tab('sessions', 'Séances'), tab('programs', 'Programmes'), tab('attendance', 'Présences'), tab('load', 'Charge')]), icon: 'training' },
      { id: 'camps', label: 'Fight camps', tabs: defineErpTabs([tab('active', 'Actifs'), tab('preparation', 'Préparation'), tab('sparring', 'Sparring'), tab('weight', 'Poids'), tab('checklists', 'Checklists')]), icon: 'sport' },
      { id: 'competitions', label: 'Compétitions', tabs: defineErpTabs([tab('calendar', 'Calendrier'), tab('proposals', 'Propositions'), tab('registrations', 'Inscriptions'), tab('results', 'Résultats')]), icon: 'events' },
      { id: 'performance', label: 'Performance', tabs: defineErpTabs([tab('evaluations', 'Évaluations'), tab('tests', 'Tests'), tab('fight', 'Combat'), tab('progress', 'Progression'), tab('reports', 'Rapports')]), icon: 'performance' },
      { id: 'medical', label: 'Médical', tabs: defineErpTabs([tab('fitness', 'Aptitudes'), tab('injuries', 'Blessures'), tab('recovery', 'Récupération'), tab('alerts', 'Alertes')]), icon: 'medical' },
      { id: 'team', label: 'Équipe technique', tabs: defineErpTabs([tab('staff', 'Staff'), tab('assignments', 'Affectations'), tab('availability', 'Disponibilités'), tab('invitations', 'Invitations')]), icon: 'organizations' },
      { id: 'finance', label: 'Finances', tabs: defineErpTabs([tab('summary', 'Synthèse'), tab('contracts', 'Contrats'), tab('fees', 'Honoraires'), tab('payments', 'Paiements'), tab('expenses', 'Dépenses')]), icon: 'finance' },
      { id: 'settings', label: 'Paramètres', tabs: defineErpTabs([tab('profile', 'Profil'), tab('permissions', 'Droits'), tab('notifications', 'Notifications'), tab('preferences', 'Préférences')]), icon: 'settings' },
      { id: 'live', label: 'Corner Live', tabs: defineErpTabs([tab('live', 'Direct')]), icon: 'live', live: true },
    ],
    overview: {
      kpis: [
        { label: 'Combattants actifs', value: '12', detail: '4 en fight camp', tone: 'blue' },
        { label: 'Séances semaine', value: '18', detail: '14 réalisées', tone: 'green' },
        { label: 'Présence moyenne', value: '88 %', detail: '+5 % ce mois', tone: 'green' },
        { label: 'Combats à venir', value: '5', detail: '2 sous 30 jours', tone: 'red' },
        { label: 'Alertes médicales', value: '3', detail: '1 critique', tone: 'amber' },
        { label: 'Win rate saison', value: '74 %', detail: '17 V · 6 D', tone: 'blue' },
      ],
      focusLabel: 'Fight camp prioritaire', focusTitle: 'Tiana Rakoto · MFN Vol.3', focusDetail: 'Semaine 4 sur 6 · poids actuel 72,1 kg', readiness: 82,
      alerts: [
        { label: 'Certificat Andry expire dans 5 jours', detail: 'Combat bloqué sans renouvellement', severity: 'critical' },
        { label: 'Charge aiguë élevée pour Tiana', detail: 'Réduire de 12 % cette semaine', severity: 'warning' },
        { label: 'Plan tactique prêt à valider', detail: 'Round 2 · lutte contre cage', severity: 'info' },
      ],
      activity: [
        { label: 'Tiana a enregistré son poids', detail: 'Il y a 18 min' },
        { label: 'Séance sparring validée', detail: 'Il y a 43 min' },
        { label: 'Invitation combat reçue', detail: 'Il y a 2 h' },
      ],
      quickActions: [
        { label: 'Ouvrir le roster', moduleId: 'athletes', tab: 'Roster' },
        { label: 'Planifier une séance', moduleId: 'training', tab: 'Planning' },
        { label: 'Gérer le fight camp', moduleId: 'camps', tab: 'Actifs' },
      ],
    },
    live: {
      title: 'Corner Live · MFN Vol.3', subtitle: 'Tiana Rakoto · Coin rouge', metric: '02:48', metricLabel: 'Round 2 · temps restant',
      secondary: [
        { label: 'Combattant', value: 'Prêt', tone: 'green' },
        { label: 'Équipe coin', value: '3 / 3', tone: 'green' },
        { label: 'Plan tactique', value: 'Phase B', tone: 'blue' },
        { label: 'Médical', value: 'Prêt', tone: 'green' },
        { label: 'Avertissements', value: '1', tone: 'red' },
        { label: 'Prochain round', value: 'R3', tone: 'blue' },
      ],
    },
  },
  {
    id: 'referee', label: 'Arbitre', guardRole: 'referee', workspaceStatus: 'Arbitre disponible',
    modules: [
      { id: 'overview', label: 'Vue d’ensemble', tabs: [], icon: 'overview' },
      { id: 'assignments', label: 'Désignations', tabs: defineErpTabs([tab('upcoming', 'À venir'), tab('confirmed', 'Confirmées'), tab('requests', 'Demandes'), tab('replacements', 'Remplacements')]), icon: 'events' },
      { id: 'fights', label: 'Combats', tabs: defineErpTabs([tab('fight-cards', 'Fight cards'), tab('briefings', 'Briefings'), tab('results', 'Résultats'), tab('incidents', 'Incidents')]), icon: 'sport' },
      { id: 'availability', label: 'Disponibilités', tabs: defineErpTabs([tab('calendar', 'Calendrier'), tab('unavailability', 'Indisponibilités'), tab('travel', 'Déplacements')]), icon: 'events' },
      { id: 'licenses', label: 'Licences', tabs: defineErpTabs([tab('license', 'Licence'), tab('certifications', 'Certifications'), tab('renewals', 'Renouvellements'), tab('documents', 'Documents')]), icon: 'documents' },
      { id: 'training', label: 'Formation', tabs: defineErpTabs([tab('modules', 'Modules'), tab('seminars', 'Séminaires'), tab('exams', 'Examens'), tab('rules', 'Règlements')]), icon: 'training' },
      { id: 'evaluations', label: 'Évaluations', tabs: defineErpTabs([tab('summary', 'Synthèse'), tab('reports', 'Rapports'), tab('feedback', 'Feedback'), tab('progress', 'Progression')]), icon: 'performance' },
      { id: 'finance', label: 'Indemnités', tabs: defineErpTabs([tab('summary', 'Synthèse'), tab('receivable', 'À recevoir'), tab('payments', 'Paiements'), tab('travel', 'Déplacements')]), icon: 'finance' },
      { id: 'settings', label: 'Paramètres', tabs: defineErpTabs([tab('profile', 'Profil'), tab('zones', 'Zones'), tab('notifications', 'Notifications'), tab('preferences', 'Préférences')]), icon: 'settings' },
      { id: 'live', label: 'Fight Live', tabs: defineErpTabs([tab('live', 'Direct')]), icon: 'live', live: true },
    ],
    overview: {
      kpis: [
        { label: 'Désignations', value: '8', detail: '30 prochains jours', tone: 'blue' },
        { label: 'Combats arbitrés', value: '126', detail: 'carrière officielle', tone: 'green' },
        { label: 'Note moyenne', value: '4,8 / 5', detail: '24 évaluations', tone: 'green' },
        { label: 'Disponibilité', value: '92 %', detail: 'ce trimestre', tone: 'blue' },
        { label: 'Incidents saison', value: '2', detail: 'tous clôturés', tone: 'amber' },
        { label: 'Indemnités dues', value: '940 000 Ar', detail: '3 événements', tone: 'red' },
      ],
      focusLabel: 'Prochaine désignation', focusTitle: 'Mahajanga Fight Night Vol.3', focusDetail: 'Main event · Tiana Rakoto vs Nomena', readiness: 91,
      alerts: [
        { label: 'Briefing obligatoire demain', detail: 'Visioconférence · 18:30', severity: 'critical' },
        { label: 'Transport Mahajanga à confirmer', detail: 'Échéance 14 août', severity: 'warning' },
        { label: 'Nouveau règlement publié', detail: 'Fautes au sol · version 2026.3', severity: 'info' },
      ],
      activity: [
        { label: 'Désignation MFN acceptée', detail: 'Il y a 14 min' },
        { label: 'Rapport TFL validé', detail: 'Il y a 1 h' },
        { label: 'Indemnité reçue', detail: 'Hier · 16:42' },
      ],
      quickActions: [
        { label: 'Voir les désignations', moduleId: 'assignments', tab: 'À venir' },
        { label: 'Déclarer une disponibilité', moduleId: 'availability', tab: 'Calendrier' },
        { label: 'Ouvrir les règlements', moduleId: 'training', tab: 'Règlements' },
      ],
    },
    live: {
      title: 'Fight Live · Arbitre central', subtitle: 'Rakoto vs Andriamahefa · Main card', metric: '02:48', metricLabel: 'Round 2 · temps restant',
      secondary: [
        { label: 'Coin rouge', value: '0 avert.', tone: 'green' },
        { label: 'Coin bleu', value: '1 avert.', tone: 'red' },
        { label: 'Médecin', value: 'Prêt', tone: 'green' },
        { label: 'Juges', value: '3 / 3', tone: 'green' },
        { label: 'Chrono', value: 'Synchronisé', tone: 'blue' },
        { label: 'Incident', value: '0', tone: 'green' },
      ],
    },
  },
];
