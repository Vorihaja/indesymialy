"use client";

import { useEffect, useMemo, useState } from "react";
import { createWorkspaceDashboardUseCase } from "../factories/workspace.factory";
import type { WorkspaceRole, WorkspaceSnapshot } from "../types";

export function useWorkspaceDashboard(role: WorkspaceRole) {
  const useCase = useMemo(() => createWorkspaceDashboardUseCase(), []);
  const [snapshots, setSnapshots] = useState<WorkspaceSnapshot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void useCase.execute(role).then((data) => {
      if (active) setSnapshots(data);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [role, useCase]);

  return { snapshots, loading };
}
