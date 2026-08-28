import { AdminMemoryRepository, type AdminDomainData } from "@/modules/admin-core";
import type { AdminAnalyticsDomain } from "../types";
export class AdminAnalyticsRepository { constructor(private readonly repository = new AdminMemoryRepository()) {} list(domain: AdminAnalyticsDomain): Promise<AdminDomainData> { return this.repository.getDomain(domain); } }
