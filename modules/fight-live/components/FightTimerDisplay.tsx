"use client"


interface FightTimerDisplayProps {

  timerEvent?: {
    status?: string
    roundNumber?: number
    remainingSeconds?: number
    elapsedSeconds?: number
  } | null

}



export default function FightTimerDisplay(
  {
    timerEvent
  }: FightTimerDisplayProps
) {


  const status =
    timerEvent?.status ?? "WAITING"



  const roundNumber =
    timerEvent?.roundNumber ?? 0



  const remainingSeconds =
    timerEvent?.remainingSeconds ?? 0



  const minutes =
    Math.floor(
      remainingSeconds / 60
    )



  const seconds =
    remainingSeconds % 60



  return (

    <section className="fight-timer-display">


      <header>

        <h2>
          Chronomètre officiel
        </h2>

      </header>




      <div className="timer-main">


        <div className="round-info">

          <span>
            Round
          </span>

          <strong>
            {roundNumber || "-"}
          </strong>

        </div>




        <div className="timer-value">

          <strong>

            {String(minutes).padStart(2, "0")}
            :
            {String(seconds).padStart(2, "0")}

          </strong>

        </div>




        <div className="timer-status">

          <span>
            État
          </span>


          <strong>
            {status}
          </strong>

        </div>


      </div>


    </section>

  )

}