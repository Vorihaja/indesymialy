import { RealtimeNotificationsRepository } from "../repositories";
import { RealtimeNotificationsService } from "../services";
import { GetRealtimeNotificationsStatusUseCase } from "../use-cases";
export function createRealtimeNotificationsStatusUseCase(): GetRealtimeNotificationsStatusUseCase { return new GetRealtimeNotificationsStatusUseCase(new RealtimeNotificationsService(new RealtimeNotificationsRepository())); }
