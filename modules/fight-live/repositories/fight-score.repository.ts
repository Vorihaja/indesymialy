import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/infrastructure/supabase/database.types"
import { normalizeBackendError } from "@/shared/errors/backend-error"

export class FightScoreRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async getFightScore(fightId: string) {
    const [{ data: fight, error: fightError }, { data: scores, error: scoreError }] = await Promise.all([
      this.supabase.from("fights").select("id, fighter_red_id, fighter_blue_id, status, updated_at").eq("id", fightId).single(),
      this.supabase.from("fight_scores").select("fighter_id, points").eq("fight_id", fightId),
    ])
    if (fightError) throw normalizeBackendError(fightError)
    if (scoreError) throw normalizeBackendError(scoreError)
    const total = (fighterId: string | null) => (scores ?? []).filter((score) => score.fighter_id === fighterId).reduce((sum, score) => sum + score.points, 0)
    return { id: fight.id, fight_id: fight.id, red_score: total(fight.fighter_red_id), blue_score: total(fight.fighter_blue_id), current_round: 0, status: fight.status, updated_at: fight.updated_at }
  }

  async getRoundScores(fightId: string) {
    const { data, error } = await this.supabase.from("fight_scores").select("id, fight_id, round_id, fighter_id, recorded_by, points, recorded_at").eq("fight_id", fightId).order("recorded_at")
    if (error) throw normalizeBackendError(error)
    return (data ?? []).map((score) => ({ ...score, round_number: 0, judge_id: score.recorded_by, score: score.points, created_at: score.recorded_at }))
  }

  async getJudgeCards(fightId: string) {
    const { data, error } = await this.supabase.from("fight_judge_cards").select("id, fight_id, judge_id, fighter_red_score, fighter_blue_score, card_status, created_at").eq("fight_id", fightId).order("created_at")
    if (error) throw normalizeBackendError(error)
    return (data ?? []).map((card) => ({ ...card, winner: (card.fighter_red_score ?? 0) === (card.fighter_blue_score ?? 0) ? null : (card.fighter_red_score ?? 0) > (card.fighter_blue_score ?? 0) ? "red" : "blue", total_score: (card.fighter_red_score ?? 0) + (card.fighter_blue_score ?? 0), approved: card.card_status === "submitted" || card.card_status === "locked" }))
  }

  async getPenalties(fightId: string) {
    const { data, error } = await this.supabase.from("fight_penalties").select("id, fight_id, fighter_id, penalty_type, points_deducted, reason, issued_at").eq("fight_id", fightId).order("issued_at")
    if (error) throw normalizeBackendError(error)
    return (data ?? []).map((penalty) => ({ ...penalty, points: penalty.points_deducted ?? 0, created_at: penalty.issued_at }))
  }

  private async getActions(fightId: string, actionType: string) {
    const { data, error } = await this.supabase.from("fight_live_actions").select("id, fight_id, fighter_id, action_type, round_number, recorded_at").eq("fight_id", fightId).eq("action_type", actionType).order("recorded_at")
    if (error) throw normalizeBackendError(error)
    return data ?? []
  }

  async getWarnings(fightId: string) {
    const actions = await this.getActions(fightId, "warning")
    return actions.map((action) => ({ ...action, warning_type: action.action_type, reason: null, created_at: action.recorded_at }))
  }

  async getKnockdowns(fightId: string) {
    const actions = await this.getActions(fightId, "knockdown")
    return actions.map((action) => ({ ...action, created_at: action.recorded_at }))
  }

  async getScoreBoardData(fightId: string) {
    const [score, rounds, cards, penalties, warnings, knockdowns] = await Promise.all([this.getFightScore(fightId), this.getRoundScores(fightId), this.getJudgeCards(fightId), this.getPenalties(fightId), this.getWarnings(fightId), this.getKnockdowns(fightId)])
    return { score, rounds, cards, penalties, warnings, knockdowns }
  }
}
