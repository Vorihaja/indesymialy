import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/infrastructure/supabase/database.types"
import { normalizeBackendError } from "@/shared/errors/backend-error"


export class FightResultRepository {

  constructor(
    private readonly supabase: SupabaseClient<Database>
  ) {}



  /**
   * Publier le résultat officiel d'un combat
   */
  async publishFightResult(
    fightId: string,
    _userId?: string
  ) {

    void _userId

    const { data, error } =
      await this.supabase.rpc(
        "publish_fight_result",
        {
          p_fight_id: fightId,
          p_user: undefined
        }
      )


    if (error) throw normalizeBackendError(error)

    return data

  }

}
