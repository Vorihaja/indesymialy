import { NotificationsRepository } from "../repositories";
import { NotificationsService } from "../services";
import { GetNotificationsStatusUseCase } from "../use-cases";
export function createNotificationsStatusUseCase(): GetNotificationsStatusUseCase { return new GetNotificationsStatusUseCase(new NotificationsService(new NotificationsRepository())); }
