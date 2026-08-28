import { MessageAttachmentsRepository } from "../repositories";
import type { MessageAttachmentsModuleStatus } from "../types";
export class MessageAttachmentsService { constructor(private readonly repository: MessageAttachmentsRepository) {} status(): MessageAttachmentsModuleStatus { return this.repository.getStatus(); } }
