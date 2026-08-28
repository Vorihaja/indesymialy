import { ConversationsRepository } from "../repositories";
import { ConversationsService } from "../services";
import { GetConversationsStatusUseCase } from "../use-cases";
export function createConversationsStatusUseCase(): GetConversationsStatusUseCase { return new GetConversationsStatusUseCase(new ConversationsService(new ConversationsRepository())); }
