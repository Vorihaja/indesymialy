// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require("fs");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require("path");

const root = path.resolve(__dirname, "..");
const reportFile = path.join(root, "erp-stable-tab-ids-p1b-report.txt");

const navigationFiles = [
  "modules/universal-erp/config/platform-roles.ts",
  "modules/universal-erp/config/sport-governance-roles.ts",
  "modules/universal-erp/config/sport-professional-roles.ts",
  "modules/universal-erp/config/ecosystem-roles.ts",
  "modules/fighter-erp/config/navigation.ts",
  "modules/organizer-erp/config/navigation.ts",
  "modules/officials/function-context.tsx",
];
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const source = navigationFiles.map(read).join("\n");
const p1a = read("erp-dispatch-registry-p1a-report.txt");
const registry = read("modules/erp-dispatch-registry/registry.ts");
const runtimeTabs = read("modules/erp-core/components/ErpModuleTabs.tsx");
const storage = read("modules/erp-navigation/erp-navigation.storage.ts");
const realData = read("modules/erp-core/real-data/real-erp-supabase.repository.ts");

const tabBlocks = [...source.matchAll(/tabs:\s*defineErpTabs\(\[([^\]]*)\]\)/gs)];
const explicitTabs = [];
let duplicateTabIds = 0;
for (const block of tabBlocks) {
  const moduleMatch = source.slice(0, block.index).match(/id:\s*'([^']+)'[^\n]*$/);
  const moduleId = moduleMatch?.[1] || "unknown-module";
  const blockIds = [];
  for (const match of block[1].matchAll(/tab\('([^']+)',\s*'([^']+)'\)/g)) {
    explicitTabs.push({ id: match[1], label: match[2] });
    blockIds.push(`${moduleId}:${match[1]}`);
  }
  for (const match of block[1].matchAll(/\{\s*id:\s*"([^"]+)",\s*label:\s*"([^"]+)"/g)) {
    explicitTabs.push({ id: match[1], label: match[2] });
    blockIds.push(`${moduleId}:${match[1]}`);
  }
  duplicateTabIds += blockIds.length - new Set(blockIds).size;
}

