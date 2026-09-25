import { FightTimerRepository } from "../repositories/fight-timer.repository"


export class FightTimerService {

  constructor(
    private readonly timerRepository: FightTimerRepository
  ) {}


  /**
   * Démarrer un combat
   */
  async startFight(params: {
    fightId: string
    roundCount: number
    roundDuration: number
    userId?: string
  }) {

    if (!params.fightId) {
      throw new Error("Fight ID obligatoire")
    }

    if (params.roundCount <= 0) {
      throw new Error("Nombre de rounds invalide")
    }

    if (params.roundDuration <= 0) {
      throw new Error("Durée de round invalide")
    }


    return await this.timerRepository.startFight(
      params
    )

  }



  /**
   * Mettre un round en pause
   */
  async pauseRound(params: {
    roundId: string
    eventType: string
    reason?: string
    userId?: string
  }) {

    if (!params.roundId) {
      throw new Error("Round ID obligatoire")
    }


    return await this.timerRepository.pauseRound(
      params
    )

  }



  /**
   * Reprendre un round
   */
  async resumeRound(params: {
    roundId: string
    userId?: string
  }) {

    if (!params.roundId) {
      throw new Error("Round ID obligatoire")
    }


    return await this.timerRepository.resumeRound(
      params
    )

  }



  /**
   * Terminer un round
   */
  async endRound(params: {
    roundId: string
    userId?: string
  }) {

    if (!params.roundId) {
      throw new Error("Round ID obligatoire")
    }


    return await this.timerRepository.endRound(
      params
    )

  }



  /**
   * Temps restant du round
   */
  async getRemainingTime(
    roundId: string
  ) {

    if (!roundId) {
      throw new Error("Round ID obligatoire")
    }


    return await this.timerRepository.getRemainingTime(
      roundId
    )

  }



  /**
   * Historique des événements chrono
   */
  async getTimerEvents(
    fightId: string
  ) {

    if (!fightId) {
      throw new Error("Fight ID obligatoire")
    }


    return await this.timerRepository.getTimerEvents(
      fightId
    )

  }



  /**
   * Synchronisation chrono → timeline
   */
  async syncTimerToTimeline(fightId: string) {

    if (!fightId) {
      throw new Error("Fight ID obligatoire")
    }

    return await this.timerRepository.syncTimerToTimeline(fightId)

  }

}
