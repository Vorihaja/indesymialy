import type { AdminModerationData, AdminModerationDomain } from "../types";
import { AdminModerationRepository } from "../repositories";
export class AdminModerationService { constructor(private readonly repository: AdminModerationRepository) {} list(domain: AdminModerationDomain): Promise<AdminModerationData> { return this.repository.list(domain); } }
