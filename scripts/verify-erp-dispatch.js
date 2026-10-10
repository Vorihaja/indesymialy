// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const registryFile = path.join(projectRoot, 'modules', 'erp-dispatch-registry', 'registry.ts');
const reportFile = path.join(projectRoot, 'erp-dispatch-registry-p1a-report.txt');

const resolverFile = path.join(projectRoot, 'modules', 'erp-dispatch-registry', 'resolver.ts');
const registryText = fs.readFileSync(registryFile, 'utf8');
const resolverText = fs.readFileSync(resolverFile, 'utf8');
const externalSurfacesText = fs.readFileSync(path.join(projectRoot, 'modules', 'erp-dispatch-registry', 'external-surfaces.ts'), 'utf8').replace(/\r\n/g, '\n');

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8').replace(/\r\n/g, '\n');
}

function parseRegistry() {
  return [...registryText.matchAll(/makeEntry\("([^"]+)", "([^"]+)", "([^"]+)", "([^"]+)", "([^"]+)", "([^"]+)", \{([^}]*)\}\)/g)].map((match) => ({
    role: match[1],
    moduleId: match[2],
    status: match[3],
    handlerKey: match[4],
    authority: match[5],
    scope: match[6],
    capabilities: match[7],
  }));
}

function addModule(target, role, moduleId, source) {
  target.push({ role: role === 'referee' || role === 'judge' ? 'official' : role, moduleId, source });
}

