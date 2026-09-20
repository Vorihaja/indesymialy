"use client";

import {
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

import {
  useEffect,
  useRef,
} from "react";

import type {
  LucideIcon,
} from "lucide-react";

export type ErpModuleNavigationItem<ModuleId extends string> = {
  id: ModuleId;
  label: string;
  icon: LucideIcon;
  live?: boolean;
};

type ErpModuleSidebarProps<ModuleId extends string> = {
  workspaceLabel: string;
  items: readonly ErpModuleNavigationItem<ModuleId>[];
  active: ModuleId;
  onChange: (id: ModuleId) => void;
  navigationLabel: string;
  mobileNavigationLabel?: string;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
};

export function ErpModuleSidebar<ModuleId extends string>({
  workspaceLabel,
  items,
  active,
  onChange,
  navigationLabel,
  mobileNavigationLabel = navigationLabel + " mobile",
  collapsed = false,
  onToggleCollapsed,
}: ErpModuleSidebarProps<ModuleId>) {
  const standardItems = items.filter((item) => !item.live);
  const liveItems = items.filter((item) => item.live);
  const activeMobileItemRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeMobileItemRef.current?.scrollIntoView({
      behavior: "auto",
      block: "nearest",
      inline: "nearest",
    });
  }, [active]);

  const renderDesktopItem = (
    item: ErpModuleNavigationItem<ModuleId>,
  ) => {
    const Icon = item.icon;
    const selected = active === item.id;

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => onChange(item.id)}
        title={collapsed ? item.label : undefined}
        aria-label={collapsed ? item.label : undefined}
        aria-pressed={selected}
        data-active={selected}
        data-live={item.live || undefined}
        className={[
          "erp-module-nav-item group relative flex min-h-9 w-full items-center gap-2.5 border-l-2 text-left text-[10px] font-semibold transition-colors",
          collapsed ? "justify-center px-0" : "px-3",
          selected
            ? "is-active"
            : "border-transparent text-zinc-400",
        ].join(" ")}
      >
        <Icon
          size={16}
          strokeWidth={1.8}
          className={
            selected || item.live
              ? "erp-module-nav-icon is-active"
              : "text-zinc-500 group-hover:text-zinc-300"
          }
          aria-hidden="true"
        />

        {!collapsed && (
          <span className="min-w-0 flex-1 truncate">
            {item.label}
          </span>
        )}

        {!collapsed && item.live && (
          <span className="flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-[0.12em] text-[#ff2f49]">
            <span
              className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#ff2f49]"
              aria-hidden="true"
            />
            Direct
          </span>
        )}
      </button>
    );
  };

  return (
    <>
      <aside
        className={[
          "organizer-erp-sidebar hidden flex-none flex-col border-r border-[#292c31] bg-[#101114] transition-[width] duration-200 lg:flex",
          collapsed ? "w-14" : "w-[224px]",
        ].join(" ")}
        data-collapsed={collapsed}
      >
        <div
          className={[
            "flex h-12 flex-none items-center border-b border-[#292c31]",
            collapsed ? "justify-center" : "px-4",
          ].join(" ")}
        >
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <span className="block text-[7px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                Espace de travail
              </span>

              <strong className="mt-0.5 block truncate text-[10px] font-semibold uppercase tracking-[0.06em] text-zinc-200">
                {workspaceLabel}
              </strong>
            </div>
          )}

          {onToggleCollapsed && (
            <button
              type="button"
              onClick={onToggleCollapsed}
              className="grid h-7 w-7 flex-none place-items-center text-zinc-500 transition-colors hover:bg-white/5 hover:text-white"
              aria-label={
                collapsed
                  ? "Déployer la barre latérale"
                  : "Réduire la barre latérale"
              }
              title={collapsed ? "Déployer" : "Réduire"}
            >
              {collapsed ? (
                <PanelLeftOpen size={14} aria-hidden="true" />
              ) : (
                <PanelLeftClose size={14} aria-hidden="true" />
              )}
            </button>
          )}
        </div>

        <nav
          className="organizer-erp-sidebar-scroll flex-1 py-2 [scrollbar-color:#4b4f58_transparent] [scrollbar-width:thin]"
          aria-label={navigationLabel}
        >
          {standardItems.map(renderDesktopItem)}
        </nav>

        {liveItems.length > 0 && (
          <div className="flex-none border-t border-[#292c31] bg-[#0c0d0f] p-2">
            {liveItems.map(renderDesktopItem)}
          </div>
        )}
      </aside>

      <nav
        className="organizer-erp-mobile-nav border-b border-[#292c31] bg-[#101114]"
        aria-label={mobileNavigationLabel}
      >
        {items.map((item) => {
          const selected = active === item.id;

          return (
            <button
              key={item.id}
              ref={selected ? activeMobileItemRef : undefined}
            type="button"
            onClick={() => onChange(item.id)}
            aria-pressed={selected}
            data-active={selected}
            className={[
                "erp-module-mobile-item flex h-10 flex-none items-center gap-2 border-b-2 px-3 text-[10px] font-semibold",
                selected
                  ? "is-active"
                  : "border-transparent text-zinc-500",
              ].join(" ")}
            >
              {item.live && (
                <span
                  className="h-1.5 w-1.5 rounded-full bg-[#ff2f49]"
                  aria-hidden="true"
                />
              )}

              {item.label}
            </button>
          );
        })}
      </nav>
    </>
  );
}
