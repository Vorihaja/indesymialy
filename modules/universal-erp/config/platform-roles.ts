import type { UniversalRoleDefinition } from '../types';

export const platformRoleDefinitions: UniversalRoleDefinition[] = [
  {
    id: 'super-admin', label: 'Super Admin', guardRole: 'super_admin', workspaceStatus: 'Plateforme opérationnelle',
    modules: [
      { id: 'overview', label: 'Vue d’ensemble', tabs: [], icon: 'overview' },
      { id: 'platform', label: 'Plateforme', tabs: ['Santé système', 'Services', 'Environnements', 'Incidents'], icon: 'security' },
      { id: 'users', label: 'Utilisateurs', tabs: ['Tous', 'Rôles système', 'Accès', 'Sessions', 'Demandes'], icon: 'users' },
      { id: 'organizations', label: 'Organisations', tabs: ['Toutes', 'Fédérations', 'Ligues', 'Clubs', 'Partenaires'], icon: 'organizations' },
      { id: 'governance', label: 'Gouvernance', tabs: ['Permissions', 'Politiques', 'Conformité', 'Audit'], icon: 'security' },
      { id: 'content', label: 'Contenus', tabs: ['Actualités', 'Médias', 'Signalements', 'Modération'], icon: 'communication' },
      { id: 'finance', label: 'Finances plateforme', tabs: ['Synthèse', 'Abonnements', 'Commissions', 'Paiements', 'Facturation'], icon: 'finance' },
      { id: 'analytics', label: 'Analytics', tabs: ['Adoption', 'Usage', 'Revenus', 'Fiabilité', 'Rapports'], icon: 'performance' },
      { id: 'settings', label: 'Configuration', tabs: ['Général', 'Référentiels', 'Intégrations', 'Fonctionnalités', 'Maintenance'], icon: 'settings' },
      { id: 'live', label: 'Platform Control', tabs: ['Direct'], icon: 'live', live: true },
    ],
    overview: {
      kpis: [
        { label: 'Utilisateurs actifs', value: '48 214', detail: '+8,4 % sur 30 jours', tone: 'blue' },
        { label: 'Organisations', value: '1 286', detail: '92 en validation', tone: 'green' },
        { label: 'Disponibilité', value: '99,97 %', detail: '30 derniers jours', tone: 'green' },
        { label: 'Incidents actifs', value: '3', detail: '1 priorité haute', tone: 'red' },
        { label: 'MRR plateforme', value: '184,2 M Ar', detail: '+12,1 %', tone: 'blue' },
        { label: 'Demandes d’accès', value: '47', detail: '18 à traiter', tone: 'amber' },
      ],
      focusLabel: 'Priorité plateforme', focusTitle: 'Migration du moteur de permissions', focusDetail: 'Déploiement progressif · vague 3 sur 4', readiness: 78,
      alerts: [
        { label: 'Latence élevée sur la région Océan Indien', detail: 'API · p95 à 842 ms', severity: 'critical' },
        { label: '18 demandes Super Admin en attente', detail: 'Contrôle d’identité requis', severity: 'warning' },
        { label: 'Rotation des clés programmée', detail: '15 août 2026 · 02:00', severity: 'info' },
      ],
      activity: [
        { label: 'Rôle Fédération attribué à FMMA', detail: 'Il y a 12 min' },
        { label: 'Incident API clôturé', detail: 'Il y a 38 min' },
        { label: 'Nouvelle organisation validée', detail: 'Il y a 1 h' },
      ],
      quickActions: [
        { label: 'Examiner les accès', moduleId: 'users', tab: 'Demandes' },
        { label: 'Voir les incidents', moduleId: 'platform', tab: 'Incidents' },
        { label: 'Ouvrir l’audit', moduleId: 'governance', tab: 'Audit' },
      ],
    },
    live: {
      title: 'Indesy Mialy Platform Control', subtitle: 'Supervision temps réel de la plateforme', metric: '99,97 %', metricLabel: 'Disponibilité globale',
      secondary: [
        { label: 'Sessions actives', value: '8 421', tone: 'blue' },
        { label: 'Requêtes / min', value: '12 840', tone: 'blue' },
        { label: 'Services', value: '24 / 24', tone: 'green' },
        { label: 'Incidents', value: '3', tone: 'red' },
        { label: 'Files de tâches', value: '1 204', tone: 'blue' },
        { label: 'Alertes sécurité', value: '1', tone: 'red' },
      ],
    },
  },
  {
    id: 'admin', label: 'Admin', guardRole: 'admin', workspaceStatus: 'Administration active',
    modules: [
      { id: 'overview', label: 'Vue d’ensemble', tabs: [], icon: 'overview' },
      { id: 'users', label: 'Utilisateurs', tabs: ['Comptes', 'Profils', 'Rôles', 'Suspensions', 'Demandes'], icon: 'users' },
      { id: 'organizations', label: 'Organisations', tabs: ['Dossiers', 'Validations', 'Membres', 'Conformité'], icon: 'organizations' },
      { id: 'moderation', label: 'Modération', tabs: ['Signalements', 'Contenus', 'Commentaires', 'Sanctions'], icon: 'security' },
      { id: 'events', label: 'Événements', tabs: ['À valider', 'Publiés', 'Litiges', 'Archives'], icon: 'events' },
      { id: 'support', label: 'Support', tabs: ['Tickets', 'Incidents', 'Escalades', 'Satisfaction'], icon: 'communication' },
      { id: 'finance', label: 'Paiements', tabs: ['Synthèse', 'Transactions', 'Remboursements', 'Litiges'], icon: 'finance' },
      { id: 'reports', label: 'Rapports', tabs: ['Activité', 'Sécurité', 'Conformité', 'Exports'], icon: 'performance' },
      { id: 'settings', label: 'Paramètres', tabs: ['Préférences', 'Notifications', 'Modèles', 'Intégrations'], icon: 'settings' },
      { id: 'live', label: 'Admin Desk', tabs: ['Direct'], icon: 'live', live: true },
    ],
    overview: {
      kpis: [
        { label: 'Dossiers ouverts', value: '126', detail: '31 prioritaires', tone: 'amber' },
        { label: 'Utilisateurs actifs', value: '18 420', detail: '+462 cette semaine', tone: 'blue' },
        { label: 'Organisations à valider', value: '42', detail: 'délai moyen 18 h', tone: 'amber' },
        { label: 'Signalements', value: '28', detail: '4 critiques', tone: 'red' },
        { label: 'Tickets résolus', value: '94 %', detail: 'sur 7 jours', tone: 'green' },
        { label: 'Transactions', value: '86,4 M Ar', detail: 'ce mois', tone: 'blue' },
      ],
      focusLabel: 'Dossier prioritaire', focusTitle: 'Validation Fédération Atsinanana', focusDetail: 'Documents reçus · contrôle légal en cours', readiness: 72,
      alerts: [
        { label: '4 signalements critiques', detail: 'Modération immédiate requise', severity: 'critical' },
        { label: '12 remboursements hors délai', detail: 'Échéance dépassée de 24 h', severity: 'warning' },
        { label: 'Rapport hebdomadaire prêt', detail: 'Export disponible', severity: 'info' },
      ],
      activity: [
        { label: 'Compte vendeur suspendu', detail: 'Il y a 8 min' },
        { label: 'Événement validé · Tana Open', detail: 'Il y a 21 min' },
        { label: 'Litige paiement résolu', detail: 'Il y a 54 min' },
      ],
      quickActions: [
        { label: 'Traiter les signalements', moduleId: 'moderation', tab: 'Signalements' },
        { label: 'Valider une organisation', moduleId: 'organizations', tab: 'Validations' },
        { label: 'Ouvrir le support', moduleId: 'support', tab: 'Tickets' },
      ],
    },
    live: {
      title: 'Administration Desk', subtitle: 'Flux opérationnels de la plateforme', metric: '126', metricLabel: 'Dossiers actifs',
      secondary: [
        { label: 'Modération', value: '28', tone: 'red' },
        { label: 'Support', value: '34', tone: 'blue' },
        { label: 'Validations', value: '42', tone: 'blue' },
        { label: 'Litiges', value: '7', tone: 'red' },
        { label: 'Agents', value: '18 / 21', tone: 'green' },
        { label: 'SLA', value: '94 %', tone: 'green' },
      ],
    },
  },
];
