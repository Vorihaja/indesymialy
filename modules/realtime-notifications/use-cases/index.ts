import { RealtimeNotificationsService } from "../services";
import type { RealtimeNotificationsModuleStatus } from "../types";
export class GetRealtimeNotificationsStatusUseCase { constructor(private readonly service: RealtimeNotificationsService) {} execute(): RealtimeNotificationsModuleStatus { return this.service.status(); } }
