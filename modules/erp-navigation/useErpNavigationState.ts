"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  createErpNavigationStorageKey,
  normalizeErpNavigationState,
  readErpNavigationState,
  writeErpNavigationState,
} from "./erp-navigation.storage";

import type {
  ErpNavigationModule,
  ErpNavigationState,
  UseErpNavigationStateOptions,
  UseErpNavigationStateResult,
} from "./types";

function sameNavigationState<TModuleId extends string>(
  left: ErpNavigationState<TModuleId>,
  right: ErpNavigationState<TModuleId>,
) {
  return (
    left.moduleId === right.moduleId &&
    left.activeTab === right.activeTab
  );
}

export function useErpNavigationState<
  TModuleId extends string,
>({
  workspace,
  modules,
  defaultModuleId,
  initialModuleId,
  initialTab,
  storageVersion = 1,
  storageKey: explicitStorageKey,
  legacyStorageKeys,
}: UseErpNavigationStateOptions<TModuleId>): UseErpNavigationStateResult<TModuleId> {
  const storageKey = useMemo(
    () =>
      explicitStorageKey ??
      createErpNavigationStorageKey(
        workspace,
        storageVersion,
      ),
    [
      explicitStorageKey,
      storageVersion,
      workspace,
    ],
  );

  /*
   * Les tableaux reçus dans les options peuvent être créés inline par
   * le composant appelant. Leur identité JavaScript change alors à chaque
   * rendu, même si leur contenu reste identique.
   *
   * On transforme donc la configuration utile en signatures stables puis
   * on reconstruit des descripteurs stables. Cela empêche l'effet de
   * restauration de se relancer indéfiniment sur une simple nouvelle
   * référence de tableau.
   */
  const modulesSignature = JSON.stringify(
    modules.map((module) => ({
      id: module.id,
      tabs: [...module.tabs],
      defaultTabId: module.defaultTabId,
    })),
  );

  const stableModules = useMemo(
    () =>
      JSON.parse(
        modulesSignature,
      ) as ErpNavigationModule<TModuleId>[],
    [modulesSignature],
  );

  const legacyStorageKeysSignature =
    JSON.stringify(legacyStorageKeys ?? []);

  const stableLegacyStorageKeys = useMemo(
    () =>
      JSON.parse(
        legacyStorageKeysSignature,
      ) as string[],
    [legacyStorageKeysSignature],
  );

  const fallbackState = useMemo(
    () =>
      normalizeErpNavigationState(
        stableModules,
        defaultModuleId,
        initialModuleId ?? defaultModuleId,
        initialTab,
      ),
    [
      defaultModuleId,
      initialModuleId,
      initialTab,
      stableModules,
    ],
  );

  const [navigation, setNavigation] =
    useState<ErpNavigationState<TModuleId>>(
      fallbackState,
    );

  const restorationScope = useMemo(
    () =>
      [
        storageKey,
        initialModuleId ?? "",
        initialTab ?? "",
        modulesSignature,
        legacyStorageKeysSignature,
      ].join("::"),
    [
      initialModuleId,
      initialTab,
      legacyStorageKeysSignature,
      modulesSignature,
      storageKey,
    ],
  );

  const [restoredScope, setRestoredScope] =
    useState<string | null>(null);

  useEffect(() => {
    /*
     * Une restauration ne doit être exécutée qu'une seule fois pour une
     * configuration logique donnée. Ce garde évite toute boucle de mises
     * à jour, y compris si le parent recrée ses tableaux d'options.
     */
    if (restoredScope === restorationScope) {
      return;
    }

    let nextState: ErpNavigationState<TModuleId>;

    if (initialModuleId !== undefined) {
      nextState = normalizeErpNavigationState(
        stableModules,
        defaultModuleId,
        initialModuleId,
        initialTab,
      );
    } else {
      const stored = readErpNavigationState({
        storageKey,
        legacyStorageKeys: stableLegacyStorageKeys,
        modules: stableModules,
        fallbackModuleId: defaultModuleId,
      });

      nextState =
        stored?.state ??
        normalizeErpNavigationState(
          stableModules,
          defaultModuleId,
          defaultModuleId,
          initialTab,
        );

      if (
        stored &&
        stored.sourceKey !== storageKey
      ) {
        writeErpNavigationState(
          storageKey,
          nextState,
        );
      }
    }

    setNavigation((current) =>
      sameNavigationState(current, nextState)
        ? current
        : nextState,
    );

    setRestoredScope(restorationScope);
  }, [
    defaultModuleId,
    initialModuleId,
    initialTab,
    restorationScope,
    restoredScope,
    stableLegacyStorageKeys,
    stableModules,
    storageKey,
  ]);

  const navigationRestored =
    restoredScope === restorationScope;

  useEffect(() => {
    if (!navigationRestored) {
      return;
    }

    writeErpNavigationState(
      storageKey,
      navigation,
    );
  }, [
    navigation,
    navigationRestored,
    storageKey,
  ]);

  const selectModule = useCallback(
    (
      nextModuleId: TModuleId,
      requestedTab?: string,
    ) => {
      const nextState =
        normalizeErpNavigationState(
          stableModules,
          defaultModuleId,
          nextModuleId,
          requestedTab,
        );

      setNavigation((current) =>
        sameNavigationState(current, nextState)
          ? current
          : nextState,
      );
    },
    [defaultModuleId, stableModules],
  );

  const setActiveTab = useCallback(
    (requestedTab: string) => {
      setNavigation((current) => {
        const nextState =
          normalizeErpNavigationState(
            stableModules,
            defaultModuleId,
            current.moduleId,
            requestedTab,
          );

        return sameNavigationState(
          current,
          nextState,
        )
          ? current
          : nextState;
      });
    },
    [defaultModuleId, stableModules],
  );

  return {
    moduleId: navigation.moduleId,
    activeTab: navigation.activeTab,
    navigationRestored,
    selectModule,
    setActiveTab,
  };
}
