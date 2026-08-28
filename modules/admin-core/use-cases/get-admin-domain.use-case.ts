import type { AdminDomain, AdminDomainData } from "../types";
import { AdminCoreService } from "../services/admin-core.service";
export class GetAdminDomainUseCase { constructor(private readonly service: AdminCoreService) {} execute(domain: AdminDomain): Promise<AdminDomainData> { return this.service.getDomain(domain); } }
