import { FightJudgeService } from "../services/fight-judge.service"



export interface SubmitJudgeCardInput {

  judgeCardId: string

  judgeId: string

}







export class SubmitJudgeCardUseCase {



  constructor(

    private readonly fightJudgeService:
      FightJudgeService

  ) {}







  async execute(

    input: SubmitJudgeCardInput

  ) {



    if (!input.judgeCardId) {

      throw new Error(
        "Carte juge obligatoire"
      )

    }





    if (!input.judgeId) {

      throw new Error(
        "Juge obligatoire"
      )

    }







    return await this.fightJudgeService

      .submitJudgeCard({

        judgeCardId:

          input.judgeCardId,


        judgeId:

          input.judgeId

      })



  }



}