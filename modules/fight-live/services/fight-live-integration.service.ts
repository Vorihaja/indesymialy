import type { FightActionKind, FightCorner, FightDecisionMethod, FightLiveSnapshot, FightTimerAction, PublicFightLiveSnapshot } from "../types";
import { validateFightId, validateRoundScore } from "../validation";

export interface FightLiveRepositoryPort {
  list(scope: "public" | "organizer" | "official" | "fighter"): Promise<Array<FightLiveSnapshot | PublicFightLiveSnapshot>>;
  listJudgeAssignments(): Promise<FightLiveSnapshot[]>;
  get(fightId: string): Promise<FightLiveSnapshot>;
  getJudgeScorecard(fightId: string): Promise<FightLiveSnapshot>;
  getPublic(fightId: string): Promise<PublicFightLiveSnapshot>;
  updateTimer(
    fightId: string,
    action: FightTimerAction,
  ): Promise<FightLiveSnapshot>;
  recordAction(
    fightId: string,
    kind: FightActionKind,
    corner?: FightCorner,
  ): Promise<FightLiveSnapshot>;
  saveRoundScore(
    fightId: string,
    cardId: string,
    roundNumber: number,
    red: number,
    blue: number,
  ): Promise<FightLiveSnapshot>;
  submitCard(fightId: string, cardId: string): Promise<FightLiveSnapshot>;
  decide(
    fightId: string,
    winnerId: string | null,
    method: FightDecisionMethod,
  ): Promise<FightLiveSnapshot>;
  publish(fightId: string): Promise<FightLiveSnapshot>;
  recalculateStatistics(fightId: string): Promise<FightLiveSnapshot>;
}

export class FightLiveIntegrationService {
  constructor(private readonly repository: FightLiveRepositoryPort) {}

  list(scope: "public" | "organizer" | "official" | "fighter"): Promise<Array<FightLiveSnapshot | PublicFightLiveSnapshot>> { return this.repository.list(scope); }
  listJudgeAssignments(): Promise<FightLiveSnapshot[]> { return this.repository.listJudgeAssignments(); }
  get(fightId: string): Promise<FightLiveSnapshot> { return this.repository.get(validateFightId(fightId)); }
  getJudgeScorecard(fightId: string): Promise<FightLiveSnapshot> { return this.repository.getJudgeScorecard(validateFightId(fightId)); }
  getPublic(fightId: string): Promise<PublicFightLiveSnapshot> { return this.repository.getPublic(validateFightId(fightId)); }
  updateTimer(fightId: string, action: FightTimerAction): Promise<FightLiveSnapshot> { return this.repository.updateTimer(validateFightId(fightId), action); }
  recordAction(fightId: string, kind: FightActionKind, corner?: FightCorner): Promise<FightLiveSnapshot> { return this.repository.recordAction(validateFightId(fightId), kind, corner); }
  saveScore(fightId: string, cardId: string, roundNumber: number, red: number, blue: number): Promise<FightLiveSnapshot> { return this.repository.saveRoundScore(validateFightId(fightId), cardId, roundNumber, validateRoundScore(red), validateRoundScore(blue)); }
  submitCard(fightId: string, cardId: string): Promise<FightLiveSnapshot> { return this.repository.submitCard(validateFightId(fightId), cardId); }
  decide(fightId: string, winnerId: string | null, method: FightDecisionMethod): Promise<FightLiveSnapshot> { return this.repository.decide(validateFightId(fightId), winnerId, method); }
  publish(fightId: string): Promise<FightLiveSnapshot> { return this.repository.publish(validateFightId(fightId)); }
  recalculateStatistics(fightId: string): Promise<FightLiveSnapshot> { return this.repository.recalculateStatistics(validateFightId(fightId)); }
}
