import { FightLiveIntegrationService } from "../services/fight-live-integration.service";
import type { FightActionKind, FightCorner, FightDecisionMethod, FightTimerAction } from "../types";

export class ManageFightLiveUseCase {
  constructor(private readonly service: FightLiveIntegrationService) {}
  list(scope: "public" | "organizer" | "official" | "fighter") { return this.service.list(scope); }
  listJudgeAssignments() { return this.service.listJudgeAssignments(); }
  get(fightId: string) { return this.service.get(fightId); }
  getJudgeScorecard(fightId: string) { return this.service.getJudgeScorecard(fightId); }
  getPublic(fightId: string) { return this.service.getPublic(fightId); }
  timer(fightId: string, action: FightTimerAction) { return this.service.updateTimer(fightId, action); }
  action(fightId: string, kind: FightActionKind, corner?: FightCorner) { return this.service.recordAction(fightId, kind, corner); }
  saveScore(fightId: string, cardId: string, roundNumber: number, red: number, blue: number) { return this.service.saveScore(fightId, cardId, roundNumber, red, blue); }
  submitCard(fightId: string, cardId: string) { return this.service.submitCard(fightId, cardId); }
  decide(fightId: string, winnerId: string | null, method: FightDecisionMethod) { return this.service.decide(fightId, winnerId, method); }
  publish(fightId: string) { return this.service.publish(fightId); }
  recalculateStatistics(fightId: string) { return this.service.recalculateStatistics(fightId); }
}
