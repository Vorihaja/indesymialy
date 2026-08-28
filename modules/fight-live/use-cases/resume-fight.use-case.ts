import { FightTimerService } from "../services/fight-timer.service"



export interface ResumeFightInput {

  roundId: string

  userId?: string

}







export class ResumeFightUseCase {



  constructor(

    private readonly fightTimerService:
      FightTimerService

  ) {}







  async execute(

    input: ResumeFightInput

  ) {



    if (!input.roundId) {

      throw new Error(
        "Round ID obligatoire"
      )

    }







    return await this.fightTimerService

      .resumeRound({

        roundId:

          input.roundId,


        userId:

          input.userId

      })



  }



}