import { RealtimeNotificationsRepository } from "../repositories";
import type { RealtimeNotificationsModuleStatus } from "../types";
export class RealtimeNotificationsService { constructor(private readonly repository: RealtimeNotificationsRepository) {} status(): RealtimeNotificationsModuleStatus { return this.repository.getStatus(); } }
