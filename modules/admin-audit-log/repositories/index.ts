import { AdminMemoryRepository, type AdminDomainData } from "@/modules/admin-core";
import type { AdminAuditLogDomain } from "../types";
export class AdminAuditLogRepository { constructor(private readonly repository = new AdminMemoryRepository()) {} list(domain: AdminAuditLogDomain): Promise<AdminDomainData> { return this.repository.getDomain(domain); } }
