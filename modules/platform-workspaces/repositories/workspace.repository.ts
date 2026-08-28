import type { WorkspaceRole, WorkspaceSnapshot } from "../types";

export class WorkspaceRepository {
  async getSnapshot(_role: WorkspaceRole): Promise<WorkspaceSnapshot[]> {
    return [
      { title: "Activité", value: "—", detail: "Données métier à connecter" },
      { title: "Documents", value: "—", detail: "Espace documentaire prêt" },
      { title: "Notifications", value: "—", detail: "Centre de notifications prêt" },
    ];
  }
}
