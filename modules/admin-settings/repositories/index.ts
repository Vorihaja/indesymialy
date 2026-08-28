import { AdminMemoryRepository, type AdminDomainData } from "@/modules/admin-core";
import type { AdminSettingsDomain } from "../types";
export class AdminSettingsRepository { constructor(private readonly repository = new AdminMemoryRepository()) {} list(domain: AdminSettingsDomain): Promise<AdminDomainData> { return this.repository.getDomain(domain); } }
