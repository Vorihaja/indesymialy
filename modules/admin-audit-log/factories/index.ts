import { AdminAuditLogRepository } from "../repositories";
import { AdminAuditLogService } from "../services";
import { GetAdminAuditLogUseCase } from "../use-cases";
export function createAdminAuditLogUseCase(): GetAdminAuditLogUseCase { return new GetAdminAuditLogUseCase(new AdminAuditLogService(new AdminAuditLogRepository())); }
