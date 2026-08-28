"use client"


import { useEffect } from "react"


import { useFightLiveRealtime } from "../hooks/useFightLiveRealtime"
import { useFightContext } from "../hooks/useFightContext"
import { useFightScores } from "../hooks/useFightScores"


import { FightLiveRealtimeService } from "../services/fight-live-realtime.service"
import { FightLiveContextService } from "../services/fight-live-context.service"
import { FightScoreService } from "../services/fight-score.service"


import FightTimerDisplay from "./FightTimerDisplay"
import FightContextPanel from "./FightContextPanel"
import FightScoreBoard from "./FightScoreBoard"





interface FightLiveDashboardProps {


  fightId: string


  realtimeService: FightLiveRealtimeService


  fightContextService: FightLiveContextService


  scoreService: FightScoreService


}







interface FightTimerEvent {


  status?: string


  roundNumber?: number


  remainingSeconds?: number


  elapsedSeconds?: number


}








interface FightEvent {


  event_type?: string


  event_code?: string


  created_at?: string


  [key: string]: unknown


}








export default function FightLiveDashboard(

  {

    fightId,

    realtimeService,

    fightContextService,

    scoreService


  }: FightLiveDashboardProps

) {



  const {


    events,


    timerEvent,


    connected


  } =

    useFightLiveRealtime(

      realtimeService,

      fightId

    )









  const {


    fightContext,

    loading,

    error,

    loadFightContext


  } =

    useFightContext(

      fightContextService

    )









  const {


    scoreBoard,

    loading: scoreLoading,

    error: scoreError,

    loadScoreBoard


  } =

    useFightScores(

      scoreService

    )









  useEffect(

    () => {


      loadFightContext(

        fightId

      )


      loadScoreBoard(

        fightId

      )


    },

    [

      fightId,

      loadFightContext,

      loadScoreBoard

    ]

  )









  const typedTimerEvent =

    timerEvent as FightTimerEvent | null








  const typedEvents =

    events as FightEvent[]








  return (



    <section className="fight-live-dashboard">







      <header className="fight-live-header">



        <div>


          <h1>

            Combat Live

          </h1>



          <p>

            ID : {fightId}

          </p>


        </div>







        <div>


          <strong>


            {

              connected

                ? "🟢 EN DIRECT"

                : "🔴 HORS LIGNE"

            }



          </strong>


        </div>



      </header>









      {

        loading &&

        (

          <p>

            Chargement du combat...

          </p>

        )

      }







      {

        error &&

        (

          <p>

            {error}

          </p>

        )

      }







      {

        scoreLoading &&

        (

          <p>

            Chargement des scores...

          </p>

        )

      }







      {

        scoreError &&

        (

          <p>

            {scoreError}

          </p>

        )

      }









      <FightContextPanel



        fight={

          fightContext

            ?

            {


              eventName:

                fightContext.event?.name,



              discipline:

                fightContext.discipline?.name,



              category:

                fightContext.category,



              fightType:

                fightContext.fightType,



              location:

                fightContext.event?.location,




              redFighter:

                fightContext.fighters?.red,




              blueFighter:

                fightContext.fighters?.blue



            }


            :

            null

        }


      />









      <FightTimerDisplay



        timerEvent={

          typedTimerEvent

        }


      />









      <FightScoreBoard



        redFighter={

          fightContext?.fighters?.red

        }



        blueFighter={

          fightContext?.fighters?.blue

        }



        score={

          {
            red: scoreBoard?.score?.red_score ?? 0,
            blue: scoreBoard?.score?.blue_score ?? 0
          }

        }



        penalties={

          {
            red: scoreBoard?.penalties?.filter(item => item.fighter_id === fightContext?.fighters.red.id).length ?? 0,
            blue: scoreBoard?.penalties?.filter(item => item.fighter_id === fightContext?.fighters.blue.id).length ?? 0
          }

        }



        warnings={

          {
            red: scoreBoard?.warnings?.filter(item => item.fighter_id === fightContext?.fighters.red.id).length ?? 0,
            blue: scoreBoard?.warnings?.filter(item => item.fighter_id === fightContext?.fighters.blue.id).length ?? 0
          }

        }



        knockdowns={

          {
            red: scoreBoard?.knockdowns?.filter(item => item.fighter_id === fightContext?.fighters.red.id).length ?? 0,
            blue: scoreBoard?.knockdowns?.filter(item => item.fighter_id === fightContext?.fighters.blue.id).length ?? 0
          }

        }



        roundNumber={

          scoreBoard?.score?.current_round

        }



      />









      <section className="fight-events-panel">



        <h2>

          Timeline officielle

        </h2>







        {


          typedEvents.length === 0


            ?


            (

              <p>

                Aucun événement enregistré.

              </p>

            )



            :



            (

              <ul>


                {


                  typedEvents.map(

                    (

                      event,

                      index

                    ) => (



                      <li

                        key={index}

                      >



                        {

                          event.event_type

                          ??

                          "Événement"

                        }



                      </li>


                    )


                  )


                }



              </ul>


            )


        }




      </section>





    </section>


  )


}
