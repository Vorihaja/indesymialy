import { AdminPlatformHealthRepository } from "../repositories";
import { AdminPlatformHealthService } from "../services";
import { GetAdminPlatformHealthUseCase } from "../use-cases";
export function createAdminPlatformHealthUseCase(): GetAdminPlatformHealthUseCase { return new GetAdminPlatformHealthUseCase(new AdminPlatformHealthService(new AdminPlatformHealthRepository())); }
