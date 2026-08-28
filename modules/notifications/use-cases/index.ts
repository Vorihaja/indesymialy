import { NotificationsService } from "../services";
import type { NotificationsModuleStatus } from "../types";
export class GetNotificationsStatusUseCase { constructor(private readonly service: NotificationsService) {} execute(): NotificationsModuleStatus { return this.service.status(); } }
