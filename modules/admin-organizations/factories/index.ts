import { AdminOrganizationsRepository } from "../repositories";
import { AdminOrganizationsService } from "../services";
import { GetAdminOrganizationsUseCase } from "../use-cases";
export function createAdminOrganizationsUseCase(): GetAdminOrganizationsUseCase { return new GetAdminOrganizationsUseCase(new AdminOrganizationsService(new AdminOrganizationsRepository())); }
