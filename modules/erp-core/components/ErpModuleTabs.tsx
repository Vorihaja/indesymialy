"use client";

import {
  useEffect,
  useRef,
} from "react";

type ErpModuleTabsProps = {
  tabs: readonly string[];
  active: string;
  onChange: (tab: string) => void;
  ariaLabel: string;
  getDisplayLabel?: (tab: string) => string;
};

export function ErpModuleTabs({
  tabs,
  active,
  onChange,
  ariaLabel,
  getDisplayLabel = (tab) => tab,
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
        const selected = active === tab;

        return (
          <button
            key={tab}
            ref={selected ? activeTabRef : undefined}
            type="button"
            onClick={() => onChange(tab)}
            role="tab"
            aria-selected={selected}
            className={[
              "relative flex-none px-3 text-[9px] font-semibold uppercase tracking-[0.04em] transition-colors",
              selected
                ? "text-white"
                : "text-zinc-500 hover:text-zinc-200",
            ].join(" ")}
          >
            {getDisplayLabel(tab)}

            {selected && (
              <span
                className="absolute inset-x-3 bottom-0 h-[2px] bg-[#ff1638]"
                aria-hidden="true"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
