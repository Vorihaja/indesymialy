"use client";


import type {
  Club,
} from "../types";



interface ClubCardProps {


  club:
    Club;


  onClick?:
    () => void;


}





export default function ClubCard(
  {
    club,
    onClick,
  }: ClubCardProps
) {



  return (


    <div

      onClick={
        onClick
      }

      className="
        border
        rounded-xl
        p-5
        cursor-pointer
        hover:shadow-md
        transition
      "

    >



      <div
        className="
          flex
          items-center
          gap-4
        "
      >



        {
          club.logo_url

          ?

          <img

            src={
              club.logo_url
            }

            alt={
              club.name
            }

            className="
              w-16
              h-16
              rounded-full
              object-cover
            "

          />

          :

          <div

            className="
              w-16
              h-16
              rounded-full
              border
              flex
              items-center
              justify-center
              font-bold
            "

          >

            {
              club.name
                .charAt(0)
                .toUpperCase()
            }

          </div>

        }





        <div>


          <h3
            className="
              font-semibold
              text-lg
            "
          >

            {
              club.name
            }

          </h3>



          <p
            className="
              text-sm
              opacity-70
            "
          >

            {
              club.description
              ??
              "Aucune description"
            }

          </p>



        </div>



      </div>








      {
        club.address &&

        <p
          className="
            mt-4
            text-sm
            opacity-70
          "
        >

          📍

          {" "}

          {
            club.address
          }

        </p>

      }



    </div>


  );


}