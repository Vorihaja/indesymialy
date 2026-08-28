import { FightJudgeRepository } from "../repositories/fight-judge.repository"


export class FightJudgeService {

  constructor(
    private readonly judgeRepository: FightJudgeRepository
  ) {}



  /**
   * Soumettre une carte de juge
   */
  async submitJudgeCard(params: {
    judgeCardId: string
    judgeId: string
  }) {

    if (!params.judgeCardId) {
      throw new Error("Carte juge obligatoire")
    }

    if (!params.judgeId) {
      throw new Error("Juge obligatoire")
    }


    return await this.judgeRepository.submitJudgeCard(
      params
    )

  }



  /**
   * Calcul de décision basée sur les cartes
   */
  async calculateJudgeDecision(
    fightId: string
  ) {

    if (!fightId) {
      throw new Error("Fight ID obligatoire")
    }


    return await this.judgeRepository.calculateJudgeDecision(
      fightId
    )

  }



  /**
   * Décision finale officielle
   */
  async calculateFinalDecision(params: {
    fightId: string
    approvedBy?: string
  }) {

    if (!params.fightId) {
      throw new Error("Fight ID obligatoire")
    }


    return await this.judgeRepository.calculateFinalDecision(
      params
    )

  }



  /**
   * Récupération des cartes d'un combat
   */
  async getJudgeCards(
    fightId: string
  ) {

    if (!fightId) {
      throw new Error("Fight ID obligatoire")
    }


    return await this.judgeRepository.getJudgeCards(
      fightId
    )

  }



  /**
   * Récupération des scores par round
   */
  async getRoundScores(
    judgeCardId: string
  ) {

    if (!judgeCardId) {
      throw new Error("Judge card ID obligatoire")
    }


    return await this.judgeRepository.getRoundScores(
      judgeCardId
    )

  }

}