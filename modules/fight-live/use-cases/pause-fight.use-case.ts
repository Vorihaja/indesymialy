import { FightTimerService } from "../services/fight-timer.service"



export interface PauseFightInput {

  roundId: string

  eventType: string

  reason?: string

  userId?: string

}







export class PauseFightUseCase {



  constructor(

    private readonly fightTimerService:
      FightTimerService

  ) {}







  async execute(

    input: PauseFightInput

  ) {



    if (!input.roundId) {

      throw new Error(
        "Round ID obligatoire"
      )

    }





    if (!input.eventType) {

      throw new Error(
        "Type événement obligatoire"
      )

    }







    return await this.fightTimerService

      .pauseRound({

        roundId:

          input.roundId,


        eventType:

          input.eventType,


        reason:

          input.reason,


        userId:

          input.userId

      })



  }



}