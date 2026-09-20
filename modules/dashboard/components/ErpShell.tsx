"use client";

import type { ReactNode } from "react";

import {
  DashboardShell,
} from "@/components/ui";

import {
  DashboardProvider,
} from "../hooks";

export function ErpShell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <DashboardProvider>
      <DashboardShell className="erp-shell-root erp-root bg-[var(--erp-bg)]">
        {children}
      </DashboardShell>
    </DashboardProvider>
  );
}