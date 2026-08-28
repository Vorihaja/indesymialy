import { AdminModerationRepository } from "../repositories";
import { AdminModerationService } from "../services";
import { GetAdminModerationUseCase } from "../use-cases";
export function createAdminModerationUseCase(): GetAdminModerationUseCase { return new GetAdminModerationUseCase(new AdminModerationService(new AdminModerationRepository())); }
