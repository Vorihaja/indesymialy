import { AdminSettingsRepository } from "../repositories";
import { AdminSettingsService } from "../services";
import { GetAdminSettingsUseCase } from "../use-cases";
export function createAdminSettingsUseCase(): GetAdminSettingsUseCase { return new GetAdminSettingsUseCase(new AdminSettingsService(new AdminSettingsRepository())); }
