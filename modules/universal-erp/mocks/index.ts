import type { OrganizerModuleMock } from '@/modules/organizer-erp/types';
import type { UniversalModule, UniversalRoleDefinition, UniversalRoleId } from '../types';

type RoleContext = {
  organization: string;
  people: string[];
  events: string[];
  places: string[];
  references: string[];
};

const contexts: Record<UniversalRoleId, RoleContext> = {
  'super-admin': {
    organization: 'Indesy Mialy Platform',
    people: ['Mialy Rasoanaivo', 'Andry Raveloson', 'Tahina Ramanana'],
    events: ['Déploiement Permissions V3', 'Audit sécurité août', 'Migration Analytics'],
    places: ['Région Océan Indien', 'Production', 'Centre opérationnel'],
    references: ['SYS-8421', 'AUD-2026-08', 'DEP-V3-04'],
  },
  admin: {
    organization: 'Administration Indesy Mialy',
    people: ['Miora Andry', 'Feno Razaka', 'Lova Ramanana'],
    events: ['Validation Fédération Atsinanana', 'Campagne de modération', 'Revue support hebdomadaire'],
    places: ['Desk Admin A', 'File modération', 'Support niveau 2'],
    references: ['ADM-4218', 'MOD-2804', 'SUP-1842'],
  },
  federation: {
    organization: 'Fédération Malagasy des Sports de Combat',
    people: ['Hery Randria', 'Lalao Ramanana', 'Jean Rakoto'],
    events: ['Championnat Madagascar MMA 2026', 'Sélection nationale', 'Séminaire des officiels'],
    places: ['Palais des Sports', 'Centre fédéral', 'Mahamasina'],
    references: ['FMMA-2026-1842', 'NAT-0826', 'OFF-326'],
  },
  league: {
    organization: 'Ligue Analamanga',
    people: ['Soa Raveloson', 'Mamy Nomena', 'Fetra Rakoto'],
    events: ['Open Analamanga Combat', 'Stage régional jeunes', 'Coupe des clubs'],
    places: ['Gymnase Mahamasina', 'Tana Fight Center', 'Analamanga'],
    references: ['LIG-AC-2026', 'STG-0906', 'CLUB-026'],
  },
  club: {
    organization: 'Dojo Sakura',
    people: ['Tiana Rakoto', 'Hery Randria', 'Feno Razaka'],
    events: ['Fight Camp MFN Vol.3', 'Passage de grades', 'Open Analamanga'],
    places: ['Dojo Sakura', 'Fight Lab Mada', 'Stade Rabemananjara'],
    references: ['DS-MEM-184', 'CAMP-MFN3', 'LIC-2026'],
  },
  coach: {
    organization: 'Équipe Coach Hery',
    people: ['Tiana Rakoto', 'Andry Tahina', 'Sitraka Raveloson'],
    events: ['Camp MFN Vol.3', 'Sparring interclubs', 'Tana Combat Series 8'],
    places: ['Dojo Sakura', 'Fight Lab Mada', 'Centre Kiné Plus'],
    references: ['ATH-012', 'CAMP-0826', 'TRAIN-1842'],
  },
  official: {
    organization: 'Corps des officiels FMMA',
    people: ['Jean Rakoto', 'Haja Raveloson', 'Mamy Andry'],
    events: ['Mahajanga Fight Night Vol.3', 'Open Analamanga', 'Tana Combat Series 8'],
    places: ['Stade Rabemananjara', 'Gymnase Mahamasina', 'Tana Arena'],
    references: ['OFF-2026-084', 'MFN-03', 'ASSIGN-126'],
  },
  referee: {
    organization: 'Corps arbitral FMMA',
    people: ['Jean Rakoto', 'Haja Raveloson', 'Mamy Andry'],
    events: ['Mahajanga Fight Night Vol.3', 'Open Analamanga', 'Tana Combat Series 8'],
    places: ['Stade Rabemananjara', 'Gymnase Mahamasina', 'Tana Arena'],
    references: ['REF-2026-084', 'MFN-03', 'ASSIGN-126'],
  },
  judge: {
    organization: 'Commission des juges FMMA',
    people: ['Soa Ramanana', 'Fetra Raveloson', 'Hanitra Rakoto'],
    events: ['Mahajanga Fight Night Vol.3', 'Tana Fight League 5', 'Open Analamanga'],
    places: ['Table juge 2', 'Stade Rabemananjara', 'Tana Arena'],
    references: ['JDG-2026-091', 'CARD-284', 'DEC-052'],
  },
  sponsor: {
    organization: 'Boeny Nutrition',
    people: ['Tiana Rakoto', 'Lalao Ramanana', 'Miora Andry'],
    events: ['Activation MFN Vol.3', 'Road to Fight Week', 'Campagne Équipe Nationale'],
    places: ['Zone VIP MFN', 'Digital', 'Stand Boeny'],
    references: ['SPN-014', 'ACT-MFN3', 'CTR-2026-08'],
  },
  seller: {
    organization: 'Boutique Indesy Combat',
    people: ['Client Rakoto', 'Miora Logistique', 'Agent Andry'],
    events: ['Fight Week MFN', 'Promotion rentrée', 'Inventaire août'],
    places: ['Entrepôt Tana', 'Point relais Boeny', 'Boutique en ligne'],
    references: ['CMD-8421', 'SKU-GMMA-12', 'SHIP-1842'],
  },
  fan: {
    organization: 'Communauté Indesy Mialy',
    people: ['Tiana Rakoto', 'Andriamahefa Nomena', 'Coach Hery'],
    events: ['Mahajanga Fight Night Vol.3', 'Tana Combat Series 8', 'Open Analamanga'],
    places: ['Stade Rabemananjara', 'Live Center', 'Zone Premium'],
    references: ['FAN-8420', 'TKT-MFN-1842', 'PRED-050'],
  },
};

