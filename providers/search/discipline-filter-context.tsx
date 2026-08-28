"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useDisciplineOptions } from "@/modules/disciplines";
export type Discipline = string;
interface DisciplineFilterContextValue { disciplines: Discipline[]; selectedDisciplines: Discipline[]; toggleDiscipline(discipline: Discipline): void; selectAll(): void; clearAll(): void; setSelectedDisciplines(disciplines: Discipline[]): void; isAllSelected: boolean; label: string; }
const DisciplineFilterContext = createContext<DisciplineFilterContextValue | undefined>(undefined);
export function DisciplineFilterProvider({ children }: { children: React.ReactNode }) {
  const { items } = useDisciplineOptions();
  const disciplines = useMemo(() => items.map(item => item.name), [items]);
  const [selectedDisciplines, setSelectedDisciplines] = useState<Discipline[]>([]);
  const [initialized, setInitialized] = useState(false);
  useEffect(() => {
    if (!disciplines.length || initialized) return;
    try {
      const parsed = JSON.parse(window.localStorage.getItem("indesy-selected-disciplines") ?? "null") as unknown;
      const valid = Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string" && disciplines.includes(item)) : disciplines;
      setSelectedDisciplines(valid.length || Array.isArray(parsed) ? valid : disciplines);
    } catch { setSelectedDisciplines(disciplines); }
    setInitialized(true);
  }, [disciplines, initialized]);
  useEffect(() => { if (initialized) window.localStorage.setItem("indesy-selected-disciplines", JSON.stringify(selectedDisciplines)); }, [initialized, selectedDisciplines]);
  const selectAll = () => setSelectedDisciplines([...disciplines]);
  const clearAll = () => setSelectedDisciplines([]);
  const toggleDiscipline = (discipline: Discipline) => setSelectedDisciplines(current => current.includes(discipline) ? current.filter(item => item !== discipline) : [...current, discipline]);
  const isAllSelected = disciplines.length > 0 && selectedDisciplines.length === disciplines.length;
  const label = selectedDisciplines.length === 0 ? "Aucune discipline" : isAllSelected ? "Toutes les disciplines" : `${selectedDisciplines.length} sélectionnée${selectedDisciplines.length > 1 ? "s" : ""}`;
  return <DisciplineFilterContext.Provider value={{ disciplines, selectedDisciplines, toggleDiscipline, selectAll, clearAll, setSelectedDisciplines, isAllSelected, label }}>{children}</DisciplineFilterContext.Provider>;
}
export function useDisciplineFilter() { const context = useContext(DisciplineFilterContext); if (!context) throw new Error("useDisciplineFilter must be used within DisciplineFilterProvider"); return context; }