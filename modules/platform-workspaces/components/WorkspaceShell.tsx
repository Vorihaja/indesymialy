"use client";

import type {
  ReactNode,
} from "react";

import {
  getWorkspaceDefinition,
} from "../config";

import type {
  WorkspaceRole,
} from "../types";

type WorkspaceShellProps = {
  role: WorkspaceRole;
  children: ReactNode;
  title?: string;
  description?: string;
};

export function WorkspaceShell({
  role,
  children,
}: WorkspaceShellProps) {
  const workspace =
    getWorkspaceDefinition(role);

  return (
    <section
      className="platform-workspace-canvas"
      data-workspace-role={role}
      aria-label={`ERP ${workspace.label}`}
    >
      {children}
    </section>
  );
}
