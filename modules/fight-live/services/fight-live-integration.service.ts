import type { FightActionKind, FightCorner, FightDecisionMethod, FightLiveSnapshot, PublicFightLiveSnapshot } from "../types";
import { validateFightId, validateRoundScore } from "../validation";

export interface FightLiveRepositoryPort {
  list(): Promise<FightLiveSnapshot[]>;
  listJudgeAssignments(): Promise<FightLiveSnapshot[]>;
  get(fightId: string): Promise<FightLiveSnapshot>;
  getJudgeScorecard(fightId: string): Promise<FightLiveSnapshot>;
  getPublic(fightId: string): Promise<PublicFightLiveSnapshot>;
  updateTimer(
    fightId: string,
    action: "start" | "pause" | "resume" | "end_round" | "next_round" | "end_fight",
  ): Promise<FightLiveSnapshot>;
  recordAction(
    fightId: string,
    kind: FightActionKind,
    corner?: FightCorner,
  ): Promise<FightLiveSnapshot>;
  assignOfficial(fightId: string, officialId: string): Promise<FightLiveSnapshot>;
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
}

export class FightLiveIntegrationService {
  constructor(private readonly repository: FightLiveRepositoryPort) {}

  list(): Promise<FightLiveSnapshot[]> { return this.repository.list(); }
  listJudgeAssignments(): Promise<FightLiveSnapshot[]> { return this.repository.listJudgeAssignments(); }
  get(fightId: string): Promise<FightLiveSnapshot> { return this.repository.get(validateFightId(fightId)); }
  getJudgeScorecard(fightId: string): Promise<FightLiveSnapshot> { return this.repository.getJudgeScorecard(validateFightId(fightId)); }
  getPublic(fightId: string): Promise<PublicFightLiveSnapshot> { return this.repository.getPublic(validateFightId(fightId)); }
  updateTimer(fightId: string, action: "start" | "pause" | "resume" | "end_round" | "next_round" | "end_fight"): Promise<FightLiveSnapshot> { return this.repository.updateTimer(validateFightId(fightId), action); }
  recordAction(fightId: string, kind: FightActionKind, corner?: FightCorner): Promise<FightLiveSnapshot> { return this.repository.recordAction(validateFightId(fightId), kind, corner); }
  confirmOfficial(fightId: string, officialId: string): Promise<FightLiveSnapshot> { return this.repository.assignOfficial(validateFightId(fightId), officialId); }
  saveScore(fightId: string, cardId: string, roundNumber: number, red: number, blue: number): Promise<FightLiveSnapshot> { return this.repository.saveRoundScore(validateFightId(fightId), cardId, roundNumber, validateRoundScore(red), validateRoundScore(blue)); }
  submitCard(fightId: string, cardId: string): Promise<FightLiveSnapshot> { return this.repository.submitCard(validateFightId(fightId), cardId); }
  decide(fightId: string, winnerId: string | null, method: FightDecisionMethod): Promise<FightLiveSnapshot> { return this.repository.decide(validateFightId(fightId), winnerId, method); }
  publish(fightId: string): Promise<FightLiveSnapshot> { return this.repository.publish(validateFightId(fightId)); }
}
