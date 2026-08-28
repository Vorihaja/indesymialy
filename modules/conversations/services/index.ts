import { ConversationsRepository } from "../repositories";
import type { ConversationsModuleStatus } from "../types";
export class ConversationsService { constructor(private readonly repository: ConversationsRepository) {} status(): ConversationsModuleStatus { return this.repository.getStatus(); } }
