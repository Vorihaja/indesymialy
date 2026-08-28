interface Props {

  loading:boolean;

  disabled?:boolean;

}



export function FighterRegistrationActions({
  loading,
  disabled,
}:Props) {


  return (

    <button

      type="submit"

      disabled={
        disabled || loading
      }

      className="
        bg-white
        text-black
        px-5
        py-3
        font-bold
        disabled:opacity-50
      "

    >

      {loading
        ? "Création..."
        : "Créer le profil"}

    </button>

  );
}