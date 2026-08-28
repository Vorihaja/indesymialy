"use client";


interface Props {

  loading?: boolean;

  onActivate: () => void;

  onSuspend: () => void;

  onDeactivate: () => void;

}



export function FighterManagementActions({

  loading,

  onActivate,

  onSuspend,

  onDeactivate,

}: Props) {



  return (

    <div
      className="
        flex
        flex-wrap
        gap-3
      "
    >


      <button

        type="button"

        disabled={loading}

        onClick={onActivate}

        className="
          px-4
          py-2
          bg-emerald-700
          text-white
          text-sm
          font-bold
          disabled:opacity-50
        "

      >

        Activer

      </button>




      <button

        type="button"

        disabled={loading}

        onClick={onSuspend}

        className="
          px-4
          py-2
          bg-red-700
          text-white
          text-sm
          font-bold
          disabled:opacity-50
        "

      >

        Suspendre

      </button>




      <button

        type="button"

        disabled={loading}

        onClick={onDeactivate}

        className="
          px-4
          py-2
          bg-neutral-700
          text-white
          text-sm
          font-bold
          disabled:opacity-50
        "

      >

        Désactiver

      </button>


    </div>

  );

}