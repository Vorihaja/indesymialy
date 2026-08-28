import { NotificationPreferencesRepository } from "../repositories";
import type { NotificationPreferencesModuleStatus } from "../types";
export class NotificationPreferencesService { constructor(private readonly repository: NotificationPreferencesRepository) {} status(): NotificationPreferencesModuleStatus { return this.repository.getStatus(); } }
