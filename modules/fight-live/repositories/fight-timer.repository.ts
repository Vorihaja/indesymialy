import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/infrastructure/supabase/database.types"
import { normalizeBackendError, storageNotImplemented } from "@/shared/errors/backend-error"

export class FightTimerRepository {
  constructor(
    private readonly supabase: SupabaseClient<Database>
  ) {}


  /**
   * Démarrer un combat
   */
  async startFight(params: {
    fightId: string
    roundCount: number
    roundDuration: number
    userId?: string
  }) {

    const { data, error } = await this.supabase
      .rpc(
        "start_fight",
        {
          p_fight_id: params.fightId,
          p_round_count: params.roundCount,
          p_round_duration: params.roundDuration,
          p_user: params.userId ?? undefined
        }
      )


    if (error) throw normalizeBackendError(error)

    return data
  }


  /**
   * Mettre le round en pause
   */
  async pauseRound(params: {
    roundId: string
    eventType: string
    reason?: string
    userId?: string
  }) {

    const { data, error } = await this.supabase
      .rpc(
        "pause_round_timer",
        {
          p_round_id: params.roundId,
          p_event_type: params.eventType,
          p_reason: params.reason ?? undefined,
          p_user: params.userId ?? undefined
        }
      )


    if (error) throw normalizeBackendError(error)

    return data
  }


  /**
   * Reprendre le round
   */
  async resumeRound(params: {
    roundId: string
    userId?: string
  }) {

    const { data, error } = await this.supabase
      .rpc(
        "resume_round_timer",
        {
          p_round_id: params.roundId,
          p_user: params.userId ?? undefined
        }
      )


    if (error) throw normalizeBackendError(error)

    return data
  }


  /**
   * Terminer un round
   */
  async endRound(params: {
    roundId: string
    userId?: string
  }) {

    const { data, error } = await this.supabase
      .rpc(
        "end_round_timer",
        {
          p_round_id: params.roundId,
          p_user: params.userId ?? undefined
        }
      )


    if (error) throw normalizeBackendError(error)

    return data
  }


  /**
   * Obtenir le temps restant
   */
  async getRemainingTime(
    roundId: string
  ) {

    const { data, error } = await this.supabase
      .rpc(
        "get_round_remaining_time",
        {
          p_round_id: roundId
        }
      )


    if (error) throw normalizeBackendError(error)

    return data
  }


  /**
   * Historique du chrono
   */
  async getTimerEvents(
    fightId: string
  ) {

    const { data, error } = await this.supabase
      .from("fight_timer_events")
      .select("*")
      .eq("fight_id", fightId)
      .order("created_at")


    if (error) throw normalizeBackendError(error)

    return data
  }


  /**
   * Synchronisation timeline
   */
  async syncTimerToTimeline(): Promise<never> {
    throw storageNotImplemented("synchronisation du timer vers la timeline")
  }
}
