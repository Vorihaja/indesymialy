import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/infrastructure/supabase/database.types"
import { normalizeBackendError } from "@/shared/errors/backend-error"


export class FightOfficialRepository {

  constructor(
    private readonly supabase: SupabaseClient<Database>
  ) {}



  /**
   * Enregistrer une action officielle
   */
  async recordOfficialAction(params: {
    fightId: string
    roundId: string
    fighterId: string
    actionTypeId: string
    recordedBy?: string
    notes?: string
  }) {


    const { data, error } = await this.supabase
      .rpc(
        "record_official_action",
        {
          p_fight_id: params.fightId,
          p_round_id: params.roundId,
          p_fighter_id: params.fighterId,
          p_action_type_id: params.actionTypeId,
          p_recorded_by: params.recordedBy ?? undefined,
          p_notes: params.notes ?? undefined
        }
      )


    if (error) throw normalizeBackendError(error)


    return data

  }



  /**
   * Récupérer les officiels assignés à un combat
   */
  async getOfficials(
    fightId: string
  ) {


    const { data, error } = await this.supabase
      .from("fight_officials")
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
   * Assigner un officiel à un combat
   */
  async assignOfficial(params: {
    fightId: string
    officialId: string
    role: string
    notes?: string
  }) {


    const { data, error } = await this.supabase
      .from("fight_officials")
      .insert(
        {
          fight_id: params.fightId,
          official_id: params.officialId,
          role: params.role,
          notes: params.notes ?? undefined
        }
      )
      .select()
      .single()


    if (error) throw normalizeBackendError(error)


    return data

  }


}
