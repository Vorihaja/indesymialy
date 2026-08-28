import {
  getOrganizerTabDisplayLabel,
} from "../config/display-labels";

import {
  ErpModuleTabs,
} from "@/modules/erp-core";

export function OrganizerTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: string[];
  active: string;
  onChange: (
    tab: string,
  ) => void;
}) {
  return (
    <ErpModuleTabs
      tabs={tabs}
      active={active}
      onChange={onChange}
      ariaLabel="Sous-navigation du module"
      getDisplayLabel={getOrganizerTabDisplayLabel}
    />
  );
}
