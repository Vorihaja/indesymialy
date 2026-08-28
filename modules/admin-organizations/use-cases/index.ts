import type { AdminOrganizationsData, AdminOrganizationsDomain } from "../types";
import { AdminOrganizationsService } from "../services";
export class GetAdminOrganizationsUseCase { constructor(private readonly service: AdminOrganizationsService) {} execute(domain: AdminOrganizationsDomain): Promise<AdminOrganizationsData> { return this.service.list(domain); } }