const accents = {
  red: { tone: 'red' as const },
  blue: { tone: 'blue' as const },
  green: { tone: 'green' as const },
  amber: { tone: 'amber' as const },
};

function normalize(value: string) {
  return value.toLocaleLowerCase('fr').normalize('NFD').replaceAll(/[̀-ͯ]/g, '');
}

function baseKpis(tab: string, rows: string[][]): OrganizerModuleMock['kpis'] {
  return [
    { label: 'Total', value: String(rows.length * 8 + 4), detail: `${tab} · périmètre actif`, ...accents.blue },
    { label: 'Actifs', value: String(rows.length * 6 + 1), detail: 'dossiers opérationnels', ...accents.green },
    { label: 'À traiter', value: String(rows.length + 2), detail: 'action requise', ...accents.amber },
    { label: 'Alertes', value: String(Math.max(1, rows.length - 2)), detail: 'priorité métier', ...accents.red },
  ];
}

function financeMock(role: UniversalRoleDefinition, module: UniversalModule, tab: string, context: RoleContext): OrganizerModuleMock {
  const rows = [
    ['08 août 2026', `${tab} · opération principale`, context.organization, '4 800 000 Ar', 'Validé'],
    ['05 août 2026', `${tab} · règlement`, context.people[0], '1 250 000 Ar', 'Payé'],
    ['29 juillet 2026', `${tab} · engagement`, context.events[0], '2 840 000 Ar', 'En attente'],
    ['18 juillet 2026', `${tab} · ajustement`, context.references[0], '680 000 Ar', 'Confirmé'],
  ];
  return {
    label: `${role.label} · ${module.label}`, action: tab.includes('Synthèse') || tab.includes('Rapport') ? 'Exporter le rapport' : 'Ajouter une opération',
    kpis: [
      { label: 'Recettes', value: '18,4 M Ar', detail: 'période active', tone: 'green' },
      { label: 'Dépenses', value: '11,2 M Ar', detail: 'engagées et payées', tone: 'red' },
      { label: 'Solde', value: '7,2 M Ar', detail: 'disponible', tone: 'blue' },
      { label: 'À traiter', value: '6', detail: 'paiements ou justificatifs', tone: 'amber' },
    ],
    columns: ['Date', 'Opération', 'Tiers / Source', 'Montant', 'Statut'], rows,
    workflow: { label: `Workflow · ${tab}`, stages: ['Saisie', 'Contrôle', 'Validation', 'Exécution', 'Rapprochement'], activeStage: 2 },
    rowActions: ['Valider', 'Payer', 'Télécharger le justificatif'],
  };
}

function peopleMock(role: UniversalRoleDefinition, module: UniversalModule, tab: string, context: RoleContext): OrganizerModuleMock {
  const rows = [
    [context.people[0], `${tab} · principal`, context.organization, '11 août 2026', 'Actif'],
    [context.people[1], `${tab} · opérationnel`, context.places[0], '10 août 2026', 'Confirmé'],
    [context.people[2], `${tab} · support`, context.places[1], '08 août 2026', 'En attente'],
    [`Équipe ${context.organization}`, `${tab} · groupe`, context.organization, '05 août 2026', 'Validé'],
  ];
  return {
    label: `${role.label} · ${module.label}`, action: 'Inviter une personne', kpis: baseKpis(tab, rows),
    columns: ['Personne / Groupe', 'Rôle', 'Structure', 'Dernière activité', 'Statut'], rows,
    workflow: { label: `Workflow · ${tab}`, stages: ['Sélection', 'Invitation @mention', 'Vérification', 'Affectation', 'Activation'], activeStage: 2 },
    rowActions: ['Envoyer un message', 'Confirmer', 'Gérer les accès'],
  };
}

