import { AdminReportsRepository } from "../repositories";
import { AdminReportsService } from "../services";
import { GetAdminReportsUseCase } from "../use-cases";
export function createAdminReportsUseCase(): GetAdminReportsUseCase { return new GetAdminReportsUseCase(new AdminReportsService(new AdminReportsRepository())); }
