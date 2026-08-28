"use client"

import { useState } from "react"

import { FightOfficialService } from "../services/fight-official.service"


export function useFightOfficials(
  officialService: FightOfficialService
) {

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)



  async function recordOfficialAction(params: {
    fightId: string
    roundId: string
    fighterId: string
    actionTypeId: string
    recordedBy?: string
    notes?: string
  }) {

    try {

      setLoading(true)
      setError(null)


      return await officialService.recordOfficialAction(
        params
      )


    } catch (err) {

      const message =
        err instanceof Error
          ? err.message
          : "Erreur enregistrement action officielle"


      setError(message)

      throw err


    } finally {

      setLoading(false)

    }

  }



  async function getOfficials(
    fightId: string
  ) {

    try {

      setLoading(true)
      setError(null)


      return await officialService.getOfficials(
        fightId
      )


    } catch (err) {

      const message =
        err instanceof Error
          ? err.message
          : "Erreur récupération officiels"


      setError(message)

      throw err


    } finally {

      setLoading(false)

    }

  }



  return {

    loading,
    error,

    recordOfficialAction,
    getOfficials

  }

}
