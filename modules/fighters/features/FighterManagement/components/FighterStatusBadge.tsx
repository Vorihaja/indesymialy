"use client";


import type {
  Fighter,
} from "@/modules/fighters/types";



interface Props {

  status: Fighter["status"];

}



export function FighterStatusBadge({
  status,
}: Props) {


  const styles: Record<
    Fighter["status"],
    string
  > = {


    active:
      "bg-emerald-950 text-emerald-400 border-emerald-800",


    inactive:
      "bg-neutral-900 text-neutral-400 border-neutral-700",


    suspended:
      "bg-red-950 text-red-400 border-red-800",


    pending:
      "bg-amber-950 text-amber-400 border-amber-800",


  };



  const labels: Record<
    Fighter["status"],
    string
  > = {


    active: "Actif",

    inactive: "Inactif",

    suspended: "Suspendu",

    pending: "En attente",


  };



  return (

    <span
      className={`
        inline-flex
        items-center
        px-3
        py-1
        text-xs
        font-bold
        border
        ${styles[status]}
      `}
    >

      {labels[status]}

    </span>

  );

}