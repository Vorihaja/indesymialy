import type { AdminAnalyticsSnapshot, AdminAuditEntry, AdminDashboardSnapshot, AdminDomain, AdminDomainData, AdminHealthCheck, AdminModerationRecord, AdminOrganizationRecord, AdminPermissionRecord, AdminReportRecord, AdminRoleRecord, AdminRoleRequest, AdminSettingRecord, AdminSportRecord, AdminUserRecord, ModerationDecision, RecordStatus } from "../types";

const now = "2026-08-04T09:00:00.000Z";
const users: AdminUserRecord[] = [
  { id: "usr-001", name: "Mialy Rakoto", email: "mialy@example.com", status: "active", businessRoles: ["fighter"], systemRoles: [], organizations: ["Club Antananarivo"], publishedContent: 12, linkedReports: 0, createdAt: now, history: ["Profil vérifié"] },
  { id: "usr-002", name: "Admin Opérations", email: "admin@example.com", status: "active", businessRoles: [], systemRoles: ["admin"], organizations: [], publishedContent: 0, linkedReports: 1, createdAt: now, history: ["Rôle admin attribué"] },
  { id: "usr-003", name: "Vendeur Demo", email: "seller@example.com", status: "pending", businessRoles: ["seller"], systemRoles: [], organizations: ["Indesy Shop"], publishedContent: 3, linkedReports: 2, createdAt: now, history: ["Vérification en attente"] },
];
const roles: AdminRoleRecord[] = [
  { id: "role-fighter", label: "Combattant", kind: "business", status: "active", permissions: ["fighter.read", "fighter.update"] },
  { id: "role-admin", label: "Admin", kind: "system", status: "active", permissions: ["admin.operations", "moderation.manage", "analytics.read"] },
  { id: "role-super", label: "Super Admin", kind: "system", status: "active", permissions: ["system.roles", "system.settings", "system.health", "audit.read"] },
];
const roleRequests: AdminRoleRequest[] = [{ id: "rr-001", userName: "Vendeur Demo", requestedRole: "seller", status: "pending", requestedAt: now, decisions: [] }];
const permissions: AdminPermissionRecord[] = [
  { id: "p-001", code: "moderation.manage", description: "Décider sur les signalements", roles: ["admin", "super_admin"] },
  { id: "p-002", code: "system.settings", description: "Modifier les paramètres critiques", roles: ["super_admin"] },
  { id: "p-003", code: "analytics.read", description: "Consulter les analytics", roles: ["admin", "super_admin"] },
];
const organizations: AdminOrganizationRecord[] = [
  { id: "org-001", name: "Fédération Nationale", kind: "organization", owner: "Comité national", members: 42, status: "active", integrityAlerts: [] },
  { id: "club-001", name: "Club Antananarivo", kind: "club", owner: "Coach Rakoto", members: 28, status: "active", organizationId: "org-001", integrityAlerts: [] },
  { id: "club-002", name: "Club sans rattachement", kind: "club", owner: "À confirmer", members: 6, status: "pending", integrityAlerts: ["organization_id manquant"] },
];
const sports: AdminSportRecord[] = [
  { id: "fighter-001", name: "Mialy Rakoto", kind: "fighter", region: "Analamanga", discipline: "MMA", status: "active", verified: true, recentActivity: "Licence renouvelée", reports: 0 },
  { id: "event-001", name: "Indesy Championship", kind: "event", region: "Analamanga", discipline: "Kickboxing", status: "pending", verified: false, recentActivity: "Dossier soumis", reports: 1 },
];
const moderation: AdminModerationRecord[] = [
  { id: "mod-001", source: "social", targetType: "post", targetLabel: "Publication #184", reason: "Contenu trompeur", author: "Utilisateur 48", status: "open", createdAt: now, history: [] },
  { id: "mod-002", source: "marketplace", targetType: "product", targetLabel: "Gants Pro", reason: "Annonce potentiellement frauduleuse", author: "Vendeur Demo", status: "reviewing", createdAt: now, history: ["Analyse commencée"] },
  { id: "mod-003", source: "marketplace", targetType: "order", targetLabel: "Commande #104", reason: "Commande litigieuse", author: "Client 22", status: "open", createdAt: now, history: [] },
];
const reports: AdminReportRecord[] = moderation.map((item) => ({ id: `report-${item.id}`, category: item.reason, source: item.source, reporter: item.author, target: item.targetLabel, priority: item.status === "reviewing" ? "high" : "medium", status: item.status === "resolved" ? "closed" : item.status, createdAt: item.createdAt }));
const settings: AdminSettingRecord[] = [
  { id: "identity-name", group: "identity", label: "Nom de la plateforme", value: "Indesy Mialy", critical: false },
  { id: "maintenance", group: "maintenance", label: "Mode maintenance", value: false, critical: true },
  { id: "registrations", group: "registrations", label: "Inscriptions ouvertes", value: true, critical: false },
  { id: "auto-moderation", group: "moderation", label: "Modération automatique", value: false, critical: false },
  { id: "marketplace-enabled", group: "marketplace", label: "Marketplace activée", value: true, critical: false },
  { id: "notification-retention", group: "notifications", label: "Rétention notifications (jours)", value: 90, critical: false },
  { id: "upload-limit", group: "limits", label: "Limite média (Mo)", value: 20, critical: false },
  { id: "locale", group: "regional", label: "Locale", value: "fr-MG", critical: false },
  { id: "mfa-admin", group: "security", label: "MFA administrateur", value: true, critical: true },
  { id: "feature-social", group: "features", label: "Réseau social", value: true, critical: false },
];
const audit: AdminAuditEntry[] = [{ id: "audit-001", actor: "Admin Opérations", action: "role_request.review", target: "rr-001", occurredAt: now, before: "pending", after: "pending", reason: "Contrôle documentaire", status: "success", metadata: { channel: "admin" } }];
const health: AdminHealthCheck[] = [
  { id: "h-ts", area: "typescript", label: "TypeScript", status: "healthy", detail: "Dernière validation réussie", checkedAt: now },
  { id: "h-build", area: "build", label: "Build", status: "healthy", detail: "Build de production disponible", checkedAt: now },
  { id: "h-lint", area: "lint", label: "Lint", status: "warning", detail: "Dette globale hors mission", checkedAt: now },
  { id: "h-routes", area: "routes", label: "Routes Admin", status: "healthy", detail: "Inventaire chargé", checkedAt: now },
  { id: "h-db", area: "supabase", label: "Base de données", status: "unknown", detail: "Contrôle runtime requis", checkedAt: now },
  { id: "h-store", area: "storage", label: "Stockage provisoire", status: "warning", detail: "Repositories mémoire actifs", checkedAt: now },
  { id: "h-integrations", area: "integrations", label: "Intégrations", status: "warning", detail: "Paiement et alerting à connecter", checkedAt: now },
];

