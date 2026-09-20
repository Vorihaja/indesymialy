export type ErpTabDefinition = {
  id: string;
  label: string;
  legacyIds?: readonly string[];
};

export function defineErpTabs<const T extends readonly ErpTabDefinition[]>(
  tabs: T,
): T {
  return tabs;
}

export function resolveErpTabId(
  tabs: readonly ErpTabDefinition[],
  requestedTab?: string | null,
): string {
  if (!requestedTab) return tabs[0]?.id ?? "";

  const direct = tabs.find((tab) => tab.id === requestedTab);
  if (direct) return direct.id;

  const alias = tabs.find((tab) => tab.legacyIds?.includes(requestedTab));
  return alias?.id ?? tabs[0]?.id ?? "";
}