import { MessagesRepository } from "../repositories";
import type { MessagesModuleStatus } from "../types";
export class MessagesService { constructor(private readonly repository: MessagesRepository) {} status(): MessagesModuleStatus { return this.repository.getStatus(); } }
