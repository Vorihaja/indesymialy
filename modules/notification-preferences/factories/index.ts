import { NotificationPreferencesRepository } from "../repositories";
import { NotificationPreferencesService } from "../services";
import { GetNotificationPreferencesStatusUseCase } from "../use-cases";
export function createNotificationPreferencesStatusUseCase(): GetNotificationPreferencesStatusUseCase { return new GetNotificationPreferencesStatusUseCase(new NotificationPreferencesService(new NotificationPreferencesRepository())); }
