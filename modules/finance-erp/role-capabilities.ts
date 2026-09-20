import type { FinanceTab } from './types';
import {
  resolveCanonicalErpRole,
  resolveErpModuleEntry,
} from '@/modules/erp-dispatch-registry';

export interface FinanceRoleCapabilities {
  normalizedRole: string;
  coreTabs: readonly FinanceTab[];
  allowedTabs: readonly FinanceTab[];
  canCreateManualOperation: boolean;
  canManageCategories: boolean;
  consumerMode: boolean;
}

const professionalCoreTabs = [
  'overview',
  'transactions',
  'income',
  'expenses',
  'categories',
] as const satisfies readonly FinanceTab[];

const consumerCoreTabs = [
  'overview',
  'transactions',
] as const satisfies readonly FinanceTab[];

const roleAliases: Record<string, string> = {
  fighter: 'combattant',
  organizer: 'organisateur',
  official: 'officiel',
  referee: 'arbitre',
  seller: 'vendeur',
  league: 'ligue',
};

const canonicalRoleAliases: Record<string, string> = {
  combattant: 'fighter',
  organisateur: 'organizer',
  officiel: 'official',
  arbitre: 'official',
  juge: 'official',
  vendeur: 'seller',
  ligue: 'league',
};

const roleDomainTabs: Record<
  string,
  readonly FinanceTab[]
> = {
  vendeur: [
    'seller-summary',
    'seller-revenue',
    'seller-transactions',
    'seller-commissions',
    'seller-settlements',
  ],
  sponsor: [
    'sponsor-budget',
  ],
  federation: [
    'federation-reports',
  ],
  ligue: [
    'league-reports',
  ],
};

const professionalRoles = new Set([
  'combattant',
  'coach',
  'officiel',
  'arbitre',
  'juge',
  'club',
  'organisateur',
  'sponsor',
  'vendeur',
  'federation',
  'ligue',
  'admin',
  'super-admin',
]);

export function normalizeFinanceRole(
  role: string,
): string {
  const normalized = role
    .trim()
    .toLowerCase();

  return roleAliases[normalized] ?? normalized;
}

export function getFinanceRoleCapabilities(
  role: string,
): FinanceRoleCapabilities {
  const normalizedRole =
    normalizeFinanceRole(role);

  const registryRole =
    canonicalRoleAliases[normalizedRole] ?? normalizedRole;
  const canonicalRole = resolveCanonicalErpRole(registryRole);
  const registryEntry = canonicalRole
    ? resolveErpModuleEntry(canonicalRole, 'finance')
    : null;
  const canCreate = registryEntry?.capabilities.create === true;
  const canManage =
    canCreate ||
    registryEntry?.capabilities.update === true ||
    registryEntry?.capabilities.delete === true;

  if (normalizedRole === 'fan') {
    return {
      normalizedRole,
      coreTabs: consumerCoreTabs,
      allowedTabs: consumerCoreTabs,
      canCreateManualOperation: canCreate,
      canManageCategories: canManage,
      consumerMode: true,
    };
  }

  const isProfessional =
    professionalRoles.has(
      normalizedRole,
    );

  const coreTabs =
    isProfessional
      ? professionalCoreTabs
      : consumerCoreTabs;

  const domainTabs =
    roleDomainTabs[normalizedRole] ?? [];

  return {
    normalizedRole,
    coreTabs,
    allowedTabs: [
      ...coreTabs,
      ...domainTabs,
    ],
    canCreateManualOperation: canCreate,
    canManageCategories: canManage,
    consumerMode: false,
  };
}

export function isFinanceTabAllowed(
  role: string,
  tab: FinanceTab,
): boolean {
  return getFinanceRoleCapabilities(
    role,
  ).allowedTabs.includes(tab);
}
