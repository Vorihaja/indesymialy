import { MessagingService } from "../services";
import type { MessagingModuleStatus } from "../types";
export class GetMessagingStatusUseCase { constructor(private readonly service: MessagingService) {} execute(): MessagingModuleStatus { return this.service.status(); } }
