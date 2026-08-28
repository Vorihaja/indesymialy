import { FightLiveError } from "../errors";
export function validateFightId(fightId: string): string { const value = fightId.trim(); if (!value) throw new FightLiveError("Fight ID obligatoire", "VALIDATION"); return value; }
export function validateRoundScore(score: number): number { if (!Number.isInteger(score) || score < 0 || score > 10) throw new FightLiveError("Le score doit être un entier entre 0 et 10", "VALIDATION"); return score; }
