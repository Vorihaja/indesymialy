import { MessagingRepository } from "../repositories";
import type { MessagingModuleStatus } from "../types";
export class MessagingService { constructor(private readonly repository: MessagingRepository) {} status(): MessagingModuleStatus { return this.repository.getStatus(); } }
