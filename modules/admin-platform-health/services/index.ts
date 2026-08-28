import type { AdminPlatformHealthData, AdminPlatformHealthDomain } from "../types";
import { AdminPlatformHealthRepository } from "../repositories";
export class AdminPlatformHealthService { constructor(private readonly repository: AdminPlatformHealthRepository) {} list(domain: AdminPlatformHealthDomain): Promise<AdminPlatformHealthData> { return this.repository.list(domain); } }
