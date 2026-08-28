import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/infrastructure/supabase/database.types"
import { normalizeBackendError } from "@/shared/errors/backend-error"


export class FightJudgeRepository {

  constructor(
    private readonly supabase: SupabaseClient<Database>
  ) {}



  /**
   * Soumission carte juge
   */
  async submitJudgeCard(params: {
    judgeCardId: string
    judgeId: string
  }) {

    const { data, error } = await this.supabase
      .rpc(
        "submit_judge_card",
        {
          p_judge_card_id: params.judgeCardId,
          p_judge_id: params.judgeId
        }
      )


    if (error) throw normalizeBackendError(error)

    return data

  }



  /**
   * Calcul décision juge
   */
  async calculateJudgeDecision(
    fightId: string
  ) {

    const { data, error } = await this.supabase
      .rpc(
        "calculate_judge_decision",
        {
          p_fight_id: fightId
        }
      )


    if (error) throw normalizeBackendError(error)

    return data

  }



  /**
   * Calcul décision finale
   */
  async calculateFinalDecision(params: {
    fightId: string
    approvedBy?: string
  }) {

    const { data, error } = await this.supabase
      .rpc(
        "calculate_final_decision",
        {
          p_fight_id: params.fightId,
          p_approved_by: params.approvedBy ?? undefined
        }
      )


    if (error) throw normalizeBackendError(error)

    return data

  }



  /**
   * Cartes des juges
   */
  async getJudgeCards(
    fightId: string
  ) {

    const { data, error } = await this.supabase
      .from("fight_judge_cards")
      .select("*")
      .eq(
        "fight_id",
        fightId
      )
      .order(
        "created_at",
        {
          ascending: true
        }
      )


    if (error) throw normalizeBackendError(error)

    return data

  }



  /**
   * Scores par round
   */
  async getRoundScores(
    judgeCardId: string
  ) {

    const { data, error } = await this.supabase
      .from("fight_judge_round_scores")
      .select("*")
      .eq(
        "judge_card_id",
        judgeCardId
      )
      .order(
        "round_number",
        {
          ascending: true
        }
      )


    if (error) throw normalizeBackendError(error)

    return data

  }


}
