"use client"

import { useEffect, useState } from "react"

import { FightLiveRealtimeService } from "../services/fight-live-realtime.service"



export function useFightLiveRealtime(
  fightLiveRealtimeService: FightLiveRealtimeService,
  fightId?: string
) {


  const [events, setEvents] = useState<unknown[]>([])
  const [timerEvent, setTimerEvent] = useState<unknown | null>(null)
  const [scoreEvent, setScoreEvent] = useState<unknown | null>(null)
  const [statusEvent, setStatusEvent] = useState<unknown | null>(null)
  const [resultEvent, setResultEvent] = useState<unknown | null>(null)



  useEffect(() => {

    if (!fightId) {
      return
    }



    const eventChannel =
      fightLiveRealtimeService.subscribeToFightEvents(
        fightId,
        (payload) => {

          setEvents((previous) => [
            ...previous,
            payload
          ])

        }
      )



    const timerChannel =
      fightLiveRealtimeService.subscribeToTimer(
        fightId,
        (payload) => {

          setTimerEvent(
            payload
          )

        }
      )

    const scoreChannel = fightLiveRealtimeService.subscribeToScores(fightId, setScoreEvent)
    const statusChannel = fightLiveRealtimeService.subscribeToStatus(fightId, setStatusEvent)
    const resultChannel = fightLiveRealtimeService.subscribeToResult(fightId, setResultEvent)



    return () => {

      fightLiveRealtimeService.unsubscribe(
        eventChannel
      )

      fightLiveRealtimeService.unsubscribe(
        timerChannel
      )
      void fightLiveRealtimeService.unsubscribe(scoreChannel)
      void fightLiveRealtimeService.unsubscribe(statusChannel)
      void fightLiveRealtimeService.unsubscribe(resultChannel)

    }


  }, [
    fightId,
    fightLiveRealtimeService
  ])




  return {

    events,

    timerEvent,
    scoreEvent,
    statusEvent,
    resultEvent,

    connected: Boolean(fightId)

  }

}
