export type ScoringSystem =

  | "POINTS"
  | "10_POINT_MUST"
  | "SUBMISSION"
  | "CUSTOM"



export interface RoundScore {

  fighterId: string

  score: number

  roundNumber: number

}



export interface JudgeCard {

  judgeId: string

  fighterId: string

  totalScore: number

  winner?: boolean

}



export interface DecisionResult {

  winnerId: string | null

  result: "WIN" | "DRAW" | "NO_CONTEST"

  method:

    | "DECISION"

    | "POINTS"

    | "SUBMISSION"

    | "DISQUALIFICATION"

    | "UNKNOWN"

}







export class ScoringEngineService {





  /**
   * Calcul décision finale
   */
  calculateDecision(params: {

    scoringSystem: ScoringSystem

    roundScores: RoundScore[]

    judgeCards: JudgeCard[]

  }): DecisionResult {



    switch (

      params.scoringSystem

    ) {



      case "10_POINT_MUST":

        return this.calculateTenPointMust(

          params.judgeCards

        )





      case "POINTS":

        return this.calculatePoints(

          params.roundScores

        )





      case "SUBMISSION":

        return {

          winnerId: null,

          result: "NO_CONTEST",

          method: "SUBMISSION"

        }





      case "CUSTOM":

        return {

          winnerId: null,

          result: "NO_CONTEST",

          method: "UNKNOWN"

        }





      default:

        return {

          winnerId: null,

          result: "NO_CONTEST",

          method: "UNKNOWN"

        }

    }

  }









  /**
   * Système 10 Point Must
   */
  private calculateTenPointMust(

    cards: JudgeCard[]

  ): DecisionResult {



    const fighterVotes =

      new Map<string, number>()





    cards.forEach(

      card => {



        if (!card.winner) {

          return

        }



        const current =

          fighterVotes.get(

            card.fighterId

          )

          ?? 0





        fighterVotes.set(

          card.fighterId,

          current + 1

        )



      }

    )





    let winnerId: string | null = null

    let maxVotes = 0





    fighterVotes.forEach(

      (

        votes,

        fighterId

      ) => {



        if (votes > maxVotes) {


          maxVotes = votes

          winnerId = fighterId


        }


      }

    )





    if (!winnerId) {


      return {

        winnerId: null,

        result: "DRAW",

        method: "DECISION"

      }


    }






    return {


      winnerId,


      result: "WIN",


      method: "DECISION"


    }


  }









  /**
   * Système à points
   */
  private calculatePoints(

    scores: RoundScore[]

  ): DecisionResult {



    const totals =

      new Map<string, number>()




    scores.forEach(

      score => {



        const current =

          totals.get(

            score.fighterId

          )

          ?? 0





        totals.set(

          score.fighterId,

          current + score.score

        )


      }

    )





    let winnerId: string | null = null

    let highest = 0





    totals.forEach(

      (

        total,

        fighterId

      ) => {



        if (total > highest) {


          highest = total

          winnerId = fighterId


        }


      }

    )





    if (!winnerId) {


      return {

        winnerId: null,

        result: "DRAW",

        method: "POINTS"

      }


    }





    return {


      winnerId,


      result: "WIN",


      method: "POINTS"


    }


  }






}