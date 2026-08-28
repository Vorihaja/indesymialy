import { MessagesService } from "../services";
import type { MessagesModuleStatus } from "../types";
export class GetMessagesStatusUseCase { constructor(private readonly service: MessagesService) {} execute(): MessagesModuleStatus { return this.service.status(); } }
