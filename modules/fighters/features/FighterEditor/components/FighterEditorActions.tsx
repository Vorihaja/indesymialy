interface Props {

  loading:boolean;

  onCancel?:()=>void;

}



export function FighterEditorActions({
  loading,
  onCancel,
}:Props) {


  return (

    <div
      className="
        flex
        gap-3
      "
    >

      <button

        type="submit"

        disabled={loading}

        className="
          bg-white
          text-black
          px-5
          py-3
          font-bold
          disabled:opacity-50
        "

      >

        {
          loading
          ? "Enregistrement..."
          : "Sauvegarder"
        }

      </button>



      {
        onCancel && (

          <button

            type="button"

            onClick={onCancel}

            className="
              border
              border-neutral-700
              px-5
              py-3
              text-white
            "

          >

            Annuler

          </button>

        )
      }


    </div>

  );
}