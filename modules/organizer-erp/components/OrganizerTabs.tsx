import {
  getOrganizerTabDisplayLabel,
} from "../config/display-labels";

import {
  ErpModuleTabs,
} from "@/modules/erp-core";
import type { ErpTabDefinition } from "@/modules/erp-navigation";

export function OrganizerTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: readonly ErpTabDefinition[];
  active: string;
  onChange: (tabId: string) => void;
}) {
  return (
    <ErpModuleTabs
      tabs={tabs}
      active={active}
      onChange={onChange}
      ariaLabel="Sous-navigation du module"
      getDisplayLabel={(tab) => getOrganizerTabDisplayLabel(tab.label)}
    />
  );
}
