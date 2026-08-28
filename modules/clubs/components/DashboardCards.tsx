"use client";



interface DashboardCardsProps {


  membersCount:
    number;



  attendanceRate:
    number;



  revenue:
    number;



  eventsCount:
    number;



}



/**
 * ============================================================
 * DASHBOARD CARDS
 * ============================================================
 *
 * Cartes statistiques dashboard club.
 *
 * Présentation uniquement.
 *
 * ============================================================
 */



export default function DashboardCards(
  {
    membersCount,
    attendanceRate,
    revenue,
    eventsCount,
  }: DashboardCardsProps
) {



  const cards = [


    {

      title:
        "Membres",

      value:
        membersCount,

    },


    {

      title:
        "Présence",

      value:
        `${attendanceRate}%`,

    },


    {

      title:
        "Revenus",

      value:
        revenue,

    },


    {

      title:
        "Événements",

      value:
        eventsCount,

    },


  ];







  return (


    <div
      className="
        grid
        grid-cols-1
        md:grid-cols-2
        lg:grid-cols-4
        gap-4
      "
    >



      {
        cards.map(
          card => (


            <div

              key={
                card.title
              }

              className="
                border
                rounded-xl
                p-5
              "

            >



              <p
                className="
                  text-sm
                  opacity-70
                "
              >

                {
                  card.title
                }

              </p>





              <p
                className="
                  text-2xl
                  font-bold
                  mt-2
                "
              >

                {
                  card.value
                }

              </p>



            </div>


          )

        )

      }



    </div>


  );


}