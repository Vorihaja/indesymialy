import { MessagingRepository } from "../repositories";
import { MessagingService } from "../services";
import { GetMessagingStatusUseCase } from "../use-cases";
export function createMessagingStatusUseCase(): GetMessagingStatusUseCase { return new GetMessagingStatusUseCase(new MessagingService(new MessagingRepository())); }
