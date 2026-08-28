import type { AdminAnalyticsData, AdminAnalyticsDomain } from "../types";
import { AdminAnalyticsService } from "../services";
export class GetAdminAnalyticsUseCase { constructor(private readonly service: AdminAnalyticsService) {} execute(domain: AdminAnalyticsDomain): Promise<AdminAnalyticsData> { return this.service.list(domain); } }
