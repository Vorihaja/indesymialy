import { AdminMemoryRepository, type AdminDomainData } from "@/modules/admin-core";
import type { AdminModerationDomain } from "../types";
export class AdminModerationRepository { constructor(private readonly repository = new AdminMemoryRepository()) {} list(domain: AdminModerationDomain): Promise<AdminDomainData> { return this.repository.getDomain(domain); } }
