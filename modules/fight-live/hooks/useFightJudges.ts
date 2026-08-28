"use client"

import { useState } from "react"

import { FightJudgeService } from "../services/fight-judge.service"


export function useFightJudges(
  judgeService: FightJudgeService
) {

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)



  async function submitJudgeCard(params: {
    judgeCardId: string
    judgeId: string
  }) {

    try {

      setLoading(true)
      setError(null)


      return await judgeService.submitJudgeCard(
        params
      )


    } catch (err) {

      const message =
        err instanceof Error
          ? err.message
          : "Erreur soumission carte juge"


      setError(message)

      throw err


    } finally {

      setLoading(false)

    }

  }



  async function calculateJudgeDecision(
    fightId: string
  ) {

    try {

      setLoading(true)
      setError(null)


      return await judgeService.calculateJudgeDecision(
        fightId
      )


    } catch (err) {

      const message =
        err instanceof Error
          ? err.message
          : "Erreur calcul décision juge"


      setError(message)

      throw err


    } finally {

      setLoading(false)

    }

  }



  async function calculateFinalDecision(params: {
    fightId: string
    approvedBy?: string
  }) {

    try {

      setLoading(true)
      setError(null)


      return await judgeService.calculateFinalDecision(
        params
      )


    } catch (err) {

      const message =
        err instanceof Error
          ? err.message
          : "Erreur décision finale"


      setError(message)

      throw err


    } finally {

      setLoading(false)

    }

  }



  async function getJudgeCards(
    fightId: string
  ) {

    return await judgeService.getJudgeCards(
      fightId
    )

  }



  async function getRoundScores(
    judgeCardId: string
  ) {

    return await judgeService.getRoundScores(
      judgeCardId
    )

  }



  return {

    loading,
    error,

    submitJudgeCard,
    calculateJudgeDecision,
    calculateFinalDecision,

    getJudgeCards,
    getRoundScores

  }

}
