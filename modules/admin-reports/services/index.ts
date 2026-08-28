import type { AdminReportsData, AdminReportsDomain } from "../types";
import { AdminReportsRepository } from "../repositories";
export class AdminReportsService { constructor(private readonly repository: AdminReportsRepository) {} list(domain: AdminReportsDomain): Promise<AdminReportsData> { return this.repository.list(domain); } }
