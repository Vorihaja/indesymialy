import { AdminMemoryRepository } from "../repositories/admin-memory.repository";
import { AdminCoreService } from "../services/admin-core.service";
import { GetAdminDomainUseCase } from "../use-cases/get-admin-domain.use-case";
const repository = new AdminMemoryRepository();
export function createAdminDomainUseCase(): GetAdminDomainUseCase { return new GetAdminDomainUseCase(new AdminCoreService(repository)); }
export function getAdminMemoryRepository(): AdminMemoryRepository { return repository; }
