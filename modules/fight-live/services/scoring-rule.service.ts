import { ScoringRuleRepository } from "../repositories/scoring-rule.repository"



export interface DisciplineScoringRules {


  scoringSystem: {

    id: string

    code: string

    name: string

    config?: Record<string, unknown>

  } | null



  rules: Array<{

    id: string

    ruleType: string

    value: unknown

    description?: string

  }>



  actions: Array<{

    id: string

    code: string

    name: string

    points?: number

    metadata?: Record<string, unknown>

  }>



  penalties: Array<{

    id: string

    code: string

    name: string

    value?: number

  }>



  winMethods: Array<{

    id: string

    code: string

    name: string

  }>


}







export class ScoringRuleService {



  constructor(

    private readonly scoringRuleRepository: ScoringRuleRepository

  ) {}







  /**
   * Charger toutes les règles d'une discipline
   */
  async getCompleteRules(

    disciplineId: string

  ): Promise<DisciplineScoringRules> {



    if (!disciplineId) {

      throw new Error(

        "Discipline ID obligatoire"

      )

    }





    const rules =

      await this.scoringRuleRepository

        .getCompleteRules(

          disciplineId

        )







    return {


      scoringSystem:

        rules.scoringSystem

          ? {

              id:

                rules.scoringSystem.id,


              code:

                rules.scoringSystem.code,


              name:

                rules.scoringSystem.name,


              config:

                rules.scoringSystem.config

            }


          : null,





      rules:

        rules.rules?.map(

          rule => ({

            id:

              rule.id,


            ruleType:

              rule.rule_type,


            value:

              rule.value,


            description:

              rule.description


          })

        )

        ?? [],





      actions:

        rules.actions?.map(

          action => ({

            id:

              action.id,


            code:

              action.code,


            name:

              action.name,


            points:

              action.points,


            metadata:

              action.metadata


          })

        )

        ?? [],





      penalties:

        rules.penalties?.map(

          penalty => ({

            id:

              penalty.id,


            code:

              penalty.code,


            name:

              penalty.name,


            value:

              penalty.value


          })

        )

        ?? [],





      winMethods:

        rules.winMethods?.map(

          method => ({

            id:

              method.id,


            code:

              method.code,


            name:

              method.name


          })

        )

        ?? []



    }


  }







  /**
   * Récupérer uniquement le système de scoring
   */
  async getScoringSystem(

    disciplineId: string

  ) {



    const rules =

      await this.getCompleteRules(

        disciplineId

      )



    return rules.scoringSystem


  }







  /**
   * Vérifier si une discipline utilise un système connu
   */
  async validateScoringSystem(

    disciplineId: string

  ) {



    const system =

      await this.getScoringSystem(

        disciplineId

      )





    if (!system) {


      throw new Error(

        "Aucun système de scoring configuré pour cette discipline"

      )


    }





    return true


  }





}