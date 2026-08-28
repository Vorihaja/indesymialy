import type { AdminSettingsData, AdminSettingsDomain } from "../types";
import { AdminSettingsRepository } from "../repositories";
export class AdminSettingsService { constructor(private readonly repository: AdminSettingsRepository) {} list(domain: AdminSettingsDomain): Promise<AdminSettingsData> { return this.repository.list(domain); } }
