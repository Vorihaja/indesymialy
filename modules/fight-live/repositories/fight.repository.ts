import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/infrastructure/supabase/database.types"
import { normalizeBackendError } from "@/shared/errors/backend-error"

export class FightRepository {
  constructor(
    private readonly supabase: SupabaseClient<Database>
  ) {}

  /**
   * Récupérer un combat complet
   */
  async getFight(fightId: string) {
    const { data, error } = await this.supabase
      .from("fights")
      .select("*")
      .eq("id", fightId)
      .single()

    if (error) throw normalizeBackendError(error)

    return data
  }


  /**
   * Récupérer un combat avec les combattants
   */
  async getFightWithFighters(fightId: string) {

    const { data, error } = await this.supabase
      .from("fights")
      .select(`
        *,
        fighter_red:fighters!fights_fighter_red_id_fkey(
          id,
          profile_id
        ),
        fighter_blue:fighters!fights_fighter_blue_id_fkey(
          id,
          profile_id
        )
      `)
      .eq("id", fightId)
      .single()


    if (error) throw normalizeBackendError(error)

    return data
  }


  /**
   * Publier le résultat officiel
   */
  async publishFightResult(
    fightId: string,
    _userId?: string
  ) {

    void _userId

    const { data, error } = await this.supabase
      .rpc(
        "publish_fight_result",
        {
          p_fight_id: fightId,
          p_user: undefined
        }
      )


    if (error) throw normalizeBackendError(error)

    return data
  }


  /**
   * Charger les rounds
   */
  async loadFightRounds(
    fightId: string
  ) {

    const { data, error } = await this.supabase
      .from("fight_rounds")
      .select("*")
      .eq("fight_id", fightId)
      .order("round_number")


    if (error) throw normalizeBackendError(error)

    return data
  }


  /**
   * Charger les officiels
   */
  async loadFightOfficials(
    fightId: string
  ) {

    const { data, error } = await this.supabase
      .from("fight_official_assignments")
      .select("*")
      .eq("fight_id", fightId)


    if (error) throw normalizeBackendError(error)

    return data
  }
}
