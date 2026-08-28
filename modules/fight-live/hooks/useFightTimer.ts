"use client"

import { useState } from "react"

import { FightTimerService } from "../services/fight-timer.service"


export function useFightTimer(
  timerService: FightTimerService
) {

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)



  async function startFight(params: {
    fightId: string
    roundCount: number
    roundDuration: number
    userId?: string
  }) {

    try {

      setLoading(true)
      setError(null)

      return await timerService.startFight(
        params
      )

    } catch (err) {

      const message =
        err instanceof Error
          ? err.message
          : "Erreur démarrage combat"

      setError(message)

      throw err

    } finally {

      setLoading(false)

    }

  }



  async function pauseRound(params: {
    roundId: string
    eventType: string
    reason?: string
    userId?: string
  }) {

    try {

      setLoading(true)
      setError(null)

      return await timerService.pauseRound(
        params
      )

    } finally {

      setLoading(false)

    }

  }



  async function resumeRound(params: {
    roundId: string
    userId?: string
  }) {

    try {

      setLoading(true)
      setError(null)

      return await timerService.resumeRound(
        params
      )

    } finally {

      setLoading(false)

    }

  }



  async function endRound(params: {
    roundId: string
    userId?: string
  }) {

    try {

      setLoading(true)
      setError(null)

      return await timerService.endRound(
        params
      )

    } finally {

      setLoading(false)

    }

  }



  async function getRemainingTime(
    roundId: string
  ) {

    return await timerService.getRemainingTime(
      roundId
    )

  }



  async function getTimerEvents(
    fightId: string
  ) {

    return await timerService.getTimerEvents(
      fightId
    )

  }



  async function syncTimerToTimeline() {

    return await timerService.syncTimerToTimeline()

  }



  return {

    loading,
    error,

    startFight,
    pauseRound,
    resumeRound,
    endRound,

    getRemainingTime,
    getTimerEvents,
    syncTimerToTimeline

  }

}
