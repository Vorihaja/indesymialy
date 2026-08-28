import { FighterService } from "@/modules/fighters/services/fighters.service";
import type { FighterDashboardData } from "@/modules/fighters/types";

export class GetFighterDashboardUseCase {
  constructor(private readonly service: FighterService) {}

  async execute(userId: string): Promise<FighterDashboardData | null> {
    return this.service.getDashboardData(userId);
  }
}
