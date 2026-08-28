import { DisciplineSelect } from "@/modules/disciplines";

import type { SocialFilters as Filters } from "../types";

const filterClassName =
  "h-10 min-w-0 rounded-[2px] border border-[#303238] bg-[#0d0f12] px-3 text-xs text-zinc-200 outline-none transition-colors placeholder:text-zinc-600 hover:border-[#454951] focus:border-[#3d92ff]";

export function SocialFiltersPanel({
  filters,
  onChange,
}: {
  filters: Filters;
  onChange: (filters: Filters) => void;
}) {
  return (
    <div className="grid gap-2 rounded-[2px] border border-[#303238] bg-[#151619] p-3 md:grid-cols-5">
      <input
        value={filters.search}
        onChange={(event) =>
          onChange({ ...filters, search: event.target.value })
        }
        placeholder="Rechercher"
        className={filterClassName}
      />
      <DisciplineSelect
        value={filters.discipline}
        emptyLabel="Toutes les disciplines"
        onChange={(event) =>
          onChange({ ...filters, discipline: event.target.value })
        }
        className={filterClassName}
      />
      <input
        value={filters.region}
        onChange={(event) =>
          onChange({ ...filters, region: event.target.value })
        }
        placeholder="Région"
        className={filterClassName}
      />
      <input
        value={filters.category}
        onChange={(event) =>
          onChange({ ...filters, category: event.target.value })
        }
        placeholder="Catégorie"
        className={filterClassName}
      />
      <input
        type="date"
        aria-label="Filtrer par date"
        value={filters.date}
        onChange={(event) => onChange({ ...filters, date: event.target.value })}
        className={filterClassName}
      />
    </div>
  );
}
