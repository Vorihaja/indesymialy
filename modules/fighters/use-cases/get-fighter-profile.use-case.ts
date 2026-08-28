import { FighterService } from "@/modules/fighters/services/fighters.service";
import type { Fighter } from "@/modules/fighters/types";

export class GetFighterProfileUseCase {
  constructor(
    private readonly service: FighterService
  ) {}

  async execute(
    fighterId: string
  ): Promise<Fighter | null> {
    return this.service.getFighterById(fighterId);
  }
}