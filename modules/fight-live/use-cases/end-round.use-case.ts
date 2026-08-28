import { FightTimerService } from "../services/fight-timer.service"



export interface EndRoundInput {

  roundId: string

  userId?: string

}







export class EndRoundUseCase {



  constructor(

    private readonly fightTimerService:
      FightTimerService

  ) {}







  async execute(

    input: EndRoundInput

  ) {



    if (!input.roundId) {

      throw new Error(
        "Round ID obligatoire"
      )

    }







    return await this.fightTimerService

      .endRound({

        roundId:

          input.roundId,


        userId:

          input.userId

      })



  }



}