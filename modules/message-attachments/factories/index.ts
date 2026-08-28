import { MessageAttachmentsRepository } from "../repositories";
import { MessageAttachmentsService } from "../services";
import { GetMessageAttachmentsStatusUseCase } from "../use-cases";
export function createMessageAttachmentsStatusUseCase(): GetMessageAttachmentsStatusUseCase { return new GetMessageAttachmentsStatusUseCase(new MessageAttachmentsService(new MessageAttachmentsRepository())); }
