import type { AdminAuditLogData, AdminAuditLogDomain } from "../types";
import { AdminAuditLogRepository } from "../repositories";
export class AdminAuditLogService { constructor(private readonly repository: AdminAuditLogRepository) {} list(domain: AdminAuditLogDomain): Promise<AdminAuditLogData> { return this.repository.list(domain); } }
