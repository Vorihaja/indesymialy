import { FightDecisionService } from "../services/fight-decision.service"



export interface CalculateDecisionInput {


  fightId: string


  disciplineId: string



  roundScores: Array<{

    fighterId: string

    score: number

    roundNumber: number

  }>



  judgeCards: Array<{

    judgeId: string

    fighterId: string

    totalScore: number

    winner?: boolean

  }>



}







export class CalculateDecisionUseCase {



  constructor(

    private readonly fightDecisionService:
      FightDecisionService

  ) {}







  async execute(

    input: CalculateDecisionInput

  ) {



    if (!input.fightId) {

      throw new Error(
        "Fight ID obligatoire"
      )

    }





    if (!input.disciplineId) {

      throw new Error(
        "Discipline ID obligatoire"
      )

    }





    if (!input.judgeCards?.length) {

      throw new Error(
        "Aucune carte juge disponible"
      )

    }







    return await this.fightDecisionService

      .calculateDecision({

        fightId:

          input.fightId,


        disciplineId:

          input.disciplineId,


        roundScores:

          input.roundScores,


        judgeCards:

          input.judgeCards

      })



  }



}