export class AdminMemoryRepository {
  async getDashboard(): Promise<AdminDashboardSnapshot> { return { metrics: [
    ["users", "Utilisateurs", 1284, 8], ["active", "Utilisateurs actifs", 936, 5], ["clubs", "Clubs", 84, 3], ["fighters", "Combattants", 642, 12], ["events", "Événements", 38, 4], ["posts", "Publications", 2750, 15], ["products", "Produits", 214, 9], ["orders", "Commandes", 376, 11], ["reports", "Signalements ouverts", 3, -2], ["roles", "Demandes de rôles", 1, 0],
  ].map(([id, label, value, trend]) => ({ id: String(id), label: String(label), value: Number(value), trend: Number(trend), detail: "Évolution sur 30 jours" })), trends: [{ label: "Mai", value: 62 }, { label: "Juin", value: 78 }, { label: "Juillet", value: 91 }, { label: "Août", value: 104 }], alerts: [{ id: "a-1", severity: "warning", title: "Repositories provisoires", detail: "Plusieurs domaines attendent leurs tables dédiées." }], quickActions: [{ label: "Traiter les signalements", href: "/dashboard/admin/moderation" }, { label: "Valider les rôles", href: "/dashboard/admin/role-requests" }, { label: "Voir la santé", href: "/dashboard/super-admin/platform-health" }] }; }
  async listUsers(): Promise<AdminUserRecord[]> { return structuredClone(users); }
  async updateUserStatus(id: string, status: RecordStatus): Promise<AdminUserRecord | null> { const item = users.find((user) => user.id === id); if (!item) return null; item.status = status; item.history.unshift(`Statut modifié en ${status}`); return structuredClone(item); }
  async listRoles(): Promise<AdminRoleRecord[]> { return structuredClone(roles); }
  async listRoleRequests(): Promise<AdminRoleRequest[]> { return structuredClone(roleRequests); }
  async decideRoleRequest(id: string, decision: "approved" | "refused" | "suspended"): Promise<AdminRoleRequest | null> { const item = roleRequests.find((request) => request.id === id); if (!item) return null; item.status = decision; item.decisions.unshift(`${decision} — ${now}`); return structuredClone(item); }
  async listPermissions(): Promise<AdminPermissionRecord[]> { return structuredClone(permissions); }
  async listOrganizations(kind?: "organization" | "club"): Promise<AdminOrganizationRecord[]> { return structuredClone(kind ? organizations.filter((item) => item.kind === kind) : organizations); }
  async updateOrganizationStatus(id: string, status: RecordStatus): Promise<AdminOrganizationRecord | null> { const item = organizations.find((entry) => entry.id === id); if (!item) return null; item.status = status; return structuredClone(item); }
  async listSports(kind: "fighter" | "event"): Promise<AdminSportRecord[]> { return structuredClone(sports.filter((item) => item.kind === kind)); }
  async updateSportStatus(id: string, status: RecordStatus, verified?: boolean): Promise<AdminSportRecord | null> { const item = sports.find((entry) => entry.id === id); if (!item) return null; item.status = status; if (verified !== undefined) item.verified = verified; return structuredClone(item); }
  async listModeration(source?: "social" | "marketplace"): Promise<AdminModerationRecord[]> { return structuredClone(source ? moderation.filter((item) => item.source === source) : moderation); }
  async decideModeration(id: string, decision: ModerationDecision): Promise<AdminModerationRecord | null> { const item = moderation.find((entry) => entry.id === id); if (!item) return null; item.status = "resolved"; item.history.unshift(`${decision} — ${now}`); return structuredClone(item); }
  async listReports(): Promise<AdminReportRecord[]> { return structuredClone(reports); }
  async getAnalytics(): Promise<AdminAnalyticsSnapshot> { const dashboard = await this.getDashboard(); return { metrics: dashboard.metrics, series: ["Croissance utilisateurs", "Activité par rôle", "Activité par région", "Activité par discipline", "Création de clubs", "Inscriptions combattants", "Événements", "Engagement social", "Volume Marketplace", "Signalements", "Modération", "Revenus préparés"].map((label, index) => ({ id: `series-${index}`, label, dimension: index < 4 ? (["time", "role", "region", "discipline"] as const)[index] : "time", points: dashboard.trends.map((point) => ({ ...point, value: point.value + index * 3 })) })) }; }
  async listSettings(): Promise<AdminSettingRecord[]> { return structuredClone(settings); }
  async updateSetting(id: string, value: string | boolean | number): Promise<AdminSettingRecord | null> { const item = settings.find((entry) => entry.id === id); if (!item) return null; item.value = value; return structuredClone(item); }
  async listAudit(): Promise<AdminAuditEntry[]> { return structuredClone(audit); }
  async listHealth(): Promise<AdminHealthCheck[]> { return structuredClone(health); }
  async getDomain(domain: AdminDomain): Promise<AdminDomainData> { return buildDomainData(this, domain); }
}

