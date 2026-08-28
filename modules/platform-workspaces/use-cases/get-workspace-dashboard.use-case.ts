import { WorkspaceService } from "../services/workspace.service";
import type { WorkspaceRole, WorkspaceSnapshot } from "../types";

export class GetWorkspaceDashboardUseCase {
  constructor(private readonly service: WorkspaceService) {}
  execute(role: WorkspaceRole): Promise<WorkspaceSnapshot[]> {
    return this.service.getSnapshot(role);
  }
}
