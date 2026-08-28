import { AdminAnalyticsRepository } from "../repositories";
import { AdminAnalyticsService } from "../services";
import { GetAdminAnalyticsUseCase } from "../use-cases";
export function createAdminAnalyticsUseCase(): GetAdminAnalyticsUseCase { return new GetAdminAnalyticsUseCase(new AdminAnalyticsService(new AdminAnalyticsRepository())); }
