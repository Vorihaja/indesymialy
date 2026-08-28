import { MessageAttachmentsService } from "../services";
import type { MessageAttachmentsModuleStatus } from "../types";
export class GetMessageAttachmentsStatusUseCase { constructor(private readonly service: MessageAttachmentsService) {} execute(): MessageAttachmentsModuleStatus { return this.service.status(); } }
