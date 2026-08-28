import type { AdminSettingsData, AdminSettingsDomain } from "../types";
import { AdminSettingsService } from "../services";
export class GetAdminSettingsUseCase { constructor(private readonly service: AdminSettingsService) {} execute(domain: AdminSettingsDomain): Promise<AdminSettingsData> { return this.service.list(domain); } }
