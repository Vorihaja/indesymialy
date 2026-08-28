"use client"


import {
  useCallback,
  useState
} from "react"

import { FightLiveContextService } from "../services/fight-live-context.service"

type FightContextData = Awaited<ReturnType<FightLiveContextService["getFightContext"]>>



export function useFightContext(
  fightContextService: FightLiveContextService
) {


  const [fightContext, setFightContext] =
    useState<FightContextData | null>(null)


  const [loading, setLoading] =
    useState(false)


  const [error, setError] =
    useState<string | null>(null)




  /**
   * Charger les informations du combat
   */
  const loadFightContext =
    useCallback(
      async (
        fightId: string
      ) => {


        try {


          setLoading(true)

          setError(null)



          const data =

            await fightContextService
              .getFightContext(
                fightId
              )



          setFightContext(
            data
          )



          return data



        }

        catch (err) {


          const message =

            err instanceof Error

              ? err.message

              : "Erreur chargement contexte combat"



          setError(
            message
          )



          throw err


        }


        finally {


          setLoading(false)


        }


      },

      [
        fightContextService
      ]

    )





  /**
   * Réinitialiser le contexte
   */
  const clearFightContext =

    useCallback(
      () => {

        setFightContext(
          null
        )

        setError(
          null
        )

      },

      []

    )





  return {


    fightContext,

    loading,

    error,


    loadFightContext,

    clearFightContext


  }


}
