import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/infrastructure/supabase/database.types"
import { normalizeBackendError } from "@/shared/errors/backend-error"



export class FightLiveRepository {


  constructor(
    private readonly supabase: SupabaseClient<Database>
  ) {}



  /**
   * Récupérer le contexte complet d'un combat live
   */
  async getFightContext(
    fightId: string
  ) {


    const { data, error } =
      await this.supabase

        .from("fights")

        .select(
          `
          *,
          fight_type,
          status,


          event:events!fights_event_id_fkey(
            id,
            title,
            venue,
            created_at
          ),


          discipline:disciplines!fights_discipline_id_fkey(
            id,
            name
          ),



          red_fighter:fighters!fights_fighter_red_id_fkey(
            id,
            full_name,
            nickname,
            profile_id
          ),



          blue_fighter:fighters!fights_fighter_blue_id_fkey(
            id,
            full_name,
            nickname,
            profile_id
          )

          `
        )

        .eq(
          "id",
          fightId
        )

        .single()



    if (error) {

      throw normalizeBackendError(error)

    }

    const { data: assignments, error: assignmentError } = await this.supabase
      .from("fight_official_assignments")
      .select("id,user_id,role,status")
      .eq("fight_id", fightId);

    if (assignmentError) throw normalizeBackendError(assignmentError);

    const profileIds = (assignments ?? []).map((assignment) => assignment.user_id);
    const { data: profiles, error: profileError } = profileIds.length
      ? await this.supabase.from("profiles").select("id,full_name,photo_url").in("id", profileIds)
      : { data: [], error: null };

    if (profileError) throw normalizeBackendError(profileError);
    const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));



    return {

      ...data,

      event:
        Array.isArray(data.event)
          ? data.event[0]
          : data.event,


      discipline:
        Array.isArray(data.discipline)
          ? data.discipline[0]
          : data.discipline,


      red_fighter:
        Array.isArray(data.red_fighter)
          ? data.red_fighter[0]
          : data.red_fighter,


      blue_fighter:
        Array.isArray(data.blue_fighter)
          ? data.blue_fighter[0]
          : data.blue_fighter,

      officials: (assignments ?? []).map((assignment) => ({
        id: assignment.id,
        role: assignment.role,
        status: assignment.status,
        user: profileById.get(assignment.user_id) ?? null,
      }))

    }

  }





  /**
   * Récupérer un combat simple
   */
  async getFight(
    fightId: string
  ) {


    const { data, error } =
      await this.supabase

        .from("fights")

        .select("*")

        .eq(
          "id",
          fightId
        )

        .single()



    if (error) {

      throw normalizeBackendError(error)

    }



    return data

  }





  /**
   * Vérifier existence combat
   */
  async exists(
    fightId: string
  ) {


    const { count, error } =
      await this.supabase

        .from("fights")

        .select(
          "id",
          {
            count: "exact",
            head: true
          }
        )

        .eq(
          "id",
          fightId
        )



    if (error) {

      throw normalizeBackendError(error)

    }



    return Boolean(count)

  }


}
