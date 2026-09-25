import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database, Json } from "@/infrastructure/supabase/database.types"
import { normalizeBackendError } from "@/shared/errors/backend-error"

export class FightEventRepository {
  constructor(
    private readonly supabase: SupabaseClient<Database>
  ) {}


  /**
   * Enregistrer un événement officiel du combat
   */
  async registerFightEvent(params: {
    fightId: string
    eventType: string
    eventCode: string
    roundNumber?: number
    fighterId?: string
    recordedBy?: string
    payload?: Record<string, unknown>
    source?: string
    operationMode?: string
  }) {

    const payload = JSON.parse(JSON.stringify(params.payload ?? {})) as Json
    const { data, error } = await this.supabase
      .rpc(
        "register_fight_event",
        {
          p_fight_id: params.fightId,
          p_event_type: params.eventType,
          p_event_code: params.eventCode,
          p_round_number: params.roundNumber ?? undefined,
          p_fighter_id: params.fighterId ?? undefined,
          p_recorded_by: undefined,
          p_payload: payload,
          p_source: params.source ?? "OFFICIAL",
          p_operation_mode:
            params.operationMode ?? "ONLINE"
        }
      )


    if (error) throw normalizeBackendError(error)

    return data
  }


  /**
   * Récupérer le journal complet du combat
   */
  async getFightEventLog(
    fightId: string
  ) {

    const { data, error } = await this.supabase
      .from("fight_event_log")
      .select("*")
      .eq("fight_id", fightId)
      .order("sequence_number")


    if (error) throw normalizeBackendError(error)

    return data
  }


  /**
   * Charger la timeline officielle
   */
  async getFightTimeline(
    fightId: string
  ) {

    const { data, error } = await this.supabase
      .from("fight_events_timeline")
      .select("*")
      .eq("fight_id", fightId)
      .order("created_at")


    if (error) throw normalizeBackendError(error)

    return data
  }


  /**
   * Charger les actions live
   */
  async getLiveActions(
    fightId: string
  ) {

    const { data, error } = await this.supabase
      .from("fight_live_actions")
      .select("*")
      .eq("fight_id", fightId)
      .order("recorded_at")


    if (error) throw normalizeBackendError(error)

    return data
  }


  /**
   * Charger les incidents
   */
  async getIncidents(
    fightId: string
  ) {

    const { data, error } = await this.supabase
      .from("fight_incidents")
      .select("*")
      .eq("fight_id", fightId)
      .order("detected_at")


    if (error) throw normalizeBackendError(error)

    return data
  }


  /**
   * Récupérer les types d'événements disponibles
   */
  async getEventTypes() {

    const { data, error } = await this.supabase
      .from("fight_event_types")
      .select("*")
      .eq("is_active", true)
      .order("name")


    if (error) throw normalizeBackendError(error)

    return data
  }


  /**
   * Récupérer les actions configurées
   */
  async getEventActions() {

    const { data, error } = await this.supabase
      .from("fight_event_actions")
      .select("*")


    if (error) throw normalizeBackendError(error)

    return data
  }
}
