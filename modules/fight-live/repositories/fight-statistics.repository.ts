import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/infrastructure/supabase/database.types"
import { normalizeBackendError } from "@/shared/errors/backend-error"

export class FightStatisticsRepository {
  constructor(
    private readonly supabase: SupabaseClient<Database>
  ) {}

  /**
   * Statistiques d'un combat
   */
  async getFightStatistics(
    fightId: string
  ) {

    const { data, error } = await this.supabase
      .from("fight_statistics")
      .select("*")
      .eq("fight_id", fightId)

    if (error) throw normalizeBackendError(error)

    return data
  }


  /**
   * Statistiques d'un combattant
   */
  async getFighterStatistics(
    fighterId: string
  ) {

    const { data, error } = await this.supabase
      .from("fighter_career_stats")
      .select("*")
      .eq("fighter_id", fighterId)
      .single()

    if (error) throw normalizeBackendError(error)

    return data
  }


  /**
   * Historique ELO
   */
  async getEloHistory(
    fighterId: string
  ) {

    const { data, error } = await this.supabase
      .from("elo_history")
      .select("*")
      .eq("fighter_id", fighterId)
      .order("recorded_at", { ascending: false })

    if (error) throw normalizeBackendError(error)

    return data
  }


  /**
   * Recalcul des statistiques
   */
  async updateFightStatistics(fightId: string): Promise<number> {
    const { data, error } = await this.supabase.rpc("update_fight_statistics", {
      p_fight_id: fightId
    })

    if (error) throw normalizeBackendError(error)
    return data
  }


  /**
   * Recalcul carrière
   */
  async updateCareerStatistics(fighterId: string): Promise<void> {
    const { error } = await this.supabase.rpc("update_fighter_career_stats", {
      p_fighter_id: fighterId
    })

    if (error) throw normalizeBackendError(error)
  }


  /**
   * Classement ELO
   */
  async getRanking(
    limit = 100
  ) {

    const { data, error } = await this.supabase
      .from("fighters")
      .select("*")
      .order("elo_rating", {
        ascending: false
      })
      .limit(limit)

    if (error) throw normalizeBackendError(error)

    return data
  }
}
