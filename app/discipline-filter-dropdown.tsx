"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DISCIPLINES, useDisciplineFilter } from "./discipline-filter-context";

export default function DisciplineFilterDropdown() {
  const {
    selectedDisciplines,
    toggleDiscipline,
    selectAll,
    clearAll,
    isAllSelected,
    label,
  } = useDisciplineFilter();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const visibleLabel = useMemo(() => {
    return label;
  }, [label]);

  const filteredDisciplines = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return DISCIPLINES;
    return DISCIPLINES.filter((discipline) => discipline.toLowerCase().includes(normalizedSearch));
  }, [search]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="inline-flex min-w-[180px] max-w-[220px] items-center gap-2 rounded-full bg-slate-900/85 px-2 py-1.5 text-xs font-normal text-slate-100 transition hover:bg-slate-900/95 hover:text-amber-200"
      >
        <span className="truncate">{visibleLabel}</span>
        <span className="text-[10px] text-slate-400">▾</span>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-3 w-[280px] rounded-3xl border border-white/10 bg-slate-950/95 p-3 shadow-[0_32px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-[10px] uppercase tracking-[0.35em] text-amber-300">Disciplines</p>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full bg-slate-900/80 px-2 py-1 text-[12px] text-slate-400 transition hover:bg-slate-900 hover:text-white"
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>

          <div className="mb-3 space-y-2">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher une discipline"
              className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300/20"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={selectAll}
                className="rounded-full bg-slate-900 px-3 py-1 text-[10px] text-slate-200 transition hover:bg-slate-800"
              >
                Toutes
              </button>
              <button
                type="button"
                onClick={clearAll}
                className="rounded-full bg-slate-900 px-3 py-1 text-[10px] text-slate-200 transition hover:bg-slate-800"
              >
                Aucune
              </button>
            </div>
          </div>

          <div className="grid max-h-64 gap-1 overflow-y-auto pr-1">
            {filteredDisciplines.map((discipline) => {
              const checked = selectedDisciplines.includes(discipline);
              return (
                <label
                  key={discipline}
                  className="flex min-w-0 cursor-pointer items-center gap-2 rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2 text-[12px] text-slate-200 transition hover:border-amber-400"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleDiscipline(discipline)}
                    className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-amber-400 focus:ring-amber-400"
                  />
                  <span className="truncate">{discipline}</span>
                </label>
              );
            })}
            {filteredDisciplines.length === 0 && (
              <p className="rounded-2xl border border-dashed border-white/10 bg-slate-900/80 px-3 py-3 text-sm text-slate-500">
                Aucune discipline trouvée.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
