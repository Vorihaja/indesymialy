import { FightLiveRepository } from "../repositories/fight-live.repository"

interface ContextFighter { id?: string | null; full_name?: string | null; nickname?: string | null; profile_id?: string | null }
interface ContextUser { full_name?: string | null; photo_url?: string | null }
interface ContextOfficial { id?: string | null; role?: string | null; user?: ContextUser | ContextUser[] | null }



export class FightLiveContextService {


  constructor(
    private readonly fightLiveRepository: FightLiveRepository
  ) {}



  async getFightContext(
    fightId: string
  ) {


    if (!fightId) {

      throw new Error(
        "Fight ID obligatoire"
      )

    }



    const rawFight =
      await this.fightLiveRepository
        .getFightContext(
          fightId
        )



    const fight = {

      ...rawFight,


      red_fighter: this.normalizeFighter(
        rawFight.red_fighter
      ),


      blue_fighter: this.normalizeFighter(
        rawFight.blue_fighter
      )

    }





    return {


      id:
        fight.id,



      event: {

        id:
          fight.event?.id ?? null,

        name:
          fight.event?.title ?? null,

        location:
          fight.event?.venue ?? null,

        date:
          fight.event?.created_at ?? null

      },




      discipline: {

        id:
          fight.discipline?.id ?? null,

        name:
          fight.discipline?.name ?? null

      },




      category:
        fight.weight_category ?? null,




      fightType:
        fight.fight_type ?? null,





      fighters: {


        red: {

          id:
            fight.red_fighter?.id ?? null,


          name:
            this.formatFighterName(
              fight.red_fighter
            ),


          nickname:
            fight.red_fighter?.nickname ?? null,


          photo:
            null,


          club:
            null

        },





        blue: {

          id:
            fight.blue_fighter?.id ?? null,


          name:
            this.formatFighterName(
              fight.blue_fighter
            ),


          nickname:
            fight.blue_fighter?.nickname ?? null,


          photo:
            null,


          club:
            null

        }


      },




      officials:

        fight.officials?.map(
          (official: ContextOfficial) => ({

            id:
              official.id,

            role:
              official.role,

            name:
              (Array.isArray(official.user) ? official.user[0]?.full_name : official.user?.full_name) ?? null,

            avatar:
              (Array.isArray(official.user) ? official.user[0]?.photo_url : official.user?.photo_url) ?? null

          })

        ) ?? []

    }

  }





  private normalizeFighter(
    fighter: ContextFighter | null
  ) {


    if (!fighter) {

      return null

    }



    return {

      ...fighter

    }

  }





  private formatFighterName(
    fighter: ContextFighter | null
  ) {


    if (!fighter) {

      return null

    }



    return fighter.full_name ?? null

  }


}
