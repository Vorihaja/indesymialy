"use client";
import { ReactNode } from "react";
import MessageWorkspace from "./messages/MessageWorkspace";
import ErpSidebar from "./ErpSidebar";

type StatItem = {
  label: string;
  value: string;
  note: string;
};

type SidebarItem = {
  id: string;
  label: string;
  href?: string;
};

type ErpShellProps = {
  title: string;
  subtitle: string;
  description?: string;
  stats?: StatItem[];
  actions?: ReactNode;
  children: ReactNode;
  sidebarTopItems?: SidebarItem[];
  sidebarBottomItems?: SidebarItem[];
  activeSidebarId?: string;
};

export default function ErpShell({
  title,
  subtitle,
  description,
  stats,
  actions,
  children,
  sidebarTopItems,
  sidebarBottomItems,
  activeSidebarId,
}: ErpShellProps) {
  const hasSidebar = (sidebarTopItems?.length ?? 0) > 0 || (sidebarBottomItems?.length ?? 0) > 0;

  const content = (
    <>
      <section className="rounded-[28px] border border-white/10 bg-slate-900/80 p-8 shadow-[0_30px_120px_rgba(15,23,42,0.55)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <span className="inline-flex rounded-full bg-amber-300/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.28em] text-amber-300">
              Espace de travail
            </span>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">
              {title}
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-400">
              {subtitle}
            </p>
            {description ? (
              <p className="mt-4 max-w-2xl text-sm text-slate-300">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>

        {stats && stats.length > 0 ? (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-3xl border border-white/10 bg-slate-950/80 p-5 shadow-sm">
                <div className="text-sm uppercase tracking-[0.25em] text-slate-500">{stat.label}</div>
                <div className="mt-4 text-3xl font-black text-white">{stat.value}</div>
                <p className="mt-3 text-sm leading-6 text-slate-400">{stat.note}</p>
              </div>
            ))}
          </div>
        ) : null}

        <div className="mt-10">{children}</div>
      </section>

      <MessageWorkspace />
    </>
  );

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {hasSidebar ? (
          <div className="grid gap-8 xl:grid-cols-[280px_minmax(0,1fr)]">
            <div className="xl:sticky xl:top-6 xl:self-start">
              <ErpSidebar
                topItems={sidebarTopItems ?? []}
                bottomItems={sidebarBottomItems ?? []}
                activeId={activeSidebarId}
              />
            </div>
            <div className="space-y-10">{content}</div>
          </div>
        ) : (
          <div className="space-y-10">{content}</div>
        )}
      </div>
    </main>
  );
}
