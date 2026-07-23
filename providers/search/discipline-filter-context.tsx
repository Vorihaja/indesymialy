"use client";

import { createContext, useContext, useEffect, useState } from "react";

export const DISCIPLINES = [
  "Morengy",
  "MMA",
  "Boxe anglaise",
  "Kickboxing",
  "Full Contact",
  "Muay Thaï",
  "Savate",
  "Taekwondo",
  "Karaté",
  "Sanda",
  "Lethwei",
  "Kun Khmer",
  "Yaw-Yan",
  "Judo",
  "Ringa",
  "Lutte gréco-romaine",
  "Lutte libre",
  "Jiu-Jitsu brésilien",
  "Sambo",
  "Sumo",
  "Catch wrestling",
  "Pankration",
  "Escrime",
  "Kendo",
  "Iaido",
  "Kenjutsu",
  "Arnis/Kali/Escrima",
  "Silat",
  "Shooto",
  "Kūdō",
  "Shoot boxing",
  "Krav Maga",
  "Systema",
  "Hapkido",
  "Jeet Kune Do",
  "Kung Fu",
  "Aïkido",
  "Capoeira",
  "Taï Chi Chuan",
  "Baguazhang",
  "Xing Yi Quan",
];

type Discipline = (typeof DISCIPLINES)[number];

interface DisciplineFilterContextValue {
  selectedDisciplines: Discipline[];
  toggleDiscipline: (discipline: Discipline) => void;
  selectAll: () => void;
  clearAll: () => void;
  isAllSelected: boolean;
  label: string;
}

const DisciplineFilterContext = createContext<DisciplineFilterContextValue | undefined>(undefined);

export function DisciplineFilterProvider({ children }: { children: React.ReactNode }) {
  const [selectedDisciplines, setSelectedDisciplines] = useState<Discipline[]>(DISCIPLINES);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("indesy-selected-disciplines");
      if (raw) {
        const parsed = JSON.parse(raw) as Discipline[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          // eslint-disable-next-line
          setSelectedDisciplines(parsed);
        }
      }
    } catch {
      // ignore invalid local storage
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("indesy-selected-disciplines", JSON.stringify(selectedDisciplines));
  }, [selectedDisciplines]);

  const selectAll = () => setSelectedDisciplines([...DISCIPLINES]);
  const clearAll = () => setSelectedDisciplines([]);
  const toggleDiscipline = (discipline: Discipline) => {
    setSelectedDisciplines((current) =>
      current.includes(discipline)
        ? current.filter((item) => item !== discipline)
        : [...current, discipline]
    );
  };

  const isAllSelected = selectedDisciplines.length === DISCIPLINES.length;
  const label = selectedDisciplines.length === 0
    ? "Aucune discipline"
    : isAllSelected
    ? "Toutes les disciplines"
    : `${selectedDisciplines.length} sélectionnée${selectedDisciplines.length > 1 ? "s" : ""}`;

  return (
    <DisciplineFilterContext.Provider
      value={{
        selectedDisciplines,
        toggleDiscipline,
        selectAll,
        clearAll,
        isAllSelected,
        label,
      }}
    >
      {children}
    </DisciplineFilterContext.Provider>
  );
}

export function useDisciplineFilter() {
  const context = useContext(DisciplineFilterContext);
  if (!context) {
    throw new Error("useDisciplineFilter must be used within DisciplineFilterProvider");
  }
  return context;
}
