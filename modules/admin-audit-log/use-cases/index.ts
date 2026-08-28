import type { AdminAuditLogData, AdminAuditLogDomain } from "../types";
import { AdminAuditLogService } from "../services";
export class GetAdminAuditLogUseCase { constructor(private readonly service: AdminAuditLogService) {} execute(domain: AdminAuditLogDomain): Promise<AdminAuditLogData> { return this.service.list(domain); } }