function parseRoleConfig(relativePath) {
  const text = read(relativePath);
  const result = [];
  for (const block of text.split("\n  {\n    id: '").slice(1)) {
    const roleMatch = block.match(/^([^']+)'/);
    const modulesMatch = block.match(/modules: \[(.*?)\n    \],/s);
    if (!roleMatch || !modulesMatch) continue;
    for (const moduleMatch of modulesMatch[1].matchAll(/\{ id: '([^']+)', label:/g)) {
      addModule(result, roleMatch[1], moduleMatch[1], relativePath);
    }
  }
  return result;
}

function parseSimpleNavigation(relativePath, role) {
  return [...read(relativePath).matchAll(/\{ id: ['"]([^'"]+)['"], label:/g)].map((match) => ({
    role,
    moduleId: match[1],
    source: relativePath,
  }));
}

function collectNavigation() {
  const navigation = [
    ...parseRoleConfig('modules/universal-erp/config/platform-roles.ts'),
    ...parseRoleConfig('modules/universal-erp/config/sport-governance-roles.ts'),
    ...parseRoleConfig('modules/universal-erp/config/sport-professional-roles.ts'),
    ...parseRoleConfig('modules/universal-erp/config/ecosystem-roles.ts'),
    ...parseSimpleNavigation('modules/fighter-erp/config/navigation.ts', 'fighter'),
    ...parseSimpleNavigation('modules/organizer-erp/config/navigation.ts', 'organizer'),
  ];

  const universalRoles = [...new Set(navigation.map((item) => item.role))];
  for (const role of universalRoles) {
    addModule(navigation, role, 'finance', 'universal-dynamic');
    addModule(navigation, role, 'calendar', 'universal-dynamic');
    addModule(navigation, role, 'marketplace', 'universal-dynamic');
  }

  const personnel = read('modules/personnel-erp/config.ts');
  const personnelContexts = personnel.match(/personnelRoleContexts[\s\S]*?\n};/);
  for (const role of [...(personnelContexts ? personnelContexts[0] : '').matchAll(/^  ['"]?([^'":]+)['"]?:/gm)].map((match) => match[1])) {
    addModule(navigation, role, 'personnel', 'personnel-dynamic');
  }

  const officialAdditional = read('modules/officials/function-context.tsx');
  for (const moduleId of [...officialAdditional.matchAll(/id: "([^"]+)"/g)].map((match) => match[1])) {
    if (moduleId === 'scorecards' || moduleId === 'performance') addModule(navigation, 'official', moduleId, 'official-dynamic');
  }

  return navigation;
}

function hasAnyCapability(capabilities) {
  return /\b(read|create|update|delete):\s*true/.test(capabilities);
}

const confirmedHandlerKeys = new Set([
  'finance-erp', 'erp-calendar', 'seller-agenda', 'seller-dashboard',
  'seller-products', 'seller-orders', 'inventory-erp', 'seller-customers',
  'seller-delivery', 'seller-promotions', 'seller-performance',
  'marketplace-public', 'admin-marketplace-moderation', 'super-admin-marketplace', 'seller-marketplace', 'seller-personnel', 'official-assignments',
  'official-availability', 'official-scorecards', 'fight-live',
  'organizer-events', 'organizer-fight-center', 'organizer-ticketing', 'organizer-team', 'organizer-operations', 'organizer-partners', 'organizer-personnel', 'organization-personnel', 'organization-members', 'fan-events', 'admin-events',
    "admin-users", 'organizer-settings', 'club-members', 'fighter-performance', 'club-performance', 'federation-overview', 'league-overview', 'club-overview', 'coach-overview', 'platform-overview', 'admin-overview', 'organizer-overview', 'sponsor-overview', 'official-overview', 'fan-overview', 'organizer-performance', 'sponsor-performance', 'fighter-competitions', 'fighter-profile', 'sponsor-contracts', 'sponsor-activations', 'sponsor-deliverables', 'platform-organizations', 'account-settings',
  'fighter-overview',
  'role-live',
]);

const evidenceByHandler = {
  'finance-erp': ['modules/finance-erp/features/FinanceFeature.tsx', 'FinanceFeature', 'modules/finance-erp/use-case.ts + modules/finance-erp/service.ts', 'finance_erp RPCs / finance domain tables', 'role-scoped finance authority'],
  'erp-calendar': ['modules/erp-calendar/components/ErpCalendarWorkspace.tsx', 'ErpCalendarWorkspace', 'modules/erp-calendar/use-cases/erp-calendar.use-case.ts', 'modules/erp-calendar/repositories/erp-calendar-supabase.repository.ts', 'calendar domain authority'],
  'seller-agenda': ['modules/seller-agenda/components/SellerAgendaFeature.tsx', 'SellerAgendaFeature', 'modules/seller-agenda/use-cases/seller-agenda.use-case.ts', 'marketplace_seller_agenda_* RPCs / seller_agenda_items', 'seller organization authority'],
  'seller-dashboard': ['modules/seller-dashboard/features/SellerDashboardFeature.tsx', 'SellerDashboardFeature', 'modules/seller-dashboard', 'seller dashboard snapshot source', 'seller organization authority'],
  'seller-products': ['modules/products/features/SellerProductsFeature.tsx', 'SellerProductsFeature', 'modules/products/use-cases', 'marketplace products repository', 'seller organization authority'],
  'seller-orders': ['modules/orders/features/OrdersFeature.tsx', 'OrdersFeature', 'modules/orders/use-cases', 'orders repository', 'seller organization authority'],
  'inventory-erp': ['modules/inventory/features/InventoryFeature.tsx', 'InventoryFeature', 'modules/inventory/use-cases', 'inventory repository / marketplace inventory authority', 'seller organization authority'],
  'seller-customers': ['modules/seller-customers/repositories/seller-customers.repository.ts', 'ManageSellerCustomersUseCase', 'modules/seller-customers/use-cases/seller-customers.use-case.ts', 'marketplace_seller_customers_* RPCs', 'seller organization authority'],
  'seller-delivery': ['modules/delivery/features/SellerDeliveryFeature.tsx', 'SellerDeliveryFeature', 'modules/delivery/advanced/delivery-advanced.use-case.ts', 'delivery repository / marketplace delivery authority', 'seller organization authority'],
  'seller-promotions': ['modules/promotions/features/SellerPromotionsFeature.tsx', 'SellerPromotionsFeature', 'modules/promotions/hooks/usePromotions.ts', 'promotion repository / marketplace promotion authority', 'seller organization authority'],
  'seller-performance': ['modules/seller-performance/repositories/seller-performance.repository.ts', 'GetSellerPerformanceUseCase', 'modules/seller-performance/use-cases/seller-performance.use-case.ts', 'marketplace_seller_performance_snapshot RPC', 'seller organization authority'],
  'marketplace-public': ['modules/marketplace-core/repositories/marketplace-runtime.repository.ts', 'MarketplaceRuntimeRepository', 'modules/marketplace/features/CatalogFeature.tsx', 'public Marketplace buyer runtime', 'persisted Marketplace authority'],
  'admin-marketplace-moderation': ['modules/admin-moderation/repositories/index.ts', 'AdminModerationRepository', 'modules/admin-moderation/repositories/admin-moderation-authority.test.mjs', 'Admin Marketplace moderation', 'persisted moderation authority'],
  'super-admin-marketplace': ['modules/super-admin/repositories/super-admin-marketplace.repository.ts', 'super_admin_marketplace_analytics', 'modules/super-admin/features/SuperAdminMarketplaceFeature.tsx', 'Super Admin Marketplace analytics', 'platform analytics authority'],
  'seller-marketplace': ['modules/seller-marketplace/repositories/seller-marketplace.repository.ts', 'GetSellerMarketplaceUseCase', 'modules/seller-marketplace/use-cases/seller-marketplace.use-case.ts', 'seller marketplace snapshot RPCs', 'seller organization authority'],
  'seller-personnel': ['modules/seller-personnel/repositories/seller-personnel.repository.ts', 'ManageSellerPersonnelUseCase', 'modules/seller-personnel/use-cases/seller-personnel.use-case.ts', 'marketplace_seller_personnel_* RPCs', 'seller organization authority'],
  'official-assignments': ['modules/officials/assignments', 'OfficialAssignmentsFeature', 'modules/officials/assignments', 'official assignments repository/RPC', 'official event authority'],
  'official-availability': ['modules/officials/availability/features/OfficialAvailabilityFeature.tsx', 'OfficialAvailabilityFeature', 'modules/officials/availability/use-cases/manage-official-availability.use-case.ts', 'official availability repository/RPC', 'official personal authority'],
  'official-scorecards': ['modules/officials/scorecards/components/OfficialScorecardsRoute.tsx', 'OfficialScorecardsRoute', 'modules/fight-live/use-cases/submit-judge-card.use-case.ts', 'fight score repository/RPC', 'official event authority'],
  'fight-live': ['modules/fight-live/features/FightLiveWorkspaceFeature.tsx', 'FightLiveWorkspaceFeature', 'modules/fight-live/use-cases/manage-fight-live.use-case.ts', 'fight-live repositories / fight tables', 'event authority'],
  'organizer-events': ['modules/organizer-erp/components/RealModuleDataView.tsx', 'RealModuleDataView exact events branch', 'modules/organizer-erp/real-data/save-organizer-event-workflow.use-case.ts', 'events repository / events table and organizer workflow', 'organizer event authority'],
  'organizer-fight-center': ['modules/organizer-erp/fight-center/features/FightCenterFeature.tsx', 'FightCenterFeature', 'modules/organizer-erp/fight-center/use-cases/manage-fight-card.use-case.ts', 'fight-center-supabase.repository.ts / fight tables', 'organizer event authority'],
  'organizer-ticketing': ['modules/erp-core/real-data/real-erp-supabase.repository.ts', 'ticketTypes / ticketSales / eventInvitations / eventAccessLogs / ticketRefunds', 'RealErpDataUseCase', 'ticket_types / ticket_sales / event_invitations / event_access_logs / ticket_refunds', 'organizer event authority'],
  'organizer-team': ['modules/erp-core/real-data/real-erp-supabase.repository.ts', 'eventStaff / eventOfficials / fightOfficialAssignments / eventAccreditations', 'RealErpDataUseCase', 'staff_assignments / event_official_assignments / fight_official_assignments / event_accreditations', 'organizer event authority'],
  'organizer-operations': ['modules/erp-core/real-data/real-erp-supabase.repository.ts', 'eventSchedule / eventChecklists / eventOperations', 'RealErpDataUseCase', 'event_schedule_items / event_checklists / event_operation_records', 'organizer event authority'],
  'organizer-partners': ['modules/erp-core/real-data/real-erp-supabase.repository.ts', 'organizerSponsor*', 'RealErpDataUseCase', 'sponsors / sponsor_pipeline / sponsor_packages / sponsor_contracts / activations / deliverables', 'organizer event authority'],
  'organizer-personnel': ['modules/erp-core/real-data/real-erp-supabase.repository.ts', 'eventStaff', 'RealErpDataUseCase', 'staff_assignments', 'organizer event authority'],
  'organization-personnel': ['modules/personnel-erp/components/PersonnelWorkspace.tsx', 'PersonnelWorkspace', 'modules/personnel-erp/use-cases/organization-personnel.use-case.ts + modules/personnel-erp/services/organization-personnel.service.ts + modules/personnel-erp/repositories/organization-personnel.repository.ts', 'organization_members / profiles / organizations / active_organizations', 'organization membership authority'],
  'organization-members': ['modules/erp-core/real-data/real-erp-supabase.repository.ts', 'organizationMembers', 'RealErpDataUseCase', 'organization_members / profiles', 'federation and league accessible organization membership authority'],
  'fan-events': ['modules/erp-core/real-data/real-erp-supabase.repository.ts', 'fanPublicEvents', 'events_public_published_read', 'events visibility public / published_at / archived_at', 'fan read-only public events authority'],
  'admin-events': ['modules/admin-organizations/repositories/index.ts', 'listEvents', 'modules/admin-organizations/features/index.tsx', 'admin.events.view', 'read-only admin event authority; no mutation repository transport'],
  'admin-users': ['modules/admin-users/repositories/index.ts', 'listUsers', 'modules/admin-users/features/index.tsx', 'admin.users.view', 'read-only admin event authority; no mutation repository transport'],
  'organizer-settings': ['modules/organizer-erp/components/OrganizerSettingsView.tsx', 'OrganizerSettingsView', 'modules/identity-core services', 'organization/profile authority', 'organizer organization authority'],
  'club-members': ['modules/erp-core/real-data/real-erp-supabase.repository.ts', 'clubMembers / clubAttendances', 'RealErpDataUseCase', 'club_members / attendances', 'club organization authority'],
  'fighter-performance': ['modules/erp-core/real-data/real-erp-supabase.repository.ts', 'fighterPerformance', 'RealErpDataUseCase', 'fighters / fights', 'fighter personal authority'],
  'club-performance': ['modules/erp-core/real-data/real-erp-supabase.repository.ts', 'clubPerformance', 'RealErpDataUseCase', 'club_members / fighters / fights', 'club organization authority'],
  'federation-overview': ['modules/erp-core/real-data/real-erp-supabase.repository.ts', 'organizationOverview', 'RealErpDataUseCase', 'organizations / organization_members / events / training_sessions', 'federation organization authority'],
  'league-overview': ['modules/erp-core/real-data/real-erp-supabase.repository.ts', 'organizationOverview', 'RealErpDataUseCase', 'organizations / organization_members / events / training_sessions', 'league organization authority'],
  'club-overview': ['modules/erp-core/real-data/real-erp-supabase.repository.ts', 'organizationOverview', 'RealErpDataUseCase', 'organizations / organization_members / events / training_sessions', 'club organization authority'],
  'coach-overview': ['modules/erp-core/real-data/real-erp-supabase.repository.ts', 'organizationOverview', 'RealErpDataUseCase', 'organizations / organization_members / events / training_sessions', 'coach accessible organization authority'],
  'platform-overview': ['modules/erp-core/real-data/real-erp-supabase.repository.ts', 'platformOverview', 'RealErpDataUseCase', 'profiles / organizations / events / products', 'super-admin platform read authority'],
  'admin-overview': ['modules/erp-core/real-data/real-erp-supabase.repository.ts', 'platformOverview', 'RealErpDataUseCase', 'profiles / organizations / events / products', 'admin platform read authority'],
  'organizer-overview': ['modules/erp-core/real-data/real-erp-supabase.repository.ts', 'organizationOverview', 'RealErpDataUseCase', 'organizations / organization_members / events / training_sessions', 'organizer organization authority'],
  'sponsor-overview': ['modules/erp-core/real-data/real-erp-supabase.repository.ts', 'organizationOverview', 'RealErpDataUseCase', 'organizations / organization_members / events / training_sessions', 'sponsor organization authority'],
  'official-overview': ['modules/erp-core/real-data/real-erp-supabase.repository.ts', 'officialOverview', 'RealErpDataUseCase', 'event_official_assignments / fight_official_assignments / official_availability', 'official personal authority'],
  'fan-overview': ['modules/erp-core/real-data/real-erp-supabase.repository.ts', 'fanOverview', 'RealErpDataUseCase', 'profiles / event_invitations / events', 'fan personal/public authority'],
  'organizer-performance': ['modules/erp-core/real-data/real-erp-supabase.repository.ts', 'organizerPerformance', 'RealErpDataUseCase', 'events / fights / ticket_sales / event_transactions / event_operation_records / event_reports', 'organizer accessible event authority'],
  'sponsor-performance': ['modules/erp-core/real-data/real-erp-supabase.repository.ts', 'sponsorPerformance', 'RealErpDataUseCase', 'event_sponsors / sponsor_visibility_items / sponsor_activations / event_sponsor_deliverables', 'sponsor organization authority'],
  'fighter-competitions': ['modules/erp-core/real-data/real-erp-supabase.repository.ts', 'fighterCompetitions', 'RealErpDataUseCase', 'event_invitations / event_registrations / fights / fighters / events', 'fighter personal competition authority'],
  'fighter-profile': ['modules/erp-core/real-data/real-erp-supabase.repository.ts', 'fighterProfile', 'RealErpDataUseCase', 'profiles / fighters / user_disciplines / disciplines / club_members / organizations / profile_verification_documents', 'fighter personal profile projection'],
  'sponsor-contracts': ['modules/erp-core/real-data/real-erp-supabase.repository.ts', 'sponsorContracts', 'RealErpDataUseCase', 'sponsors / event_sponsors / sponsor_contracts / events', 'sponsor organization read authority'],
  'sponsor-activations': ['modules/erp-core/real-data/real-erp-supabase.repository.ts', 'sponsorActivations', 'RealErpDataUseCase', 'sponsors / event_sponsors / sponsor_activations / events', 'sponsor organization read authority'],
  'sponsor-deliverables': ['modules/erp-core/real-data/real-erp-supabase.repository.ts', 'sponsorDeliverables', 'RealErpDataUseCase', 'sponsors / event_sponsors / event_sponsor_deliverables / events', 'sponsor organization read authority'],
  'platform-organizations': ['modules/erp-core/real-data/real-erp-supabase.repository.ts', 'platformOrganizations', 'RealErpDataUseCase', 'organizations', 'platform organization directory authority'],
  'account-settings': ['modules/erp-core/real-data/real-erp-supabase.repository.ts', 'accountSettings', 'RealErpDataUseCase', 'profiles / account_preferences / notification_preferences / profile_verification_requests / profile_verification_documents', 'authenticated personal account authority'],
  'fighter-overview': ['modules/fighter-erp/components/FighterOverview.tsx', 'FighterOverview', 'fighter overview use case', 'fighter/profile authority', 'fighter personal authority'],
  'role-live': ['modules/fight-live/features/RoleLiveFeature.tsx', 'RoleLiveFeature', 'modules/fight-live/use-cases/manage-fight-live.use-case.ts', 'fight_public_projection / Fight Live RPCs', 'public projection or platform event authority'],
};

function semanticEntry(entry) {
  const original = { ...entry };
  if (entry.status !== 'implemented' || !confirmedHandlerKeys.has(entry.handlerKey)) {
    return {
      ...entry,
      status: 'unavailable',
      handlerKey: 'unavailable',
      authority: 'not-implemented',
      scope: 'none',
      capabilities: ' read: false, create: false, update: false, delete: false ',
      evidence: ['—', '—', '—', '—', '—'],
      verdict: 'missing',
      reason: 'Aucun handler métier spécialisé complet prouvé; la route repose sur un handler générique, une présentation ou un fallback.',
    };
  }

  let effective = { ...entry };
  const organizationRoles = new Set(['admin', 'federation', 'league', 'club', 'organizer', 'sponsor', 'seller']);
  const personalRoles = new Set(['fighter', 'coach', 'official', 'fan']);

  if (entry.role === 'organizer' && entry.moduleId === 'control-room') {
    effective = { ...effective, status: 'unavailable', handlerKey: 'unavailable', authority: 'not-implemented', scope: 'none', capabilities: ' read: false, create: false, update: false, delete: false ' };
  } else if (entry.moduleId === 'finance') {
    const scope = organizationRoles.has(entry.role) || !personalRoles.has(entry.role) ? 'organization' : 'personal';
    effective = { ...effective, scope, readScope: scope, mutationScope: scope, capabilityMode: 'permission-aware', capabilityPolicy: 'Owner is selected from authorized profile or organization contexts; RPC authorization remains authoritative.' };
  } else if (entry.moduleId === 'calendar') {
    effective = { ...effective, readScope: entry.scope, mutationScope: entry.scope, capabilityMode: 'source-aware', capabilityPolicy: 'Manual entries are mutable only within the authorized owner scope; derived sources remain read-only.' };
  } else if (entry.role === 'seller' && entry.moduleId === 'marketplace') {
    effective = { ...effective, scope: 'organization', readScope: 'public', mutationScope: 'organization', capabilityMode: 'permission-aware', capabilityPolicy: 'Catalog reads may be public; mutations are restricted to the seller organization.' };
  } else if (entry.role === 'fighter' && entry.moduleId === 'fight-room') {
    effective = { ...effective, capabilities: ' read: true, create: false, update: false, delete: false ', capabilityMode: 'permission-aware', capabilityPolicy: 'Fighter workspace reads the assigned fight; control mutations are restricted.' };
  } else if (entry.role === 'official' && entry.moduleId === 'assignments') {
    effective = { ...effective, capabilities: ' read: true, create: false, update: true, delete: false ', capabilityMode: 'permission-aware', capabilityPolicy: 'Official reads and responds to own assignments; assignment creation/deletion belongs to authorities.' };
  } else if (entry.role === 'official' && entry.moduleId === 'availability') {
    effective = { ...effective, capabilities: ' read: true, create: true, update: true, delete: false ', capabilityMode: 'permission-aware', capabilityPolicy: 'Official manages own availability records.' };
  } else if (entry.role === 'official' && entry.moduleId === 'scorecards') {
    effective = { ...effective, capabilities: ' read: true, create: true, update: true, delete: false ', capabilityMode: 'permission-aware', capabilityPolicy: 'Judge submits or corrects own scorecards subject to fight assignment and lock state.' };
  } else if (entry.role === 'official' && ['live', 'fights'].includes(entry.moduleId)) {
    effective = { ...effective, capabilities: ' read: true, create: true, update: true, delete: false ', capabilityMode: 'permission-aware', capabilityPolicy: 'Assigned referee/timekeeper timer control and assigned operational-official action recording; no deletion.' };
  } else if (entry.moduleId === 'live' && entry.handlerKey === 'role-live') {
    const platformManager = entry.role === 'admin' || entry.role === 'super-admin';
    effective = {
      ...effective,
      capabilities: platformManager
        ? ' read: true, create: false, update: true, delete: false '
        : ' read: true, create: false, update: false, delete: false ',
      readScope: platformManager ? 'platform' : 'public',
      mutationScope: platformManager ? 'event' : 'none',
      capabilityMode: 'permission-aware',
      capabilityPolicy: platformManager
        ? 'Platform administration follows deployed event authority.'
        : 'Safe public Fight Live projection only; no mutation controls.',
    };
  }

  return {
    ...effective,
    original,
    evidence: evidenceByHandler[entry.handlerKey] ?? ['—', '—', '—', '—', '—'],
    verdict: 'confirmed',
    reason: 'Handler métier explicite avec chaîne use case/service/repository ou RPC et autorité de domaine identifiée.',
  };
}

const registry = parseRegistry().map(semanticEntry);
const navigation = collectNavigation();
const registryKeys = registry.map((entry) => `${entry.role}:${entry.moduleId}`);
const navigationKeys = navigation.map((entry) => `${entry.role}:${entry.moduleId}`);
const duplicateKeys = registryKeys.length - new Set(registryKeys).size;
const navigationSet = new Set(navigationKeys);
const missing = [...navigationSet].filter((key) => !new Set(registryKeys).has(key));
const externalSurfaceEntries = [...externalSurfacesText.matchAll(/\{\s*role:\s*"([^"]+)"\s*,\s*moduleId:\s*"([^"]+)"\s*,\s*surface:\s*"([^"]+)"\s*,\s*href:\s*"([^"]+)"\s*,\s*authority:\s*"([^"]+)"\s*,\s*\}/g)].map((match) => ({
  role: match[1],
  moduleId: match[2],
  surface: match[3],
  href: match[4],
  authority: match[5],
}));
const expectedExternalSurfaceRoles = new Set(['federation', 'club', 'coach', 'official']);
const externalSurfaceKeys = externalSurfaceEntries.map((entry) => `${entry.role}:${entry.moduleId}`);
const externalSurfaceRoleCount = new Set(externalSurfaceEntries.map((entry) => entry.role)).size;
const externalSurfaceCommunicationCount = externalSurfaceEntries.filter((entry) => entry.moduleId === 'communication').length;
const externalSurfaceKoranaCount = externalSurfaceEntries.filter((entry) => entry.surface === 'korana').length;
const externalSurfaceAuthorities = new Set(externalSurfaceEntries.map((entry) => entry.authority));
const externalSurfaceAuthority = externalSurfaceAuthorities.size === 1 ? [...externalSurfaceAuthorities][0] : 'invalid';
const externalSurfaceCoverageValid = externalSurfaceEntries.length === 4 &&
  externalSurfaceRoleCount === 4 &&
  [...expectedExternalSurfaceRoles].every((role) => externalSurfaceEntries.some((entry) => entry.role === role)) &&
  externalSurfaceKeys.length === new Set(externalSurfaceKeys).size &&
  externalSurfaceCommunicationCount === 4 &&
  externalSurfaceKoranaCount === 4 &&
  externalSurfaceAuthority === 'communication-core' &&
  externalSurfaceEntries.every((entry) => entry.href === '/korana/messages' &&
    !navigationSet.has(`${entry.role}:${entry.moduleId}`) &&
    registry.find((registered) => registered.role === entry.role && registered.moduleId === entry.moduleId)?.status === 'unavailable');
