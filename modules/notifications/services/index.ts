import { NotificationsRepository } from "../repositories";
import type { NotificationsModuleStatus } from "../types";
export class NotificationsService { constructor(private readonly repository: NotificationsRepository) {} status(): NotificationsModuleStatus { return this.repository.getStatus(); } }
