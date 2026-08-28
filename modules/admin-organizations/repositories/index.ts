import { AdminMemoryRepository, type AdminDomainData } from "@/modules/admin-core";
import type { AdminOrganizationsDomain } from "../types";
export class AdminOrganizationsRepository { constructor(private readonly repository = new AdminMemoryRepository()) {} list(domain: AdminOrganizationsDomain): Promise<AdminDomainData> { return this.repository.getDomain(domain); } }
