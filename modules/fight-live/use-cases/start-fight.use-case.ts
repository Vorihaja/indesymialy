import { FightTimerService } from "../services/fight-timer.service"



export interface StartFightInput {

  fightId: string

  roundCount: number

  roundDuration: number

  userId?: string

}







export class StartFightUseCase {



  constructor(

    private readonly fightTimerService:
      FightTimerService

  ) {}







  async execute(

    input: StartFightInput

  ) {



    if (!input.fightId) {

      throw new Error(
        "Fight ID obligatoire"
      )

    }





    if (input.roundCount <= 0) {

      throw new Error(
        "Nombre de rounds invalide"
      )

    }





    if (input.roundDuration <= 0) {

      throw new Error(
        "Durée du round invalide"
      )

    }







    return await this.fightTimerService

      .startFight({

        fightId:

          input.fightId,


        roundCount:

          input.roundCount,


        roundDuration:

          input.roundDuration,


        userId:

          input.userId

      })



  }



}