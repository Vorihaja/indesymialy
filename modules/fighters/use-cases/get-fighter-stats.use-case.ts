import { FighterService } from "@/modules/fighters/services/fighters.service";
import type { FighterStats } from "@/modules/fighters/types";

export class GetFighterStatsUseCase {
  constructor(
    private readonly service: FighterService
  ) {}

  async execute(
    fighterId: string
  ): Promise<FighterStats> {
    return this.service.getStats(fighterId);
  }
}