import type { AdminPlatformHealthData, AdminPlatformHealthDomain } from "../types";
import { AdminPlatformHealthService } from "../services";
export class GetAdminPlatformHealthUseCase { constructor(private readonly service: AdminPlatformHealthService) {} execute(domain: AdminPlatformHealthDomain): Promise<AdminPlatformHealthData> { return this.service.list(domain); } }