function eventMock(role: UniversalRoleDefinition, module: UniversalModule, tab: string, context: RoleContext): OrganizerModuleMock {
  const rows = [
    [context.events[0], '30 août 2026', context.places[0], context.people[0], '82 %', 'Confirmé'],
    [context.events[1], '06 septembre 2026', context.places[1], context.people[1], '64 %', 'En préparation'],
    [context.events[2], '18 octobre 2026', context.places[2], context.people[2], '41 %', 'Brouillon'],
  ];
  return {
    label: `${role.label} · ${module.label}`, action: 'Créer un élément', kpis: baseKpis(tab, rows),
    columns: [tab, 'Date', 'Lieu', 'Responsable', 'Progression', 'Statut'], rows,
    workflow: { label: `Workflow · ${tab}`, stages: ['Création', 'Affectation', 'Préparation', 'Validation', 'Réalisation', 'Bilan'], activeStage: 2 },
    rowActions: ['Confirmer', 'Publier', 'Ouvrir le planning'],
    progress: rows.map((row) => ({ label: row[0], value: Number(row[4].replace(/D/g, '')), detail: `${row[1]} · ${row[2]}` })),
  };
}

function documentMock(role: UniversalRoleDefinition, module: UniversalModule, tab: string, context: RoleContext): OrganizerModuleMock {
  const rows = [
    [`${tab} · dossier principal`, context.references[0], '05 janvier 2026', '31 décembre 2026', context.people[0], 'Valide'],
    [`${tab} · contrôle annuel`, context.references[1], '12 juin 2026', '12 juin 2027', context.people[1], 'En attente'],
    [`${tab} · justificatif`, context.references[2], '08 août 2026', '08 novembre 2026', context.people[2], 'À vérifier'],
  ];
  return {
    label: `${role.label} · ${module.label}`, action: 'Ajouter un document', kpis: baseKpis(tab, rows),
    columns: ['Document', 'Référence', 'Émission', 'Expiration', 'Responsable', 'Statut'], rows,
    workflow: { label: `Workflow · ${tab}`, stages: ['Dépôt', 'Lecture', 'Contrôle', 'Validation', 'Archivage'], activeStage: 2 },
    rowActions: ['Demander validation', 'Télécharger', 'Renouveler'],
  };
}

function commerceMock(role: UniversalRoleDefinition, module: UniversalModule, tab: string, context: RoleContext): OrganizerModuleMock {
  const rows = [
    [`${tab} · Gants MMA Pro`, 'GMMA-PRO-12', '42 000 Ar', '84', context.references[0], 'Actif'],
    [`${tab} · Rashguard Indesy`, 'RG-IM-08', '68 000 Ar', '26', context.references[1], 'Actif'],
    [`${tab} · Billet Premium`, 'TKT-PREM-03', '120 000 Ar', '12', context.references[2], 'Stock faible'],
    [`${tab} · Pack Fight Week`, 'PACK-FW-26', '184 000 Ar', '38', context.events[0], 'En promotion'],
  ];
  return {
    label: `${role.label} · ${module.label}`, action: 'Ajouter un élément', kpis: [
      { label: 'Ventes', value: '8,4 M Ar', detail: 'période sélectionnée', tone: 'green' },
      { label: 'Commandes', value: '184', detail: '24 à traiter', tone: 'blue' },
      { label: 'Stock disponible', value: '1 248', detail: 'toutes références', tone: 'blue' },
      { label: 'Alertes', value: '12', detail: 'stock ou livraison', tone: 'red' },
    ],
    columns: [tab, 'Référence', 'Valeur', 'Quantité', 'Source', 'Statut'], rows,
    workflow: { label: `Workflow · ${tab}`, stages: ['Création', 'Validation', 'Paiement', 'Préparation', 'Livraison'], activeStage: 2 },
    rowActions: ['Valider', 'Préparer', 'Marquer livré'],
  };
}

function securityMock(role: UniversalRoleDefinition, module: UniversalModule, tab: string, context: RoleContext): OrganizerModuleMock {
  const rows = [
    [`${tab} · contrôle prioritaire`, context.references[0], context.people[0], 'Haute', '11 août 2026 · 08:42', 'En cours'],
    [`${tab} · revue périodique`, context.references[1], context.people[1], 'Normale', '10 août 2026 · 16:18', 'Validé'],
    [`${tab} · anomalie détectée`, context.references[2], context.people[2], 'Critique', '09 août 2026 · 19:04', 'À traiter'],
  ];
  return {
    label: `${role.label} · ${module.label}`, action: 'Créer un contrôle', kpis: baseKpis(tab, rows),
    columns: ['Contrôle / Incident', 'Référence', 'Responsable', 'Priorité', 'Dernière activité', 'Statut'], rows,
    workflow: { label: `Workflow · ${tab}`, stages: ['Détection', 'Qualification', 'Affectation', 'Résolution', 'Audit'], activeStage: 2 },
    rowActions: ['Affecter', 'Résoudre', 'Escalader'],
  };
}

