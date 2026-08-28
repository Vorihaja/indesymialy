interface Props {

  label: string;

  name: string;

  value: string | number | undefined;

  type?: string;

  placeholder?: string;

  onChange: (
    value:string
  ) => void;

}



export function FighterEditorField({
  label,
  name,
  value,
  type="text",
  placeholder,
  onChange,
}: Props) {


  return (

    <div
      className="
        space-y-2
      "
    >

      <label
        htmlFor={name}
        className="
          text-xs
          uppercase
          tracking-wide
          text-neutral-500
        "
      >

        {label}

      </label>



      <input

        id={name}

        name={name}

        type={type}

        value={value ?? ""}

        placeholder={placeholder}

        onChange={(event)=>
          onChange(
            event.target.value
          )
        }

        className="
          w-full
          bg-neutral-950
          border
          border-neutral-800
          px-3
          py-2
          text-white
        "

      />

    </div>

  );
}