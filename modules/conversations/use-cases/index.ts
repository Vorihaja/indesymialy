import { ConversationsService } from "../services";
import type { ConversationsModuleStatus } from "../types";
export class GetConversationsStatusUseCase { constructor(private readonly service: ConversationsService) {} execute(): ConversationsModuleStatus { return this.service.status(); } }
