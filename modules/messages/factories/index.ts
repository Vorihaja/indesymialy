import { MessagesRepository } from "../repositories";
import { MessagesService } from "../services";
import { GetMessagesStatusUseCase } from "../use-cases";
export function createMessagesStatusUseCase(): GetMessagesStatusUseCase { return new GetMessagesStatusUseCase(new MessagesService(new MessagesRepository())); }
