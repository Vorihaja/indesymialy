import type { AdminModerationData, AdminModerationDomain } from "../types";
import { AdminModerationService } from "../services";
export class GetAdminModerationUseCase { constructor(private readonly service: AdminModerationService) {} execute(domain: AdminModerationDomain): Promise<AdminModerationData> { return this.service.list(domain); } }
