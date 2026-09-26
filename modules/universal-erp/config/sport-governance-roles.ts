import type { UniversalRoleDefinition } from '../types';
import { defineErpTabs } from '@/modules/erp-navigation';
const tab = (id: string, label: string) => ({ id, label, legacyIds: [label] });

export const sportGovernanceRoleDefinitions: UniversalRoleDefinition[] = [
  {
    id: 'federation', label: 'Fédération', guardRole: 'federation', workspaceStatus: 'Fédération opérationnelle',
    modules: [
      { id: 'overview', label: 'Vue d’ensemble', tabs: [], icon: 'overview' },
      { id: 'affiliations', label: 'Affiliations', tabs: defineErpTabs([tab('leagues', 'Ligues'), tab('clubs', 'Clubs'), tab('requests', 'Demandes'), tab('renewals', 'Renouvellements')]), icon: 'organizations' },
      { id: 'members', label: 'Licenciés', tabs: defineErpTabs([tab('fighters', 'Combattants'), tab('coaches', 'Coachs'), tab('referees', 'Arbitres'), tab('judges', 'Juges'), tab('leaders', 'Dirigeants')]), icon: 'users' },
      { id: 'competitions', label: 'Compétitions', tabs: defineErpTabs([tab('calendar', 'Calendrier'), tab('approvals', 'Homologations'), tab('registrations', 'Inscriptions'), tab('results', 'Résultats'), tab('rankings', 'Classements')]), icon: 'events' },
      { id: 'sport', label: 'Sport', tabs: defineErpTabs([tab('disciplines', 'Disciplines'), tab('categories', 'Catégories'), tab('rules', 'Règlements'), tab('selections', 'Sélections'), tab('national-team', 'Équipe nationale')]), icon: 'sport' },
      { id: 'licenses', label: 'Licences', tabs: defineErpTabs([tab('issuance', 'Délivrance'), tab('renewals', 'Renouvellements'), tab('suspensions', 'Suspensions'), tab('checks', 'Contrôles')]), icon: 'documents' },
      { id: 'training', label: 'Formation', tabs: defineErpTabs([tab('sessions', 'Sessions'), tab('certifications', 'Certifications'), tab('exams', 'Examens'), tab('trainers', 'Formateurs')]), icon: 'training' },
      { id: 'finance', label: 'Finances', tabs: defineErpTabs([tab('summary', 'Synthèse'), tab('fees', 'Cotisations'), tab('grants', 'Subventions'), tab('expenses', 'Dépenses'), tab('payments', 'Paiements')]), icon: 'finance' },
      { id: 'performance', label: 'Performance', tabs: defineErpTabs([tab('national', 'National'), tab('leagues', 'Ligues'), tab('clubs', 'Clubs'), tab('athletes', 'Athlètes'), tab('reports', 'Rapports')]), icon: 'performance' },
      { id: 'settings', label: 'Paramètres', tabs: defineErpTabs([tab('federation', 'Fédération'), tab('users', 'Utilisateurs'), tab('permissions', 'Droits'), tab('references', 'Référentiels')]), icon: 'settings' },
      { id: 'live', label: 'Competition Control', tabs: defineErpTabs([tab('live', 'Direct')]), icon: 'live', live: true },
    ],
    overview: {
      kpis: [
        { label: 'Licenciés actifs', value: '8 426', detail: '+9,2 % cette saison', tone: 'blue' },
        { label: 'Clubs affiliés', value: '184', detail: '12 en renouvellement', tone: 'green' },
        { label: 'Ligues régionales', value: '18', detail: '16 conformes', tone: 'blue' },
        { label: 'Compétitions', value: '42', detail: '8 à venir', tone: 'red' },
        { label: 'Officiels certifiés', value: '326', detail: '91 % disponibles', tone: 'green' },
        { label: 'Cotisations', value: '86 %', detail: 'objectif annuel', tone: 'amber' },
      ],
      focusLabel: 'Compétition fédérale', focusTitle: 'Championnat Madagascar MMA 2026', focusDetail: 'Palais des Sports · 18–20 septembre', readiness: 74,
      alerts: [
        { label: '12 licences expirent cette semaine', detail: 'Combattants engagés', severity: 'critical' },
        { label: '2 ligues en non-conformité', detail: 'Documents statutaires manquants', severity: 'warning' },
        { label: 'Sélection nationale à publier', detail: 'Validation comité technique', severity: 'info' },
      ],
      activity: [
        { label: 'Club Boeny Fight affilié', detail: 'Il y a 16 min' },
        { label: 'Résultats Ligue Analamanga validés', detail: 'Il y a 44 min' },
        { label: '18 licences renouvelées', detail: 'Il y a 1 h' },
      ],
      quickActions: [
        { label: 'Homologuer une compétition', moduleId: 'competitions', tab: 'Homologations' },
        { label: 'Traiter les licences', moduleId: 'licenses', tab: 'Délivrance' },
        { label: 'Voir les affiliations', moduleId: 'affiliations', tab: 'Demandes' },
      ],
    },
    live: {
      title: 'Championnat Madagascar MMA', subtitle: 'Competition Control · Palais des Sports', metric: '1 248', metricLabel: 'Participants accrédités',
      secondary: [
        { label: 'Aires actives', value: '4 / 4', tone: 'green' },
        { label: 'Combats terminés', value: '38 / 64', tone: 'blue' },
        { label: 'Officiels', value: '42 / 44', tone: 'green' },
        { label: 'Médical', value: 'Prêt', tone: 'green' },
        { label: 'Incidents', value: '2', tone: 'red' },
        { label: 'Retard', value: '+8 min', tone: 'red' },
      ],
    },
  },
  {
    id: 'league', label: 'Ligue', guardRole: 'league', workspaceStatus: 'Ligue régionale active',
    modules: [
      { id: 'overview', label: 'Vue d’ensemble', tabs: [], icon: 'overview' },
      { id: 'clubs', label: 'Clubs', tabs: defineErpTabs([tab('affiliated', 'Affiliés'), tab('requests', 'Demandes'), tab('compliance', 'Conformité'), tab('rankings', 'Classements')]), icon: 'organizations' },
      { id: 'members', label: 'Licenciés', tabs: defineErpTabs([tab('fighters', 'Combattants'), tab('coaches', 'Coachs'), tab('officials', 'Officiels'), tab('transfers', 'Mutations')]), icon: 'users' },
      { id: 'competitions', label: 'Compétitions', tabs: defineErpTabs([tab('events', 'Événements'), tab('registrations', 'Inscriptions'), tab('categories', 'Catégories'), tab('planning', 'Planning'), tab('results', 'Résultats')]), icon: 'events' },
      { id: 'officials', label: 'Officiels', tabs: defineErpTabs([tab('referees', 'Arbitres'), tab('judges', 'Juges'), tab('assignments', 'Désignations'), tab('availability', 'Disponibilités')]), icon: 'sport' },
      { id: 'development', label: 'Développement', tabs: defineErpTabs([tab('training', 'Formations'), tab('camps', 'Stages'), tab('talents', 'Talents'), tab('programs', 'Programmes')]), icon: 'training' },
      { id: 'documents', label: 'Documents', tabs: defineErpTabs([tab('circulars', 'Circulaires'), tab('rules', 'Règlements'), tab('minutes', 'PV'), tab('archives', 'Archives')]), icon: 'documents' },
      { id: 'finance', label: 'Finances', tabs: defineErpTabs([tab('summary', 'Synthèse'), tab('fees', 'Cotisations'), tab('budget', 'Budget'), tab('expenses', 'Dépenses'), tab('payments', 'Paiements')]), icon: 'finance' },
      { id: 'performance', label: 'Performance', tabs: defineErpTabs([tab('clubs', 'Clubs'), tab('athletes', 'Athlètes'), tab('competitions', 'Compétitions'), tab('reports', 'Rapports')]), icon: 'performance' },
      { id: 'settings', label: 'Paramètres', tabs: defineErpTabs([tab('league', 'Ligue'), tab('team', 'Équipe'), tab('permissions', 'Droits'), tab('notifications', 'Notifications')]), icon: 'settings' },
      { id: 'live', label: 'Ligue Live', tabs: defineErpTabs([tab('live', 'Direct')]), icon: 'live', live: true },
    ],
    overview: {
      kpis: [
        { label: 'Clubs affiliés', value: '26', detail: '24 conformes', tone: 'blue' },
        { label: 'Licenciés', value: '1 842', detail: '+126 cette saison', tone: 'green' },
        { label: 'Compétitions', value: '12', detail: '3 en préparation', tone: 'red' },
        { label: 'Officiels actifs', value: '68', detail: '7 indisponibles', tone: 'amber' },
        { label: 'Cotisations reçues', value: '78 %', detail: '20 clubs à jour', tone: 'blue' },
        { label: 'Talents suivis', value: '42', detail: '8 présélectionnés', tone: 'green' },
      ],
      focusLabel: 'Événement régional', focusTitle: 'Open Analamanga Combat 2026', focusDetail: 'Gymnase Mahamasina · 6 septembre', readiness: 81,
      alerts: [
        { label: '2 clubs non conformes', detail: 'Assurance et bureau incomplets', severity: 'critical' },
        { label: '7 officiels indisponibles', detail: 'Planning du 6 septembre', severity: 'warning' },
        { label: 'Liste des catégories prête', detail: 'Publication possible', severity: 'info' },
      ],
      activity: [
        { label: 'Dojo Avenir renouvelé', detail: 'Il y a 20 min' },
        { label: 'Planning Open Analamanga publié', detail: 'Il y a 52 min' },
        { label: '5 mutations validées', detail: 'Il y a 2 h' },
      ],
      quickActions: [
        { label: 'Gérer la compétition', moduleId: 'competitions', tab: 'Événements' },
        { label: 'Affecter les officiels', moduleId: 'officials', tab: 'Désignations' },
        { label: 'Contrôler les clubs', moduleId: 'clubs', tab: 'Conformité' },
      ],
    },
    live: {
      title: 'Open Analamanga Combat', subtitle: 'Ligue Live · Gymnase Mahamasina', metric: '642', metricLabel: 'Participants présents',
      secondary: [
        { label: 'Aires actives', value: '3 / 3', tone: 'green' },
        { label: 'Combats', value: '21 / 36', tone: 'blue' },
        { label: 'Officiels', value: '18 / 20', tone: 'red' },
        { label: 'Clubs', value: '22', tone: 'blue' },
        { label: 'Incidents', value: '1', tone: 'red' },
        { label: 'Planning', value: 'À l’heure', tone: 'green' },
      ],
    },
  },
  {
    id: 'club', label: 'Club', guardRole: 'club', workspaceStatus: 'Club opérationnel',
    modules: [
      { id: 'overview', label: 'Vue d’ensemble', tabs: [], icon: 'overview' },
      { id: 'members', label: 'Membres', tabs: defineErpTabs([tab('all', 'Tous'), tab('fighters', 'Combattants'), tab('coaches', 'Coachs'), tab('memberships', 'Adhésions'), tab('attendance', 'Présences')]), icon: 'users' },
      { id: 'training', label: 'Entraînement', tabs: defineErpTabs([tab('planning', 'Planning'), tab('sessions', 'Séances'), tab('programs', 'Programmes'), tab('groups', 'Groupes'), tab('evaluations', 'Évaluations')]), icon: 'training' },
      { id: 'competitions', label: 'Compétitions', tabs: defineErpTabs([tab('calendar', 'Calendrier'), tab('registrations', 'Inscriptions'), tab('engaged', 'Engagés'), tab('results', 'Résultats'), tab('travel', 'Déplacements')]), icon: 'events' },
      { id: 'sport', label: 'Sport', tabs: defineErpTabs([tab('disciplines', 'Disciplines'), tab('categories', 'Catégories'), tab('fight-camps', 'Fight camps'), tab('talents', 'Talents')]), icon: 'sport' },
      { id: 'medical', label: 'Suivi médical', tabs: defineErpTabs([tab('fitness', 'Aptitudes'), tab('certificates', 'Certificats'), tab('injuries', 'Blessures'), tab('weight', 'Poids')]), icon: 'medical' },
      { id: 'licenses', label: 'Licences', tabs: defineErpTabs([tab('active', 'Actives'), tab('requests', 'Demandes'), tab('renewals', 'Renouvellements'), tab('insurance', 'Assurances')]), icon: 'documents' },
      { id: 'finance', label: 'Finances', tabs: defineErpTabs([tab('summary', 'Synthèse'), tab('fees', 'Cotisations'), tab('revenue', 'Revenus'), tab('expenses', 'Dépenses'), tab('payments', 'Paiements')]), icon: 'finance' },
      { id: 'performance', label: 'Performance', tabs: defineErpTabs([tab('fighters', 'Combattants'), tab('groups', 'Groupes'), tab('competitions', 'Compétitions'), tab('reports', 'Rapports')]), icon: 'performance' },
      { id: 'settings', label: 'Paramètres', tabs: defineErpTabs([tab('club', 'Club'), tab('team', 'Équipe'), tab('permissions', 'Droits'), tab('subscription', 'Abonnement')]), icon: 'settings' },
      { id: 'live', label: 'Club Day', tabs: defineErpTabs([tab('live', 'Direct')]), icon: 'live', live: true },
    ],
    overview: {
      kpis: [
        { label: 'Membres actifs', value: '184', detail: '+12 ce mois', tone: 'blue' },
        { label: 'Combattants', value: '62', detail: '8 en fight camp', tone: 'red' },
        { label: 'Présence moyenne', value: '82 %', detail: '+4 % sur 30 jours', tone: 'green' },
        { label: 'Licences valides', value: '91 %', detail: '16 à renouveler', tone: 'amber' },
        { label: 'Cotisations', value: '76 %', detail: '42 impayés', tone: 'blue' },
        { label: 'Podiums saison', value: '28', detail: '11 médailles d’or', tone: 'green' },
      ],
      focusLabel: 'Fight camp prioritaire', focusTitle: 'Équipe MFN Vol.3 · 4 combattants', focusDetail: 'Camp semaine 4 sur 6 · départ le 27 août', readiness: 79,
      alerts: [
        { label: '3 certificats médicaux expirent', detail: 'Bloque les inscriptions', severity: 'critical' },
        { label: '42 cotisations en attente', detail: 'Relance programmée', severity: 'warning' },
        { label: 'Planning septembre disponible', detail: 'Validation des coachs', severity: 'info' },
      ],
      activity: [
        { label: 'Séance MMA du soir confirmée', detail: 'Il y a 10 min' },
        { label: '2 nouvelles adhésions', detail: 'Il y a 47 min' },
        { label: 'Inscription MFN validée', detail: 'Il y a 1 h' },
      ],
      quickActions: [
        { label: 'Planifier une séance', moduleId: 'training', tab: 'Planning' },
        { label: 'Gérer les membres', moduleId: 'members', tab: 'Tous' },
        { label: 'Voir le fight camp', moduleId: 'sport', tab: 'Fight camps' },
      ],
    },
    live: {
      title: 'Dojo Sakura · Club Day', subtitle: 'Entraînements et opérations du jour', metric: '68', metricLabel: 'Membres présents',
      secondary: [
        { label: 'Séances actives', value: '3', tone: 'blue' },
        { label: 'Coachs', value: '8 / 9', tone: 'green' },
        { label: 'Combattants camp', value: '8', tone: 'red' },
        { label: 'Accès', value: '68 / 74', tone: 'blue' },
        { label: 'Médical', value: 'Prêt', tone: 'green' },
        { label: 'Incidents', value: '0', tone: 'green' },
      ],
    },
  },
];
