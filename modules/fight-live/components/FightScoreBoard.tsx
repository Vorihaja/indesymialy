"use client"



interface FighterScore {

  id?: string | null

  name?: string | null

  nickname?: string | null

  photo?: string | null

}



interface ScoreData {

  red?: number

  blue?: number

}



interface FightScoreBoardProps {


  redFighter?: FighterScore | null

  blueFighter?: FighterScore | null


  score?: ScoreData | null


  roundNumber?: number


  totalRounds?: number


  penalties?: {

    red?: number

    blue?: number

  }



  knockdowns?: {

    red?: number

    blue?: number

  }



  warnings?: {

    red?: number

    blue?: number

  }


}





export default function FightScoreBoard(

  {

    redFighter,

    blueFighter,

    score,

    roundNumber,

    totalRounds,

    penalties,

    knockdowns,

    warnings

  }: FightScoreBoardProps

) {



  return (

    <section className="fight-score-board">



      <header>

        <h2>

          Tableau de jugement live

        </h2>



        {

          roundNumber && totalRounds &&

          (

            <p>

              Round {roundNumber} / {totalRounds}

            </p>

          )

        }


      </header>






      <div className="fighters-score-container">





        <article className="fighter-card red-corner">


          <div className="fighter-header">


            {

              redFighter?.photo &&

              (

                <img

                  src={redFighter.photo}

                  alt={
                    redFighter.name ?? "Combattant rouge"
                  }

                />

              )

            }



            <div>

              <h3>

                {redFighter?.name ?? "Rouge"}

              </h3>


              {

                redFighter?.nickname &&

                (

                  <span>

                    &quot;{redFighter.nickname}&quot;

                  </span>

                )

              }

            </div>


          </div>





          <strong className="score">

            {score?.red ?? 0}

          </strong>





          <div>

            <p>

              Knockdowns :

              {" "}

              {knockdowns?.red ?? 0}

            </p>



            <p>

              Pénalités :

              {" "}

              {penalties?.red ?? 0}

            </p>



            <p>

              Avertissements :

              {" "}

              {warnings?.red ?? 0}

            </p>


          </div>


        </article>







        <div className="vs">

          VS

        </div>







        <article className="fighter-card blue-corner">



          <div className="fighter-header">



            {

              blueFighter?.photo &&

              (

                <img

                  src={blueFighter.photo}

                  alt={
                    blueFighter.name ?? "Combattant bleu"
                  }

                />

              )

            }



            <div>

              <h3>

                {blueFighter?.name ?? "Bleu"}

              </h3>



              {

                blueFighter?.nickname &&

                (

                  <span>

                    &quot;{blueFighter.nickname}&quot;

                  </span>

                )

              }


            </div>


          </div>






          <strong className="score">

            {score?.blue ?? 0}

          </strong>






          <div>

            <p>

              Knockdowns :

              {" "}

              {knockdowns?.blue ?? 0}

            </p>




            <p>

              Pénalités :

              {" "}

              {penalties?.blue ?? 0}

            </p>




            <p>

              Avertissements :

              {" "}

              {warnings?.blue ?? 0}

            </p>


          </div>


        </article>



      </div>



    </section>

  )

}
