import { FightResultRepository } from "../repositories/fight-result.repository"



export class FightResultService {



  constructor(

    private readonly fightResultRepository:
      FightResultRepository

  ) {}







  /**
   * Publier le résultat officiel
   */
  async publishFightResult(

    params: {

      fightId: string

      userId?: string

    }

  ) {



    if (!params.fightId) {

      throw new Error(
        "Fight ID obligatoire"
      )

    }







    return await this.fightResultRepository

      .publishFightResult(

        params.fightId,

        params.userId

      )


  }







  /**
   * Publication après validation officielle
   */
  async approveAndPublish(

    params: {

      fightId: string

      approvedBy: string

    }

  ) {



    if (!params.approvedBy) {

      throw new Error(
        "Validateur obligatoire"
      )

    }







    return await this.publishFightResult({

      fightId:

        params.fightId,


      userId:

        params.approvedBy

    })


  }





}