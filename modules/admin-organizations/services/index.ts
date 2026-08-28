import type { AdminOrganizationsData, AdminOrganizationsDomain } from "../types";
import { AdminOrganizationsRepository } from "../repositories";
export class AdminOrganizationsService { constructor(private readonly repository: AdminOrganizationsRepository) {} list(domain: AdminOrganizationsDomain): Promise<AdminOrganizationsData> { return this.repository.list(domain); } }
