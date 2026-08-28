"use client";
import { DisciplineSelect, useDisciplineOptions } from "@/modules/disciplines";
export function DisciplineFilterDropdown({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { items } = useDisciplineOptions();
  return <DisciplineSelect value={value} valueMode="slug" emptyLabel={`Toutes les disciplines (${items.length})`} onChange={event => onChange(event.target.value)} className="w-full border border-slate-800 bg-black px-3 py-2 text-sm" />;
}