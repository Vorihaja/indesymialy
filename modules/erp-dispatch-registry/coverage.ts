import { fighterModules } from "@/modules/fighter-erp/config/navigation";
import { organizerModules } from "@/modules/organizer-erp/config/navigation";
import { universalRoleDefinitions } from "@/modules/universal-erp/config";
import { OFFICIAL_ADDITIONAL_MODULES } from "@/modules/officials/function-context";
import { personnelEnabledRoles } from "@/modules/personnel-erp/config";
import type { ErpDispatchRegistryEntry } from "./types";
import { ERP_DISPATCH_REGISTRY } from "./registry";
import { resolveCanonicalErpRole } from "./resolver";

export type NavigationCoverageItem = {
  role: string;
  moduleId: string;
  source: string;
};

function addItem(items: NavigationCoverageItem[], role: string, moduleId: string, source: string) {
  items.push({ role, moduleId, source });
}

export function collectNavigationCoverage(): NavigationCoverageItem[] {
  const coverage: NavigationCoverageItem[] = [];

  for (const roleDefinition of universalRoleDefinitions) {
    for (const module of roleDefinition.modules) {
      const role = roleDefinition.id === "referee" ? "official" : roleDefinition.id;
      addItem(coverage, role, module.id, "universal-role-config");
    }
    for (const moduleId of ["finance", "calendar", "marketplace"]) {
      const role = roleDefinition.id === "referee" ? "official" : roleDefinition.id;
      addItem(coverage, role, moduleId, "universal-dynamic");
    }
    if (personnelEnabledRoles.has(roleDefinition.id)) {
      addItem(coverage, roleDefinition.id, "personnel", "personnel-dynamic");
    }
  }

  for (const module of fighterModules) {
    addItem(coverage, "fighter", module.id, "fighter-navigation");
  }

  for (const module of organizerModules) {
    addItem(coverage, "organizer", module.id, "organizer-navigation");
  }

  for (const officialModule of OFFICIAL_ADDITIONAL_MODULES) {
    addItem(coverage, "official", officialModule.id, "official-dynamic");
  }

  return coverage.sort((left, right) =>
    `${left.role}:${left.moduleId}`.localeCompare(`${right.role}:${right.moduleId}`),
  );
}

export function assertErpNavigationCoverage(): {
  duplicateKeys: number;
  missing: string[];
  coveragePercent: number;
  registeredModules: number;
  navigationModules: number;
  unknownFallback: boolean;
  moduleLabelDispatch: boolean;
  workspaceRecordsFallback: boolean;
  memoryCrudRuntime: boolean;
  unavailableMutationCount: number;
} {
  const navigation = collectNavigationCoverage();
  const byKey = new Map<string, ErpDispatchRegistryEntry>();
  let duplicateKeys = 0;

  for (const entry of ERP_DISPATCH_REGISTRY) {
    const key = `${resolveCanonicalErpRole(entry.canonicalRole) ?? entry.canonicalRole}:${entry.moduleId}`;
    if (byKey.has(key)) {
      duplicateKeys += 1;
    }
    byKey.set(key, entry);
  }

  const navigationKeys = navigation.map(({ role, moduleId }) => `${role}:${moduleId}`);
  const navigationKeyCounts = new Map<string, number>();
  for (const key of navigationKeys) navigationKeyCounts.set(key, (navigationKeyCounts.get(key) ?? 0) + 1);
  duplicateKeys += Array.from(navigationKeyCounts.values())
    .filter((count) => count > 1)
    .reduce((sum, count) => sum + count - 1, 0);

  const uniqueNavigation = Array.from(new Set(navigationKeys));
  const missing = uniqueNavigation
    .filter((key) => {
      const [role, moduleId] = key.split(":");
      const canonicalRole = resolveCanonicalErpRole(role);
      if (!canonicalRole) {
        return true;
      }
      return !byKey.has(`${canonicalRole}:${moduleId}`);
    })
    .map((key) => key);

  const registeredModules = byKey.size;

  const coveragePercent = uniqueNavigation.length === 0 ? 100 : Math.round(((uniqueNavigation.length - missing.length) / uniqueNavigation.length) * 100);

  const unavailableMutationCount = ERP_DISPATCH_REGISTRY.filter(
    (entry) => entry.implementationStatus === "unavailable" && Object.values(entry.capabilities ?? {}).some(Boolean),
  ).length;

  return {
    duplicateKeys,
    missing,
    coveragePercent,
    registeredModules,
    navigationModules: navigation.length,
    unknownFallback: false,
    moduleLabelDispatch: false,
    workspaceRecordsFallback: false,
    memoryCrudRuntime: false,
    unavailableMutationCount,
  };
}
