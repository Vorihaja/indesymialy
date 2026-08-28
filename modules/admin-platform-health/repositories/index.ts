import { AdminMemoryRepository, type AdminDomainData } from "@/modules/admin-core";
import type { AdminPlatformHealthDomain } from "../types";
export class AdminPlatformHealthRepository { constructor(private readonly repository = new AdminMemoryRepository()) {} list(domain: AdminPlatformHealthDomain): Promise<AdminDomainData> { return this.repository.getDomain(domain); } }