function performanceMock(role: UniversalRoleDefinition, module: UniversalModule, tab: string, context: RoleContext): OrganizerModuleMock {
  const rows = [
    [`${tab} · indicateur principal`, context.people[0], '84 %', '90 %', '+6 %', 'En progression'],
    [`${tab} · qualité`, context.organization, '92 %', '95 %', '+3 %', 'Conforme'],
    [`${tab} · délai moyen`, context.events[0], '18 h', '12 h', '-6 h', 'À améliorer'],
    [`${tab} · engagement`, context.places[0], '76 %', '80 %', '+4 %', 'En progression'],
  ];
  return {
    label: `${role.label} · ${module.label}`, action: tab.includes('Rapport') ? 'Générer un rapport' : 'Ajouter une mesure', kpis: baseKpis(tab, rows),
    columns: ['Indicateur', 'Périmètre', 'Actuel', 'Objectif', 'Écart', 'Statut'], rows,
    workflow: { label: `Workflow · ${tab}`, stages: ['Collecte', 'Contrôle', 'Analyse', 'Décision', 'Rapport'], activeStage: 2 },
    rowActions: ['Mettre à jour', 'Créer un objectif', 'Exporter'],
    progress: rows.map((row) => ({ label: row[0], value: Number(row[2].replace(/D/g, '')) || 72, detail: `Objectif : ${row[3]}` })),
  };
}

function communicationMock(role: UniversalRoleDefinition, module: UniversalModule, tab: string, context: RoleContext): OrganizerModuleMock {
  const rows = [
    [`${tab} · ${context.events[0]}`, context.people[0], 'Équipe principale', '11 août 2026 · 09:12', 'Publié'],
    [`${tab} · rappel opérationnel`, context.people[1], context.organization, '10 août 2026 · 17:40', 'Envoyé'],
    [`${tab} · document de travail`, context.people[2], context.places[0], '09 août 2026 · 14:06', 'Brouillon'],
  ];
  return {
    label: `${role.label} · ${module.label}`, action: 'Créer une communication', kpis: baseKpis(tab, rows),
    columns: ['Sujet / Contenu', 'Auteur', 'Audience', 'Date et heure', 'Statut'], rows,
    workflow: { label: `Workflow · ${tab}`, stages: ['Rédaction', 'Ciblage', 'Validation', 'Diffusion', 'Mesure'], activeStage: 2 },
    rowActions: ['Publier', 'Envoyer', 'Dupliquer'],
  };
}

export function getUniversalModuleMock(role: UniversalRoleDefinition, module: UniversalModule, tab: string): OrganizerModuleMock {
  const context = contexts[role.id];
  const key = normalize(`${module.id} ${module.label} ${tab}`);
  if (/finance|budget|paiement|transaction|revenu|depense|cotisation|indemnite|factur|commission|versement|honoraire/.test(key)) return financeMock(role, module, tab, context);
  if (/membre|utilisateur|combattant|coach|arbitre|juge|client|staff|equipe|profil|role|acces|licencie|athlete|dirigeant/.test(key)) return peopleMock(role, module, tab, context);
  if (/evenement|competition|calendrier|planning|designation|combat|fight|activation|inscription|deplacement|live/.test(key)) return eventMock(role, module, tab, context);
  if (/document|licence|certif|reglement|circulaire|archive|preuve|pv|rapport|conformite|assurance/.test(key)) return documentMock(role, module, tab, context);
  if (/catalog|produit|commande|stock|livraison|marketplace|billet|promotion|offre|favori/.test(key)) return commerceMock(role, module, tab, context);
  if (/securite|incident|moderation|audit|permission|politique|session|service|sante systeme|environnement|suspension|litige/.test(key)) return securityMock(role, module, tab, context);
  if (/performance|analytics|statistique|evaluation|classement|resultat|progression|audience|visibilite|engagement|roi|adoption|usage|fiabilite|precision|coherence/.test(key)) return performanceMock(role, module, tab, context);
  if (/communication|message|actualite|contenu|media|video|interview|discussion|notification|annonce|convocation/.test(key)) return communicationMock(role, module, tab, context);
  if (/training|entrainement|formation|programme|seance|camp|sport|discipline|categorie|medical|poids|blessure|recuperation|scoring/.test(key)) return performanceMock(role, module, tab, context);
  if (/contrat|partenaire|sponsor|portfolio|organisation|club|federation|ligue|affiliation/.test(key)) return peopleMock(role, module, tab, context);
  return securityMock(role, module, tab, context);
}
