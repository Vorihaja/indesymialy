"use client";

import Link from "next/link";

type SidebarItem = {
  id: string;
  label: string;
  href?: string;
};

type ErpSidebarProps = {
  topItems: SidebarItem[];
  bottomItems: SidebarItem[];
  activeId?: string;
  onSelectItem?: (id: string) => void;
};

export default function ErpSidebar({
  topItems,
  bottomItems,
  activeId,
  onSelectItem,
}: ErpSidebarProps) {
  const renderItem = (item: SidebarItem) => {
    const isActive = item.id === activeId;
    const className = `w-full text-left rounded-2xl px-4 py-3 text-sm font-medium transition ${
      isActive
        ? "bg-[#C5A041]/15 text-white ring-1 ring-inset ring-[#C5A041]/30"
        : "text-slate-300 hover:text-white hover:bg-white/[0.03]"
    }`;

    if (item.href) {
      return (
        <Link key={item.id} href={item.href} className={className}>
          {item.label}
        </Link>
      );
    }

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => onSelectItem?.(item.id)}
        className={className}
      >
        {item.label}
      </button>
    );
  };

  return (
    <aside className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-[#0B0B10] p-4">
        <div className="mb-4 px-1 text-[10px] uppercase tracking-[0.28em] text-slate-500">
          Navigation
        </div>
        <div className="space-y-2">{topItems.map(renderItem)}</div>
        <div className="mt-6 border-t border-white/10 pt-5">
          <div className="mb-3 px-1 text-[10px] uppercase tracking-[0.28em] text-slate-500">
            Modules
          </div>
          <div className="space-y-2">{bottomItems.map(renderItem)}</div>
        </div>
      </div>
    </aside>
  );
}