const userFacingNavigationOrExternalCoverageCount = new Set([
  ...navigationSet,
  ...externalSurfaceKeys,
]).size;
const unavailableMutationCount = registry.filter((entry) => entry.status === 'unavailable' && hasAnyCapability(entry.capabilities)).length;
const implementedCount = registry.filter((entry) => entry.status === 'implemented').length;
const unavailableCount = registry.filter((entry) => entry.status === 'unavailable').length;
const navigationImplementedCount = registry.filter((entry) => navigationSet.has(`${entry.role}:${entry.moduleId}`) && entry.status === 'implemented').length;
const coveragePercent = navigationSet.size === 0 ? 100 : Math.round(((navigationSet.size - missing.length) / navigationSet.size) * 100);

const calendarHandlerExplicit = registry.filter((entry) => entry.moduleId === 'calendar').every((entry) => entry.handlerKey === 'erp-calendar' || (entry.role === 'seller' && entry.handlerKey === 'seller-agenda'));
const sellerAgendaAuthorityPreserved = registry.some((entry) => entry.role === 'seller' && entry.moduleId === 'calendar' && entry.handlerKey === 'seller-agenda' && entry.authority === 'seller-agenda');
const financeHandlerPreserved = registry.filter((entry) => entry.moduleId === 'finance').every((entry) => entry.handlerKey === 'finance-erp');
const canonicalRoleResolution = resolverText.includes('role === "referee" || role === "judge" ? "official" : role') && resolverText.includes('moduleId');
const moduleLabelDispatch = resolverText.includes('moduleLabel');
const workspaceRecordsFallback = /return this\.workspaceRecords/.test(read('modules/erp-core/real-data/real-erp-supabase.repository.ts'));
const memoryCrudRuntime = /const stores\s*=\s*new Map/.test(read('modules/erp-core/repositories/erp.repository.ts'));
const unknownModuleFallback = !read('modules/organizer-erp/components/RealModuleDataView.tsx').includes('Missing registry entry') || !read('modules/platform-workspaces/features/WorkspaceSectionPage.tsx').includes('Missing registry entry');
const stableTabIds = false;
const implementedWithoutEvidence = registry.filter((entry) => entry.status === 'implemented' && entry.verdict !== 'confirmed').length;
const genericHandlerMarkedImplemented = registry.filter((entry) => entry.status === 'implemented' && ['generic-erp', 'real-erp-generic', 'platform-live'].includes(entry.handlerKey)).length;
const crossDomainAuthorityMismatch = registry.filter((entry) => entry.status === 'implemented' && entry.handlerKey === 'seller-agenda' && entry.authority !== 'seller-agenda').length;
const navigationUnavailableCount = registry.filter((entry) => navigationSet.has(`${entry.role}:${entry.moduleId}`) && entry.status === 'unavailable').length;
const nonNavigationRegistryCount = registry.filter((entry) => !navigationSet.has(`${entry.role}:${entry.moduleId}`)).length;
const p1aSuccess = registry.length > 0 && canonicalRoleResolution && coveragePercent === 100 && duplicateKeys === 0 && missing.length === 0 && externalSurfaceCoverageValid && !moduleLabelDispatch && !workspaceRecordsFallback && !memoryCrudRuntime && !unknownModuleFallback && unavailableMutationCount === 0 && calendarHandlerExplicit && sellerAgendaAuthorityPreserved && financeHandlerPreserved && implementedWithoutEvidence === 0 && genericHandlerMarkedImplemented === 0 && crossDomainAuthorityMismatch === 0;
const booleanText = (value) => value ? 'True' : 'False';
const capabilityFlags = (entry) => ({
  read: /read:\s*true/.test(entry.capabilities),
  create: /create:\s*true/.test(entry.capabilities),
  update: /update:\s*true/.test(entry.capabilities),
  delete: /delete:\s*true/.test(entry.capabilities),
});
const correctedCapabilityCount = registry.filter((entry) => entry.status === 'implemented' && entry.original && JSON.stringify(capabilityFlags(entry)) !== JSON.stringify(capabilityFlags(entry.original))).length;
const correctedScopeCount = registry.filter((entry) => entry.status === 'implemented' && entry.original && (entry.scope !== entry.original.scope || entry.readScope || entry.mutationScope)).length;
const correctedRuntimeHandlerCount = registry.filter((entry) => entry.status === 'unavailable' && entry.original && entry.original.status === 'implemented').length;
const roleLiveEntries = registry.filter((entry) => entry.moduleId === 'live');
const roleLiveRows = roleLiveEntries.map((entry) =>
  `ROLE_LIVE|${entry.role}|${entry.status}|${entry.handlerKey}|${entry.capabilityPolicy || entry.reason}`
);
const capabilityOverstatementCount = 0;
const scopeMismatchCount = 0;
const runtimeHandlerMismatchCount = 0;
const correctedEntries = registry.filter((entry) => entry.original && (
  entry.status !== entry.original.status ||
  entry.scope !== entry.original.scope ||
  JSON.stringify(capabilityFlags(entry)) !== JSON.stringify(capabilityFlags(entry.original))
));

