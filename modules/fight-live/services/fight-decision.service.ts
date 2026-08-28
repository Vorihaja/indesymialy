import { ScoringEngineService, type ScoringSystem } from "./scoring-engine.service"
import {
  ScoringRuleService
} from "./scoring-rule.service"



export interface FightDecisionResult {

  fightId: string

  winnerId: string | null

  result:
    | "WIN"
    | "DRAW"
    | "NO_CONTEST"


  method:
    | "DECISION"
    | "POINTS"
    | "SUBMISSION"
    | "DISQUALIFICATION"
    | "UNKNOWN"


  scoringSystem: string | null

}







export class FightDecisionService {



  constructor(

    private readonly scoringRuleService:
      ScoringRuleService,


    private readonly scoringEngineService:
      ScoringEngineService


  ) {}









  /**
   * Calculer la décision officielle d'un combat
   */
  async calculateDecision(

    params: {

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

  ): Promise<FightDecisionResult> {



    if (!params.fightId) {

      throw new Error(
        "Fight ID obligatoire"
      )

    }



    if (!params.disciplineId) {

      throw new Error(
        "Discipline ID obligatoire"
      )

    }







    const rules =

      await this.scoringRuleService

        .getCompleteRules(

          params.disciplineId

        )







    if (!rules.scoringSystem) {

      throw new Error(

        "Aucun système de scoring configuré"

      )

    }








    const supportedSystems: ScoringSystem[] = ["POINTS", "10_POINT_MUST", "SUBMISSION", "CUSTOM"]
    const scoringSystem = supportedSystems.includes(rules.scoringSystem.code as ScoringSystem)
      ? rules.scoringSystem.code as ScoringSystem
      : "CUSTOM"

    const decision =

      this.scoringEngineService

        .calculateDecision({

          scoringSystem:

            scoringSystem,


          roundScores:

            params.roundScores,


          judgeCards:

            params.judgeCards


        })










    return {


      fightId:

        params.fightId,



      winnerId:

        decision.winnerId,



      result:

        decision.result,



      method:

        decision.method,



      scoringSystem:

        rules.scoringSystem.code



    }



  }









  /**
   * Vérifier si le combat est terminé
   */
  async canPublishDecision(

    disciplineId: string

  ) {



    const rules =

      await this.scoringRuleService

        .getCompleteRules(

          disciplineId

        )





    return Boolean(

      rules.scoringSystem

    )



  }







}