async function buildDomainData(repository: AdminMemoryRepository, domain: AdminDomain): Promise<AdminDomainData> {
  if (domain === "users") return { title: "Utilisateurs et profils", description: "Statuts, rôles, organisations, contenus et signalements liés.", metrics: [], columns: ["Utilisateur", "E-mail", "Rôles", "Statut"], rows: (await repository.listUsers()).map((item) => ({ id: item.id, cells: [item.name, item.email, [...item.businessRoles, ...item.systemRoles].join(", ") || "Aucun", item.status], status: item.status })), actions: ["Activer", "Suspendre", "Bloquer"] };
  if (domain === "roles") return { title: "Rôles", description: "Rôles métier et système issus du contrôle d’accès existant.", metrics: [], columns: ["Rôle", "Type", "Permissions", "Statut"], rows: (await repository.listRoles()).map((item) => ({ id: item.id, cells: [item.label, item.kind, item.permissions.join(", "), item.status], status: item.status })), actions: ["Suspendre"] };
  if (domain === "role-requests") return { title: "Demandes de rôles", description: "Validation, refus, suspension et historique des décisions.", metrics: [], columns: ["Utilisateur", "Rôle", "Date", "Statut"], rows: (await repository.listRoleRequests()).map((item) => ({ id: item.id, cells: [item.userName, item.requestedRole, item.requestedAt, item.status], status: item.status })), actions: ["Valider", "Refuser", "Suspendre"] };
  if (domain === "permissions") return { title: "Matrice rôles / permissions", description: "Vue consolidée du RBAC existant.", metrics: [], columns: ["Permission", "Description", "Rôles"], rows: (await repository.listPermissions()).map((item) => ({ id: item.id, cells: [item.code, item.description, item.roles.join(", ")] })), actions: ["Consulter"] };
  if (domain === "organizations" || domain === "clubs") { const kind = domain === "clubs" ? "club" : "organization"; return { title: domain === "clubs" ? "Clubs" : "Organisations", description: "Propriétaires, membres, validation et alertes d’intégrité.", metrics: [], columns: ["Nom", "Propriétaire", "Membres", "Statut", "Alertes"], rows: (await repository.listOrganizations(kind)).map((item) => ({ id: item.id, cells: [item.name, item.owner, String(item.members), item.status, item.integrityAlerts.join(", ") || "Aucune"], status: item.status })), actions: ["Valider", "Suspendre"] }; }
  if (domain === "fighters" || domain === "events") { const kind = domain === "fighters" ? "fighter" : "event"; return { title: domain === "fighters" ? "Combattants" : "Événements", description: "Recherche globale, vérification, suspension et activité récente.", metrics: [], columns: ["Nom", "Région", "Discipline", "Vérifié", "Statut"], rows: (await repository.listSports(kind)).map((item) => ({ id: item.id, cells: [item.name, item.region, item.discipline, item.verified ? "Oui" : "Non", item.status], status: item.status })), actions: ["Vérifier", "Suspendre", "Signaler"] }; }
  if (domain === "moderation" || domain === "social" || domain === "marketplace") { const source = domain === "social" ? "social" : domain === "marketplace" ? "marketplace" : undefined; return { title: domain === "social" ? "Modération sociale" : domain === "marketplace" ? "Modération Marketplace" : "File de modération", description: "Décisions, restauration, suspension et historique.", metrics: [], columns: ["Cible", "Type", "Motif", "Auteur", "Statut"], rows: (await repository.listModeration(source)).map((item) => ({ id: item.id, cells: [item.targetLabel, item.targetType, item.reason, item.author, item.status], status: item.status })), actions: ["Avertir", "Masquer", "Supprimer", "Restaurer", "Suspendre l’auteur"] }; }
  if (domain === "reports") return { title: "Signalements", description: "Recherche et filtres sur tous les signalements.", metrics: [], columns: ["Catégorie", "Source", "Cible", "Priorité", "Statut"], rows: (await repository.listReports()).map((item) => ({ id: item.id, cells: [item.category, item.source, item.target, item.priority, item.status], status: item.status })), actions: ["Examiner"] };
  if (domain === "audit-log") return { title: "Journal d’activité", description: "Acteur, action, cible, avant/après, motif et métadonnées.", metrics: [], columns: ["Acteur", "Action", "Cible", "Date", "Statut"], rows: (await repository.listAudit()).map((item) => ({ id: item.id, cells: [item.actor, item.action, item.target, item.occurredAt, item.status], status: item.status })), actions: ["Détail"] };
  if (domain === "platform-health") return { title: "Santé de la plateforme", description: "Build, qualité, modules, routes, données, dette et intégrations.", metrics: [], columns: ["Zone", "État", "Détail", "Contrôle"], rows: (await repository.listHealth()).map((item) => ({ id: item.id, cells: [item.label, item.status, item.detail, item.checkedAt], status: item.status })), actions: ["Rafraîchir"] };
  if (domain === "settings") return { title: "Paramètres", description: "Identité, maintenance, limites, sécurité et feature flags.", metrics: [], columns: ["Groupe", "Paramètre", "Valeur", "Critique"], rows: (await repository.listSettings()).map((item) => ({ id: item.id, cells: [item.group, item.label, String(item.value), item.critical ? "Oui" : "Non"] })), actions: ["Modifier"] };
  if (domain === "analytics") { const data = await repository.getAnalytics(); return { title: "Analytics", description: "Tendances temporelles et activité multidimensionnelle.", metrics: data.metrics, columns: ["Vue", "Dimension", "Dernier point"], rows: data.series.map((item) => ({ id: item.id, cells: [item.label, item.dimension, String(item.points.at(-1)?.value ?? 0)] })), actions: ["Filtrer", "Exporter"] }; }
  const snapshot = await repository.getDashboard(); return { title: "Centre de pilotage", description: "Vue globale de la plateforme et actions rapides.", metrics: snapshot.metrics, columns: ["Alerte", "Niveau", "Détail"], rows: snapshot.alerts.map((item) => ({ id: item.id, cells: [item.title, item.severity, item.detail], status: item.severity })), actions: snapshot.quickActions.map((item) => item.label) };
}