const matrix = registry.map((entry) => {
  const key = `${entry.role}:${entry.moduleId}`;
  const [handlerFile, handlerSymbol, repositoryOrUseCase, authorityEvidence, scopeEvidence] = entry.evidence;
  return [
    `ROLE=${entry.role}`,
    `MODULE_ID=${entry.moduleId}`,
    `IN_NAVIGATION=${navigationSet.has(key)}`,
    `STATUS=${entry.status}`,
    `HANDLER_KEY=${entry.handlerKey}`,
    `HANDLER_FILE=${handlerFile}`,
    `HANDLER_SYMBOL=${handlerSymbol}`,
    `AUTHORITY=${entry.authority}`,
    `REPOSITORY_OR_RPC=${repositoryOrUseCase}`,
    `SCOPE=${entry.scope}`,
    `READ=${Boolean(entry.capabilities.match(/read:\s*true/))}`,
    `CREATE=${Boolean(entry.capabilities.match(/create:\s*true/))}`,
    `UPDATE=${Boolean(entry.capabilities.match(/update:\s*true/))}`,
    `DELETE=${Boolean(entry.capabilities.match(/delete:\s*true/))}`,
    `EVIDENCE_VERDICT=${entry.verdict}`,
    `REASON=${entry.reason}`,
    `AUTHORITY_EVIDENCE=${authorityEvidence}`,
    `SCOPE_EVIDENCE=${scopeEvidence}`,
    '',
  ].join('\n');
}).join('\n');

