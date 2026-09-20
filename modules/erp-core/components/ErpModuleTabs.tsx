"use client";

import {
  useEffect,
  useRef,
} from "react";
import type { ErpTabDefinition } from "@/modules/erp-navigation";

type ErpModuleTabsProps = {
  tabs: readonly ErpTabDefinition[];
  active: string;
  onChange: (tabId: string) => void;
  ariaLabel: string;
  getDisplayLabel?: (tab: ErpTabDefinition) => string;
};

export function ErpModuleTabs({
  tabs,
  active,
  onChange,
  ariaLabel,
  getDisplayLabel = (tab) => tab.label,
}: ErpModuleTabsProps) {
  const activeTabRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeTabRef.current?.scrollIntoView({
      behavior: "auto",
      block: "nearest",
      inline: "nearest",
    });
  }, [active]);

  return (
    <div
      className="organizer-erp-tabs flex h-10 min-h-10 border-b border-[#303238] bg-[#141518]"
      role="tablist"
      aria-label={ariaLabel}
    >
      {tabs.map((tab) => {
        const selected = active === tab.id;

        return (
          <button
            key={tab.id}
            ref={selected ? activeTabRef : undefined}
            type="button"
            onClick={() => onChange(tab.id)}
            role="tab"
            aria-selected={selected}
            data-active={selected}
            className={[
              "erp-module-tab relative flex-none px-3 text-[9px] font-semibold uppercase tracking-[0.04em] transition-colors",
              selected
                ? "is-active"
                : "text-zinc-500 hover:text-zinc-200",
            ].join(" ")}
          >
            {getDisplayLabel(tab)}

            {selected && (
              <span
                className="erp-module-tab-indicator absolute inset-x-3 bottom-0 h-[2px]"
                aria-hidden="true"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
