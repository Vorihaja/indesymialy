import { AdminMemoryRepository, type AdminDomainData } from "@/modules/admin-core";
import type { AdminReportsDomain } from "../types";
export class AdminReportsRepository { constructor(private readonly repository = new AdminMemoryRepository()) {} list(domain: AdminReportsDomain): Promise<AdminDomainData> { return this.repository.getDomain(domain); } }
