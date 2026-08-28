import {
  ErpModuleTabs,
} from "@/modules/erp-core";

export function FighterTabs({ tabs, active, onChange }: {
  tabs: string[];
  active: string;
  onChange: (tab: string) => void;
}) {
  return (
    <ErpModuleTabs
      tabs={tabs}
      active={active}
      onChange={onChange}
      ariaLabel="Sous-navigation Combattant"
    />
  );
}
