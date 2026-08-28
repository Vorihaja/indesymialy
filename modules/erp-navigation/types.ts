export type ErpNavigationModule<TModuleId extends string = string> = {
  id: TModuleId;
  tabs: readonly string[];
};

export type ErpNavigationState<TModuleId extends string = string> = {
  moduleId: TModuleId;
  activeTab: string;
};

export type ErpNavigationStorageReadResult<
  TModuleId extends string = string,
> = {
  state: ErpNavigationState<TModuleId>;
  sourceKey: string;
};

export type UseErpNavigationStateOptions<
  TModuleId extends string = string,
> = {
  workspace: string;
  modules: readonly ErpNavigationModule<TModuleId>[];
  defaultModuleId: TModuleId;
  initialModuleId?: TModuleId;
  initialTab?: string;
  storageVersion?: number;
  storageKey?: string;
  legacyStorageKeys?: readonly string[];
};

export type UseErpNavigationStateResult<
  TModuleId extends string = string,
> = {
  moduleId: TModuleId;
  activeTab: string;
  navigationRestored: boolean;
  selectModule: (moduleId: TModuleId, tab?: string) => void;
  setActiveTab: (tab: string) => void;
};
