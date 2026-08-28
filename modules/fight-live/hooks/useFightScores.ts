"use client"


import {
  useCallback,
  useState
} from "react"


import { FightScoreService } from "../services/fight-score.service"

type ScoreBoardData = Awaited<ReturnType<FightScoreService["getScoreBoardData"]>>



export function useFightScores(
  scoreService: FightScoreService
) {



  const [scoreBoard, setScoreBoard] =

    useState<ScoreBoardData | null>(
      null
    )



  const [loading, setLoading] =

    useState(false)



  const [error, setError] =

    useState<string | null>(
      null
    )







  /**
   * Charger le tableau complet
   */
  const loadScoreBoard =

    useCallback(

      async (
        fightId: string
      ) => {


        try {


          setLoading(true)

          setError(null)



          const data =

            await scoreService
              .getScoreBoardData(
                fightId
              )



          setScoreBoard(
            data
          )



          return data



        }

        catch (err) {


          const message =

            err instanceof Error

              ? err.message

              : "Erreur chargement scores"



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
        scoreService
      ]

    )









  /**
   * Rafraîchir les scores
   */
  const refreshScoreBoard =

    useCallback(

      async (
        fightId: string
      ) => {


        return await loadScoreBoard(
          fightId
        )


      },

      [
        loadScoreBoard
      ]

    )









  /**
   * Nettoyer les données
   */
  const clearScoreBoard =

    useCallback(

      () => {


        setScoreBoard(
          null
        )


        setError(
          null
        )


      },

      []

    )








  return {


    scoreBoard,


    loading,


    error,



    loadScoreBoard,


    refreshScoreBoard,


    clearScoreBoard


  }



}
