import { WorkspaceRepository } from "../repositories/workspace.repository";
import type { WorkspaceRole, WorkspaceSnapshot } from "../types";

export class WorkspaceService {
  constructor(private readonly repository: WorkspaceRepository) {}
  getSnapshot(role: WorkspaceRole): Promise<WorkspaceSnapshot[]> {
    return this.repository.getSnapshot(role);
  }
}