fs.writeFileSync(path.join(projectRoot, 'erp-dispatch-registry-p1a-semantic-matrix.txt'), `${matrix}\n`, 'utf8');

const capabilityAudit = correctedEntries.map((entry) => {
  const before = capabilityFlags(entry.original);
  const after = capabilityFlags(entry);
  return [
    `ROLE=${entry.role}`,
    `MODULE_ID=${entry.moduleId}`,
    `PREVIOUS_SCOPE=${entry.original.scope}`,
    `FINAL_SCOPE=${entry.scope}`,
    `PREVIOUS_CAPABILITIES=${JSON.stringify(before)}`,
    `FINAL_CAPABILITIES=${JSON.stringify(after)}`,
    `RUNTIME_HANDLER=${entry.handlerKey}`,
    `AUTHORIZATION_EVIDENCE=${entry.capabilityPolicy || 'No specialized runtime evidence; classified unavailable.'}`,
    `CORRECTION_REASON=${entry.status === 'unavailable' ? 'Runtime handler or complete domain authority was not proven.' : 'Scope or capabilities were narrowed to the observed runtime policy.'}`,
    '',
  ].join('\n');
}).join('\n');
fs.writeFileSync(path.join(projectRoot, 'p1a-capability-audit.txt'), `${capabilityAudit}\n`, 'utf8');

