import { FighterService } from "@/modules/fighters/services/fighters.service";
import type { Fighter } from "@/modules/fighters/types";

export class UpdateFighterProfileUseCase {
  constructor(
    private readonly service: FighterService
  ) {}

  async execute(
    fighterId: string,
    updates: Partial<Fighter>
  ): Promise<Fighter | null> {
    return this.service.updateProfile(
      fighterId,
      updates
    );
  }
}