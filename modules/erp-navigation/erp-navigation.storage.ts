import type {
  ErpNavigationModule,
  ErpNavigationState,
  ErpNavigationStorageReadResult,
} from "./types";

export function createErpNavigationStorageKey(
  workspace: string,
  version = 1,
) {
  return `indesy:erp:${workspace}:navigation:v${version}`;
}

export function getErpNavigationModule<
  TModuleId extends string,
>(
  modules: readonly ErpNavigationModule<TModuleId>[],
  moduleId: TModuleId,
  fallbackModuleId: TModuleId,
) {
  const requested = modules.find(
    (module) => module.id === moduleId,
  );

  if (requested) {
    return requested;
  }

  const fallback = modules.find(
    (module) => module.id === fallbackModuleId,
  );

  if (fallback) {
    return fallback;
  }

  const first = modules[0];

  if (!first) {
    throw new Error(
      "La navigation ERP nécessite au moins un module.",
    );
  }

  return first;
}

export function getValidErpNavigationTab<
  TModuleId extends string,
>(
  modules: readonly ErpNavigationModule<TModuleId>[],
  moduleId: TModuleId,
  fallbackModuleId: TModuleId,
  requestedTab?: string | null,
) {
  const module = getErpNavigationModule(
    modules,
    moduleId,
    fallbackModuleId,
  );

  if (
    requestedTab &&
    module.tabs.includes(requestedTab)
  ) {
    return requestedTab;
  }

  return module.tabs[0] ?? "";
}

export function normalizeErpNavigationState<
  TModuleId extends string,
>(
  modules: readonly ErpNavigationModule<TModuleId>[],
  fallbackModuleId: TModuleId,
  moduleId: TModuleId,
  requestedTab?: string | null,
): ErpNavigationState<TModuleId> {
  const module = getErpNavigationModule(
    modules,
    moduleId,
    fallbackModuleId,
  );

  return {
    moduleId: module.id,
    activeTab: getValidErpNavigationTab(
      modules,
      module.id,
      fallbackModuleId,
      requestedTab,
    ),
  };
}

function isKnownModuleId<TModuleId extends string>(
  modules: readonly ErpNavigationModule<TModuleId>[],
  value: unknown,
): value is TModuleId {
  return (
    typeof value === "string" &&
    modules.some((module) => module.id === value)
  );
}

export function readErpNavigationState<
  TModuleId extends string,
>({
  storageKey,
  legacyStorageKeys = [],
  modules,
  fallbackModuleId,
}: {
  storageKey: string;
  legacyStorageKeys?: readonly string[];
  modules: readonly ErpNavigationModule<TModuleId>[];
  fallbackModuleId: TModuleId;
}): ErpNavigationStorageReadResult<TModuleId> | null {
  if (typeof window === "undefined") {
    return null;
  }

  const keys = [
    storageKey,
    ...legacyStorageKeys.filter(
      (key) => key !== storageKey,
    ),
  ];

  for (const key of keys) {
    try {
      const raw = window.localStorage.getItem(key);

      if (!raw) {
        continue;
      }

      const parsed = JSON.parse(raw) as {
        moduleId?: unknown;
        activeTab?: unknown;
      };

      if (!isKnownModuleId(modules, parsed.moduleId)) {
        continue;
      }

      const requestedTab =
        typeof parsed.activeTab === "string"
          ? parsed.activeTab
          : null;

      return {
        sourceKey: key,
        state: normalizeErpNavigationState(
          modules,
          fallbackModuleId,
          parsed.moduleId,
          requestedTab,
        ),
      };
    } catch {
      // Une valeur locale invalide ne doit jamais bloquer l'ERP.
    }
  }

  return null;
}

export function writeErpNavigationState<
  TModuleId extends string,
>(
  storageKey: string,
  state: ErpNavigationState<TModuleId>,
) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify(state),
    );
  } catch {
    // L'ERP doit rester utilisable même si localStorage est indisponible.
  }
}
