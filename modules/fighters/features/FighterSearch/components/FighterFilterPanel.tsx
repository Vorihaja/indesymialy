import type {
  FighterSearchFilters,
} from "@/modules/fighters/types";


interface Props {

  filters: FighterSearchFilters;

  onChange:
    (
      filters: FighterSearchFilters
    ) => void;

}


const STATUS_OPTIONS = [
  "active",
  "inactive",
  "suspended",
  "pending",
] as const;



export function FighterFilterPanel({
  filters,
  onChange,
}: Props) {


  return (

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">


      <input
        value={filters.category ?? ""}
        onChange={(e) =>
          onChange({
            ...filters,
            category:
              e.target.value || undefined,
          })
        }
        placeholder="Catégorie"
        className="
          bg-neutral-900
          border
          border-neutral-800
          px-3
          py-2
          text-white
        "
      />



      <select
        value={filters.status ?? ""}
        onChange={(e) => {

          const value = e.target.value;


          onChange({

            ...filters,

            status:
              value === ""
                ? undefined
                : STATUS_OPTIONS.includes(
                    value as typeof STATUS_OPTIONS[number]
                  )
                    ? value as typeof STATUS_OPTIONS[number]
                    : undefined,

          });

        }}
        className="
          bg-neutral-900
          border
          border-neutral-800
          px-3
          py-2
          text-white
        "
      >

        <option value="">
          Tous les statuts
        </option>


        {STATUS_OPTIONS.map((status) => (

          <option
            key={status}
            value={status}
          >
            {status}
          </option>

        ))}


      </select>


    </div>

  );
}