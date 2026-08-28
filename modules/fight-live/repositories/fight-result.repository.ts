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
    userId?: string
  ) {

    const { data, error } =
      await this.supabase.rpc(
        "publish_fight_result",
        {
          p_fight_id: fightId,
          p_user: userId ?? undefined
        }
      )


    if (error) throw normalizeBackendError(error)

    return data

  }

}
