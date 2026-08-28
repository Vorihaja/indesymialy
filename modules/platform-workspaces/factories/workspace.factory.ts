import { WorkspaceRepository } from "../repositories/workspace.repository";
import { WorkspaceService } from "../services/workspace.service";
import { GetWorkspaceDashboardUseCase } from "../use-cases/get-workspace-dashboard.use-case";

export function createWorkspaceDashboardUseCase() {
  return new GetWorkspaceDashboardUseCase(
    new WorkspaceService(new WorkspaceRepository()),
  );
}
