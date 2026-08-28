import { NotificationPreferencesService } from "../services";
import type { NotificationPreferencesModuleStatus } from "../types";
export class GetNotificationPreferencesStatusUseCase { constructor(private readonly service: NotificationPreferencesService) {} execute(): NotificationPreferencesModuleStatus { return this.service.status(); } }
