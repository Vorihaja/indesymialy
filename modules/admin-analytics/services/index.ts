import type { AdminAnalyticsData, AdminAnalyticsDomain } from "../types";
import { AdminAnalyticsRepository } from "../repositories";
export class AdminAnalyticsService { constructor(private readonly repository: AdminAnalyticsRepository) {} list(domain: AdminAnalyticsDomain): Promise<AdminAnalyticsData> { return this.repository.list(domain); } }
