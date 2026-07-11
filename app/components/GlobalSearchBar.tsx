"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, Filter, MapPin } from "lucide-react";

export default function GlobalSearchBar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Masquage automatique sur les dashboards
  if (pathname?.startsWith("/dashboard")) return null;

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams?.toString());
    if (value && !value.includes("Toutes") && !value.includes("RECHERCHE")) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="fixed top-[84px] inset-x-0 h-7 z-50 bg-neutral-950 border-b border-neutral-900 font-mono text-[10px] uppercase tracking-wider text-neutral-300">
      <div className="max-w-[1680px] mx-auto h-full flex items-stretch divide-x divide-neutral-900">
        
        {/* Recherche */}
        <div className="flex items-center flex-1 px-3 gap-2">
          <Search size={12} className="text-neutral-500 shrink-0" />
          <input
            type="text"
            placeholder="RECHERCHE PAR MOT-CLÉ..."
            defaultValue={searchParams?.get("search") || ""}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="w-full bg-transparent text-white placeholder-neutral-600 focus:outline-none text-[10px] uppercase font-bold"
          />
        </div>

        {/* Discipline */}
        <div className="flex items-center px-3 gap-1.5 bg-neutral-950/40">
          <Filter size={10} className="text-red-500 shrink-0" />
          <select
            value={searchParams?.get("discipline") || "Toutes Disciplines"}
            onChange={(e) => updateFilter("discipline", e.target.value)}
            className="bg-transparent font-bold focus:outline-none cursor-pointer text-neutral-300"
          >
            {["Toutes Disciplines", "MMA", "Judo", "Kick-Boxing", "Boxe Anglaise", "Karaté"].map((d) => (
              <option key={d} value={d} className="bg-black text-white">{d}</option>
            ))}
          </select>
        </div>

        {/* Région */}
        <div className="flex items-center px-3 gap-1.5 bg-neutral-950/40">
          <MapPin size={10} className="text-blue-500 shrink-0" />
          <select
            value={searchParams?.get("region") || "Toutes Régions"}
            onChange={(e) => updateFilter("region", e.target.value)}
            className="bg-transparent font-bold focus:outline-none cursor-pointer text-neutral-300"
          >
            {["Toutes Régions", "Analamanga", "Boeny", "Atsinanana", "Diana", "Matsiatra Ambony"].map((r) => (
              <option key={r} value={r} className="bg-black text-white">{r}</option>
            ))}
          </select>
        </div>

      </div>
    </div>
  );
}