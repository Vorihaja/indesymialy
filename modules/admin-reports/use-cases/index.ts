import type { AdminReportsData, AdminReportsDomain } from "../types";
import { AdminReportsService } from "../services";
export class GetAdminReportsUseCase { constructor(private readonly service: AdminReportsService) {} execute(domain: AdminReportsDomain): Promise<AdminReportsData> { return this.service.list(domain); } }
