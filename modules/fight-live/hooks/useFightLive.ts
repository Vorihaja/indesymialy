// modules/fight-live/hooks/useFightLive.ts

import { StartFightUseCase } from "../use-cases/start-fight.use-case"
import { RegisterFightEventUseCase } from "../use-cases/register-fight-event.use-case"
import { PauseFightUseCase } from "../use-cases/pause-fight.use-case"
import { ResumeFightUseCase } from "../use-cases/resume-fight.use-case"
import { EndRoundUseCase } from "../use-cases/end-round.use-case"
import { SubmitJudgeCardUseCase } from "../use-cases/submit-judge-card.use-case"
import { CalculateDecisionUseCase } from "../use-cases/calculate-decision.use-case"
import { PublishResultUseCase } from "../use-cases/publish-result.use-case"



interface FightLiveUseCases {

  startFightUseCase:
    StartFightUseCase

  registerFightEventUseCase:
    RegisterFightEventUseCase

  pauseFightUseCase:
    PauseFightUseCase

  resumeFightUseCase:
    ResumeFightUseCase

  endRoundUseCase:
    EndRoundUseCase

  submitJudgeCardUseCase:
    SubmitJudgeCardUseCase

  calculateDecisionUseCase:
    CalculateDecisionUseCase

  publishResultUseCase:
    PublishResultUseCase

}





interface RoundScore {

  fighterId: string

  score: number

  roundNumber: number

}





interface JudgeCard {

  judgeId: string

  fighterId: string

  score: number

  totalScore: number

  roundNumber?: number

  winner?: boolean

}





export function useFightLive(
  useCases: FightLiveUseCases
) {



  async function startFight(params: {

    fightId: string

    roundCount: number

    roundDuration: number

    userId?: string

  }) {

    return useCases
      .startFightUseCase
      .execute(
        params
      )

  }





  async function registerFightEvent(params: {

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

    return useCases
      .registerFightEventUseCase
      .execute(
        params
      )

  }





  async function pauseRound(params: {

    roundId: string

    eventType: string

    reason?: string

    userId?: string

  }) {

    return useCases
      .pauseFightUseCase
      .execute(
        params
      )

  }





  async function resumeRound(params: {

    roundId: string

    userId?: string

  }) {

    return useCases
      .resumeFightUseCase
      .execute(
        params
      )

  }





  async function endRound(params: {

    roundId: string

    userId?: string

  }) {

    return useCases
      .endRoundUseCase
      .execute(
        params
      )

  }





  async function submitJudgeCard(params: {

    judgeCardId: string

    judgeId: string

  }) {

    return useCases
      .submitJudgeCardUseCase
      .execute(
        params
      )

  }





  async function calculateJudgeDecision(params: {

    fightId: string

    disciplineId: string

    roundScores: RoundScore[]

    judgeCards: JudgeCard[]

  }) {

    const formattedParams = {
      ...params,
      judgeCards: params.judgeCards.map((card) => ({
        judgeId: card.judgeId,
        fighterId: card.fighterId,
        totalScore: card.totalScore ?? card.score,
        winner: card.winner,
      })),
    }

    return useCases
      .calculateDecisionUseCase
      .execute(
        formattedParams
      )

  }





  async function publishDecision(params: {

    fightId: string

  }) {

    return useCases
      .publishResultUseCase
      .execute(
        params
      )

  }





  return {

    startFight,

    registerFightEvent,

    pauseRound,

    resumeRound,

    endRound,

    submitJudgeCard,

    calculateJudgeDecision,

    publishDecision

  }

}