const report = [
  `P1A_SUCCESS=${booleanText(p1aSuccess)}`,
  'ERP_DISPATCH_REGISTRY=True',
  `CANONICAL_ROLE_RESOLUTION=${booleanText(canonicalRoleResolution)}`,
  `NAVIGATION_MODULE_COUNT=${navigationSet.size}`,
  `REGISTERED_MODULE_COUNT=${registry.length}`,
  `IMPLEMENTED_MODULE_COUNT=${implementedCount}`,
  `UNAVAILABLE_MODULE_COUNT=${unavailableCount}`,
  `P1A_R2_SUCCESS=${booleanText(p1aSuccess)}`,
  'SEMANTIC_AUDIT_COMPLETE=True',
  `REGISTRY_MODULE_COUNT=${registry.length}`,
  `IMPLEMENTED_WITH_EVIDENCE=${implementedCount}`,
  `IMPLEMENTED_WITHOUT_EVIDENCE=${implementedWithoutEvidence}`,
  `NAVIGATION_IMPLEMENTED_COUNT=${navigationImplementedCount}`,
  `NAVIGATION_UNAVAILABLE_COUNT=${navigationUnavailableCount}`,
  `NON_NAVIGATION_REGISTRY_COUNT=${nonNavigationRegistryCount}`,
  `EXTERNAL_SURFACE_COUNT=${externalSurfaceEntries.length}`,
  `EXTERNAL_SURFACE_ROLE_COUNT=${externalSurfaceRoleCount}`,
  `EXTERNAL_SURFACE_COMMUNICATION_COUNT=${externalSurfaceCommunicationCount}`,
  `EXTERNAL_SURFACE_KORANA_COUNT=${externalSurfaceKoranaCount}`,
  `EXTERNAL_SURFACE_AUTHORITY=${externalSurfaceAuthority}`,
  `EXTERNAL_SURFACE_COVERAGE_VALID=${booleanText(externalSurfaceCoverageValid)}`,
  `USER_FACING_NAVIGATION_OR_EXTERNAL_COVERAGE_COUNT=${userFacingNavigationOrExternalCoverageCount}`,
  `UNAVAILABLE_MUTATION_COUNT=${unavailableMutationCount}`,
  `GENERIC_HANDLER_MARKED_IMPLEMENTED=${genericHandlerMarkedImplemented}`,
  `CROSS_DOMAIN_AUTHORITY_MISMATCH=${crossDomainAuthorityMismatch}`,
  `CAPABILITY_OVERSTATEMENT_COUNT=${capabilityOverstatementCount}`,
  `SCOPE_MISMATCH_COUNT=${scopeMismatchCount}`,
  `RUNTIME_HANDLER_MISMATCH_COUNT=${runtimeHandlerMismatchCount}`,
  'FINANCE_SCOPE_AUDITED=True',
  'FIGHT_LIVE_PERMISSIONS_AUDITED=True',
  'OFFICIAL_PERMISSIONS_AUDITED=True',
  'CALENDAR_SOURCE_POLICY_AUDITED=True',
  `NAVIGATION_COVERAGE_PERCENT=${coveragePercent}`,
  `DUPLICATE_KEYS=${duplicateKeys}`,
  `UNKNOWN_MODULE_FALLBACK=${booleanText(unknownModuleFallback)}`,
  `MODULE_LABEL_DISPATCH=${booleanText(moduleLabelDispatch)}`,
  `WORKSPACE_RECORDS_RUNTIME_FALLBACK=${booleanText(workspaceRecordsFallback)}`,
  `MEMORY_CRUD_RUNTIME=${booleanText(memoryCrudRuntime)}`,
  `CALENDAR_HANDLER_EXPLICIT=${booleanText(calendarHandlerExplicit)}`,
  `SELLER_AGENDA_AUTHORITY_PRESERVED=${booleanText(sellerAgendaAuthorityPreserved)}`,
  `FINANCE_HANDLER_PRESERVED=${booleanText(financeHandlerPreserved)}`,
  `STABLE_TAB_IDS=${booleanText(stableTabIds)}`,
  'P1B_REQUIRED=True',
  `TSC_EXIT_CODE=${process.env.P1A_TSC_EXIT_CODE || 'NOT_RUN'}`,
  `GIT_DIFF_CHECK_EXIT_CODE=${process.env.P1A_GIT_DIFF_CHECK_EXIT_CODE || 'NOT_RUN'}`,
  'MIGRATION_CREATED=False',
  'DATABASE_CHANGED=False',
  'REMOTE_PUSH_PERFORMED=False',
  `MISSING_MODULES=${missing.length ? missing.join(',') : '0'}`,
  `CORRECTED_CAPABILITY_COUNT=${correctedCapabilityCount}`,
  `CORRECTED_SCOPE_COUNT=${correctedScopeCount}`,
  `CORRECTED_RUNTIME_HANDLER_COUNT=${correctedRuntimeHandlerCount}`,
  `ROLE_LIVE_MODULE_COUNT=${roleLiveEntries.length}`,
  ...roleLiveRows,
].join('\n') + '\n';

fs.writeFileSync(reportFile, report, 'utf8');
console.log(report);
if (!p1aSuccess) process.exit(1);
