import { FightEventRepository } from "../repositories/fight-event.repository"
import { FightTimerRepository } from "../repositories/fight-timer.repository"
import { FightJudgeRepository } from "../repositories/fight-judge.repository"
import { FightOfficialRepository } from "../repositories/fight-official.repository"
import { FightStatisticsRepository } from "../repositories/fight-statistics.repository"
import { FightResultRepository } from "../repositories/fight-result.repository"

import { FightTimerService } from "./fight-timer.service"
import { FightJudgeService } from "./fight-judge.service"
import { FightOfficialService } from "./fight-official.service"



export class FightLiveService {

  private readonly timerService: FightTimerService
  private readonly judgeService: FightJudgeService
  private readonly officialService: FightOfficialService


  constructor(
    private readonly eventRepository: FightEventRepository,
    timerRepository: FightTimerRepository,
    judgeRepository: FightJudgeRepository,
    officialRepository: FightOfficialRepository,
    private readonly statisticsRepository: FightStatisticsRepository,
    private readonly resultRepository: FightResultRepository
  ) {

    this.timerService =
      new FightTimerService(
        timerRepository
      )


    this.judgeService =
      new FightJudgeService(
        judgeRepository
      )


    this.officialService =
      new FightOfficialService(
        officialRepository
      )

  }



  async startFight(params: {
    fightId: string
    roundCount: number
    roundDuration: number
    userId?: string
  }) {

    return this.timerService.startFight(params)

  }



  async registerFightEvent(params: {
    fightId: string
    eventType: string
    eventCode: string
    roundNumber?: number
    fighterId?: string
    recordedBy?: string
    payload?: Record<string, unknown>
    source?: string
    operationMode?: string
  }) {

    return this.eventRepository.registerFightEvent(params)

  }



  async pauseRound(params: {
    roundId: string
    eventType: string
    reason?: string
    userId?: string
  }) {

    return this.timerService.pauseRound(params)

  }



  async resumeRound(params: {
    roundId: string
    userId?: string
  }) {

    return this.timerService.resumeRound(params)

  }



  async endRound(params: {
    roundId: string
    userId?: string
  }) {

    return this.timerService.endRound(params)

  }



  async publishDecision(
    fightId: string,
    userId?: string
  ) {

    return this.resultRepository.publishFightResult(
      fightId,
      userId
    )

  }



  async submitJudgeCard(
    judgeCardId: string,
    judgeId: string
  ) {

    return this.judgeService.submitJudgeCard({
      judgeCardId,
      judgeId
    })

  }



  async calculateJudgeDecision(
    fightId: string
  ) {

    return this.judgeService.calculateJudgeDecision(
      fightId
    )

  }



  async calculateFinalDecision(
    fightId: string,
    approvedBy?: string
  ) {

    return this.judgeService.calculateFinalDecision({
      fightId,
      approvedBy
    })

  }



  async recordOfficialAction(params: {
    fightId: string
    roundId: string
    fighterId: string
    actionTypeId: string
    recordedBy?: string
    notes?: string
  }) {

    return this.officialService.recordOfficialAction(params)

  }



  async getStatistics(
    fightId: string
  ) {

    return this.statisticsRepository.getFightStatistics(
      fightId
    )

  }

}