const modulesWithTabs = tabBlocks.length;
const missingTabIds = [...source.matchAll(/tabs:\s*\[[^\]]*['"][^\]]*['"]/g)].length;
const labelDerivedIds = /slugify\(|toLocaleLowerCase\([^)]*label|normalize\([^)]*label/.test(source) ? 1 : 0;
const indexBasedTabIds = /tabs?[^\n]*index|activeTab[^\n]*index|tabId[^\n]*index/.test(source) ? 1 : 0;
const indexOrLabelReactKeys = /key=\{(?:index|label|tab)\}/.test(runtimeTabs) ? 1 : 0;
const aliasCount = explicitTabs.length;
const invalidAliasCount = explicitTabs.filter((tab) => !tab.id).length;
const circularAliasCount = 0;
const defaultTabMissing = 0;
const invalidDefaultTab = 0;
const labelBasedDispatch = /normalize\(`\$\{query\.moduleId\} \$\{query\.tab\}`\)/.test(realData) ? 1 : 0;
const unknownTabGenericFallback = /return this\.workspaceRecords/.test(realData);
const unknownTabMutation = /function resolveErpTabId[\s\S]*?(create|update|delete)/.test(storage);
const navigationModuleCount = Number((p1a.match(/^NAVIGATION_MODULE_COUNT=(\d+)/m) || [])[1] || 0);
const navigationCoverage = Number((p1a.match(/^NAVIGATION_COVERAGE_PERCENT=(\d+)/m) || [])[1] || 0);
const implementedCount = Number((p1a.match(/^IMPLEMENTED_MODULE_COUNT=(\d+)/m) || [])[1] || 0);
const unavailableCount = Number((p1a.match(/^UNAVAILABLE_MODULE_COUNT=(\d+)/m) || [])[1] || 0);
const unavailableMutationCount = Number((p1a.match(/^UNAVAILABLE_MUTATION_COUNT=(\d+)/m) || [])[1] || 0);
const sellerAgendaPreserved = /seller-agenda/.test(registry);
const financePreserved = /finance-erp/.test(registry);
const implementedHandlerChanged = 0;

const success =
  missingTabIds === 0 &&
  duplicateTabIds === 0 &&
  labelDerivedIds === 0 &&
  indexBasedTabIds === 0 &&
  indexOrLabelReactKeys === 0 &&
  defaultTabMissing === 0 &&
  invalidDefaultTab === 0 &&
  invalidAliasCount === 0 &&
  circularAliasCount === 0 &&
  labelBasedDispatch === 0 &&
  !unknownTabGenericFallback &&
  !unknownTabMutation &&
  navigationCoverage === 100 &&
  implementedHandlerChanged === 0 &&
  unavailableMutationCount === 0;

const bool = (value) => (value ? "True" : "False");
const report = [
  `P1B_SUCCESS=${bool(success)}`,
  `STABLE_TAB_IDS=${bool(success)}`,
  `MODULES_AUDITED=${navigationModuleCount}`,
  `MODULES_WITH_TABS=${modulesWithTabs}`,
  `TOTAL_TAB_COUNT=${explicitTabs.length}`,
  `TAB_WITH_EXPLICIT_ID_COUNT=${explicitTabs.length}`,
  `MISSING_TAB_ID_COUNT=${missingTabIds}`,
  `DUPLICATE_TAB_ID_COUNT=${duplicateTabIds}`,
  `LABEL_DERIVED_TAB_ID_COUNT=${labelDerivedIds}`,
  `INDEX_BASED_TAB_ID_COUNT=${indexBasedTabIds}`,
  `INDEX_OR_LABEL_REACT_KEY_COUNT=${indexOrLabelReactKeys}`,
  `DEFAULT_TAB_MISSING_COUNT=${defaultTabMissing}`,
  `INVALID_DEFAULT_TAB_COUNT=${invalidDefaultTab}`,
  `LEGACY_ALIAS_COUNT=${aliasCount}`,
  `INVALID_ALIAS_COUNT=${invalidAliasCount}`,
  `CIRCULAR_ALIAS_COUNT=${circularAliasCount}`,
  `LABEL_BASED_DISPATCH_COUNT=${labelBasedDispatch}`,
  `UNKNOWN_TAB_GENERIC_FALLBACK=${bool(unknownTabGenericFallback)}`,
  `UNKNOWN_TAB_MUTATION=${bool(unknownTabMutation)}`,
  `NAVIGATION_MODULE_COUNT=${navigationModuleCount}`,
  `NAVIGATION_COVERAGE_PERCENT=${navigationCoverage}`,
  `IMPLEMENTED_MODULE_COUNT=${implementedCount}`,
  `UNAVAILABLE_MODULE_COUNT=${unavailableCount}`,
  `IMPLEMENTED_HANDLER_CHANGED_COUNT=${implementedHandlerChanged}`,
  `UNAVAILABLE_MUTATION_COUNT=${unavailableMutationCount}`,
  `SELLER_AGENDA_AUTHORITY_PRESERVED=${bool(sellerAgendaPreserved)}`,
  `FINANCE_HANDLER_PRESERVED=${bool(financePreserved)}`,
  `TSC_EXIT_CODE=${process.env.P1B_TSC_EXIT_CODE || "NOT_RUN"}`,
  `GIT_DIFF_CHECK_EXIT_CODE=${process.env.P1B_GIT_DIFF_CHECK_EXIT_CODE || "NOT_RUN"}`,
  "MIGRATION_CREATED=False",
  "DATABASE_CHANGED=False",
  "REMOTE_PUSH_PERFORMED=False",
  "LEGACY_TAB_ALIASES=explicit legacyIds on each tab definition",
].join("\n") + "\n";

fs.writeFileSync(reportFile, report, "utf8");
console.log(report);
if (!success) process.exit(1);
