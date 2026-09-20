import {
  resolveCanonicalErpRole,
  resolveErpModuleEntry,
} from '@/modules/erp-dispatch-registry';
import type { ErpCanonicalRole } from '@/modules/erp-dispatch-registry';
import type {
  FinanceOwner,
  FinanceOwnerContext,
  FinanceScope,
} from './types';

const ROLE_ALIASES: Readonly<Record<string, ErpCanonicalRole>> = {
  combattant: 'fighter',
  organisateur: 'organizer',
  officiel: 'official',
  arbitre: 'official',
  juge: 'official',
  vendeur: 'seller',
  ligue: 'league',
};

function canonicalFinanceRole(role: string): ErpCanonicalRole {
  const normalized = role.trim().toLowerCase();
  const canonical =
    ROLE_ALIASES[normalized] ?? resolveCanonicalErpRole(normalized);

  if (!canonical) {
    throw new Error(`Role Finance non reconnu: ${role}`);
  }

  return canonical;
}

export function resolveFinanceExpectedScope(role: string): FinanceScope {
  const canonicalRole = canonicalFinanceRole(role);
  const entry = resolveErpModuleEntry(canonicalRole, 'finance');

  if (
    !entry ||
    entry.implementationStatus !== 'implemented' ||
    entry.handlerKey !== 'finance-erp'
  ) {
    throw new Error(
      `Handler Finance indisponible pour le role ${canonicalRole}.`,
    );
  }

  if (
    entry.scope !== 'platform' &&
    entry.scope !== 'organization' &&
    entry.scope !== 'event' &&
    entry.scope !== 'personal'
  ) {
    throw new Error(
      `Scope Finance invalide pour le role ${canonicalRole}: ${entry.scope}.`,
    );
  }

  return entry.scope;
}

export function ownerContextKey(
  owner: FinanceOwnerContext,
): string {
  return `${owner.scope}:${owner.ownerId ?? 'platform'}`;
}

export function resolveFinanceOwnersForRole(
  role: string,
  authorizedOwners: readonly FinanceOwner[],
): FinanceOwner[] {
  const expectedScope = resolveFinanceExpectedScope(role);
  return authorizedOwners.filter((owner) => owner.scope === expectedScope);
}

export function resolveInitialFinanceOwner(
  role: string,
  authorizedOwners: readonly FinanceOwner[],
): FinanceOwner | null {
  return resolveFinanceOwnersForRole(role, authorizedOwners)[0] ?? null;
}

export function resolveSelectedFinanceOwner(
  role: string,
  authorizedOwners: readonly FinanceOwner[],
  requestedKey: string,
): FinanceOwner | null {
  return resolveFinanceOwnersForRole(role, authorizedOwners).find(
    (owner) => ownerContextKey(owner) === requestedKey,
  ) ?? null;
}
