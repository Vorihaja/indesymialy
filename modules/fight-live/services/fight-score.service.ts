import { FightScoreRepository } from "../repositories/fight-score.repository"



export class FightScoreService {


  constructor(
    private readonly scoreRepository: FightScoreRepository
  ) {}





  /**
   * Récupérer toutes les données nécessaires
   * au tableau de score live
   */
  async getScoreBoardData(
    fightId: string
  ) {


    this.validateFightId(
      fightId
    )



    const data =

      await this.scoreRepository
        .getScoreBoardData(
          fightId
        )



    return this.normalizeScoreData(
      data
    )

  }







  /**
   * Score général du combat
   */
  async getFightScore(
    fightId: string
  ) {


    this.validateFightId(
      fightId
    )



    return await this.scoreRepository
      .getFightScore(
        fightId
      )

  }







  /**
   * Scores par round
   */
  async getRoundScores(
    fightId: string
  ) {


    this.validateFightId(
      fightId
    )



    return await this.scoreRepository
      .getRoundScores(
        fightId
      )

  }







  /**
   * Cartes des juges
   */
  async getJudgeCards(
    fightId: string
  ) {


    this.validateFightId(
      fightId
    )



    return await this.scoreRepository
      .getJudgeCards(
        fightId
      )

  }







  /**
   * Pénalités
   */
  async getPenalties(
    fightId: string
  ) {


    this.validateFightId(
      fightId
    )



    return await this.scoreRepository
      .getPenalties(
        fightId
      )

  }







  /**
   * Avertissements
   */
  async getWarnings(
    fightId: string
  ) {


    this.validateFightId(
      fightId
    )



    return await this.scoreRepository
      .getWarnings(
        fightId
      )

  }







  /**
   * Knockdowns
   */
  async getKnockdowns(
    fightId: string
  ) {


    this.validateFightId(
      fightId
    )



    return await this.scoreRepository
      .getKnockdowns(
        fightId
      )

  }







  /**
   * Préparation des données pour React
   */
  private normalizeScoreData(
    data: Awaited<ReturnType<FightScoreRepository["getScoreBoardData"]>>
  ) {


    return {


      score:

        data.score ?? {

          red_score: 0,

          blue_score: 0

        },



      rounds:

        data.rounds ?? [],



      cards:

        data.cards ?? [],



      penalties:

        data.penalties ?? [],



      warnings:

        data.warnings ?? [],



      knockdowns:

        data.knockdowns ?? []

    }

  }







  /**
   * Validation métier
   */
  private validateFightId(
    fightId: string
  ) {


    if (!fightId) {

      throw new Error(
        "Fight ID obligatoire"
      )

    }


  }


}
