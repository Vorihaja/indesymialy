"use client"



interface FighterInfo {

  id?: string | null

  name: string | null

  nickname?: string | null

  club?: string | null

  photo?: string | null

}



interface FightContext {

  eventName?: string | null

  discipline?: string | null

  category?: string | null

  fightType?: string | null

  location?: string | null

  redFighter?: FighterInfo

  blueFighter?: FighterInfo

}



interface FightContextPanelProps {

  fight?: FightContext | null

}



export default function FightContextPanel(
  {
    fight
  }: FightContextPanelProps
) {


  if (!fight) {

    return (

      <section className="fight-context-panel">

        <p>
          Chargement des informations du combat...
        </p>

      </section>

    )

  }



  return (

    <section className="fight-context-panel">


      <header>

        <h2>
          Informations du combat
        </h2>

      </header>





      <div className="fight-meta">


        <div>

          <span>
            Événement
          </span>

          <strong>
            {fight.eventName ?? "-"}
          </strong>

        </div>




        <div>

          <span>
            Discipline
          </span>

          <strong>
            {fight.discipline ?? "-"}
          </strong>

        </div>




        <div>

          <span>
            Catégorie
          </span>

          <strong>
            {fight.category ?? "-"}
          </strong>

        </div>




        <div>

          <span>
            Type
          </span>

          <strong>
            {fight.fightType ?? "-"}
          </strong>

        </div>




        <div>

          <span>
            Lieu
          </span>

          <strong>
            {fight.location ?? "-"}
          </strong>

        </div>


      </div>





      <div className="fighters-container">



        <div className="fighter fighter-red">


          {

            fight.redFighter?.photo &&

            <img
              src={fight.redFighter.photo ?? undefined}
              alt={
                fight.redFighter.name ?? "Combattant rouge"
              }
            />

          }



          <h3>
            {fight.redFighter?.name ?? "-"}
          </h3>


          <p>
            {fight.redFighter?.nickname ?? ""}
          </p>


          <small>
            {fight.redFighter?.club ?? ""}
          </small>


        </div>





        <div className="vs">

          VS

        </div>





        <div className="fighter fighter-blue">


          {

            fight.blueFighter?.photo &&

            <img
              src={fight.blueFighter.photo ?? undefined}
              alt={
                fight.blueFighter.name ?? "Combattant bleu"
              }
            />

          }



          <h3>
            {fight.blueFighter?.name ?? "-"}
          </h3>


          <p>
            {fight.blueFighter?.nickname ?? ""}
          </p>


          <small>
            {fight.blueFighter?.club ?? ""}
          </small>


        </div>


      </div>


    </section>

  )

}
