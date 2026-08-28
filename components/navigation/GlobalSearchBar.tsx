"use client";
import { useEffect, useState, useRef, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, Filter, MapPin, X, Check, CalendarRange, ChevronDown } from "lucide-react";
import { useGeography } from "@/modules/geography";
import { useDisciplineFilter } from "../../providers/search/discipline-filter-context";
import { useDiscovery } from "@/modules/discovery-core/hooks/useDiscovery";
import { includesSearchValue } from "@/providers/search/global-search-filters";
import type { DiscoveryResult } from "@/modules/discovery-core/types";

const DATE_PRESETS = [
  { label: "Aujourd'hui",  days: 0,   key: "today"   },
  { label: "Cette semaine", days: 7,  key: "week"    },
  { label: "Ce mois",       days: 30, key: "month"   },
  { label: "3 mois",        days: 90, key: "quarter" },
  { label: "Cette année",   days: 365,key: "year"    },
];

function toInputDate(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function GlobalSearchBar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const geography = useGeography();
  const { disciplines, selectedDisciplines, setSelectedDisciplines, toggleDiscipline, isAllSelected, clearAll, selectAll } = useDisciplineFilter();
  const discovery = useDiscovery();

  // ── États filtres ──────────────────────────────────────────────
  const [q, setQ] = useState(searchParams?.get("search") || "");
  const [region, setRegion] = useState(searchParams?.get("region") || "");
  const [ville, setVille] = useState(searchParams?.get("ville") || "");
  const [dateFrom, setDateFrom] = useState(searchParams?.get("dateFrom") || "");
  const [dateTo, setDateTo] = useState(searchParams?.get("dateTo") || "");

  // Référentiel administratif partagé
  const regionsDB = geography.data?.regions ?? [];
  const selectedRegionId = regionsDB.find((item) => item.name === region)?.id ?? "";
  const villesDB = useMemo(() => {
    if (!selectedRegionId || !geography.data) return [];
    const unique = new Map<string, string>();
    geography.data.cities.filter((item) => item.regionId === selectedRegionId).forEach((item) => unique.set(item.name, item.name));
    return [...unique.values()].sort((a, b) => a.localeCompare(b, "fr"));
  }, [geography.data, selectedRegionId]);
  // ── UI toggles ─────────────────────────────────────────────────
  const [showResults, setShowResults] = useState(false);
  const [searching, setSearching] = useState(false);
  const [showDisc, setShowDisc] = useState(false);
  const [showDate, setShowDate] = useState(false);
  const [results, setResults] = useState<DiscoveryResult[]>([]);

  const discRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);

  // Clic extérieur
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (discRef.current && !discRef.current.contains(e.target as Node)) setShowDisc(false);
      if (dateRef.current && !dateRef.current.contains(e.target as Node)) setShowDate(false);
      const t = e.target as HTMLElement;
      if (!t.closest("#global-search-input")) setShowResults(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // Filtrer les villes selon la région
  // ── CENTRALISATION ET SYNCHRONISATION DE L'URL ─────────────────
  // Un seul effet global master gère l'URL pour éviter les conflits de push concurrents
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    ["search", "region", "ville", "dateFrom", "dateTo", "disciplines"].forEach((key) => params.delete(key));
    
    if (q) params.set("search", q);
    if (region) params.set("region", region);
    if (ville) params.set("ville", ville);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    
    // Comparaison sûre par chaîne de caractères pour les disciplines
    if (!isAllSelected && selectedDisciplines.length > 0) {
      params.set("disciplines", selectedDisciplines.join(","));
    }

    // Le debounce est appliqué indirectement via le délai du texte ou des sélections
    const handler = setTimeout(() => {
      const query = params.toString();
      if (query !== searchParams.toString()) router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }, 150);

    return () => clearTimeout(handler);
  }, [q, region, ville, dateFrom, dateTo, selectedDisciplines, isAllSelected, pathname, router, searchParams]);

  useEffect(() => {
    const nextQ = searchParams.get("search") ?? "";
    const nextRegion = searchParams.get("region") ?? "";
    const nextVille = searchParams.get("ville") ?? "";
    const nextDateFrom = searchParams.get("dateFrom") ?? "";
    const nextDateTo = searchParams.get("dateTo") ?? "";
    const rawDisciplines = searchParams.get("disciplines");
    queueMicrotask(() => {
      setQ(nextQ); setRegion(nextRegion); setVille(nextVille); setDateFrom(nextDateFrom); setDateTo(nextDateTo);
      setSelectedDisciplines(rawDisciplines === null ? [...disciplines] : rawDisciplines.split(",").filter((value) => disciplines.includes(value)));
    });
  }, [disciplines, searchParams, setSelectedDisciplines]);

  // Réinitialiser la ville si la région change
  const handleRegionChange = (newRegion: string) => {
    setRegion(newRegion);
    setVille("");
  };

  // ── Autocomplete live search ───────────────────────────────────
  useEffect(() => {
    if (q.length < 2) {
      queueMicrotask(() => setResults([]));
      queueMicrotask(() => setSearching(false));
      return;
    }
    const t = setTimeout(async () => {
      setSearching(discovery.loading);
      const matches = (discovery.snapshot?.search ?? [])
        .filter((item) => includesSearchValue([item.title, item.description, ...item.tags], q))
        .slice(0, 12);
      setResults(matches);
      setShowResults(true);
      setSearching(false);
    }, 250);
    return () => clearTimeout(t);
  }, [q, discovery.loading, discovery.snapshot]);

  // ── Helpers ───────────────────────────────────────────────────
  const applyPreset = (days: number) => {
    const now = new Date();
    const from = toInputDate(now);
    const to = toInputDate(new Date(now.getTime() + days * 86400000));
    setDateFrom(from);
    setDateTo(to);
  };

  const clearDates = () => { setDateFrom(""); setDateTo(""); };

  const hasDateFilter = !!(dateFrom || dateTo);
  const hasGeoFilter = !!(region || ville);
  const hasAnyFilter = !!(q || hasGeoFilter || hasDateFilter || !isAllSelected);

  const dateBtnLabel = hasDateFilter
    ? dateFrom && dateTo
      ? `${dateFrom.slice(5)} → ${dateTo.slice(5)}`
      : dateFrom ? `≥ ${dateFrom.slice(5)}` : `≤ ${dateTo.slice(5)}`
    : "Période";

  return (
    <div className="relative w-full bg-neutral-950 font-mono border-b border-neutral-900">
      <div className="flex items-stretch divide-x divide-neutral-900 text-[10px] uppercase tracking-wider overflow-x-auto scrollbar-hide min-h-[40px]">

        {/* SEARCH INPUT */}
        <div id="global-search-input" className="flex items-center flex-1 px-4 gap-2.5 relative min-w-[180px]">
          <Search size={12} className="text-neutral-600 shrink-0" />
          <input
            aria-label='Recherche globale'
            value={q}
            onChange={e => setQ(e.target.value)}
            onFocus={() => q.length >= 2 && setShowResults(true)}
            placeholder="CLUB, COMBATTANT, EVENT..."
            className="w-full bg-transparent text-white placeholder-neutral-600 focus:outline-none font-bold text-xs"
          />
          {q && (
            <button onClick={() => setQ("")} className="shrink-0 text-neutral-600 hover:text-white transition-colors">
              <X size={10} />
            </button>
          )}
          {showResults && (
            <div className="absolute top-full left-0 right-0 bg-[#0a0a0a] border border-neutral-800 rounded-b-xl p-2 z-[300] flex flex-col gap-1 shadow-2xl">
              {searching && <div className='ds-caption ds-pad' role='status'>Recherche en cours…</div>}
              {!searching && results.length === 0 && <div className='ds-caption ds-pad'>Aucun résultat pour « {q} ».</div>}
              {results.map((item) => (
                <Link key={`${item.kind}-${item.id}`} href={item.href} onClick={() => setShowResults(false)} className="flex items-center justify-between gap-3 rounded bg-neutral-900 px-2 py-2 text-xs hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">
                  <span className="min-w-0"><span className="block truncate text-white">{item.title}</span><span className="block truncate text-[9px] normal-case text-neutral-500">{item.description}</span></span>
                  <span className="shrink-0 text-[9px] font-bold text-neutral-500">{item.kind}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* DISCIPLINE FILTER */}
        <div ref={discRef} className="flex items-center px-3 relative shrink-0">
          <button
            onClick={() => { setShowDisc(v => !v); setShowDate(false); }}
            className="flex items-center gap-2 font-bold text-xs h-full py-2"
          >
            <Filter size={10} className={isAllSelected ? "text-neutral-600" : "text-red-500"} />
            <span className={isAllSelected ? "text-neutral-400" : "text-white"}>
              {isAllSelected ? "Disciplines" : `${selectedDisciplines.length} disc.`}
            </span>
            <ChevronDown size={8} className={`text-neutral-600 transition-transform ${showDisc ? "rotate-180" : ""}`} />
          </button>

          {showDisc && (
            <div className="absolute top-full left-0 w-64 bg-[#0f0f0f] border border-neutral-800 rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] z-[300] overflow-hidden">
              <div className="flex justify-between p-2 border-b border-neutral-800 bg-[#0a0a0a]">
                <button onClick={selectAll} className="text-[10px] bg-white text-black px-2.5 py-1 rounded-full font-black hover:bg-neutral-200 transition-colors">TOUT</button>
                <span className="text-[10px] text-neutral-500 self-center">{selectedDisciplines.length}/{disciplines.length}</span>
                <button onClick={clearAll} className="text-[10px] bg-neutral-800 text-neutral-400 px-2.5 py-1 rounded-full font-bold hover:bg-neutral-700 transition-colors">VIDER</button>
              </div>
              <div className="max-h-56 overflow-auto flex flex-col divide-y divide-neutral-900/60">
                {disciplines.map((d) => {
                  const active = selectedDisciplines.includes(d);
                  return (
                    <label key={d} className="flex items-center gap-2.5 px-3 py-2 hover:bg-neutral-900 cursor-pointer group">
                      <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-all ${active ? "bg-white border-white" : "border-neutral-700 group-hover:border-neutral-500"}`}>
                        {active && <Check size={10} className="text-black" strokeWidth={3} />}
                      </div>
                      <span className={`text-xs leading-none tracking-wide ${active ? "text-white font-bold" : "text-neutral-400"}`}>{d}</span>
                      <input type="checkbox" checked={active} onChange={() => toggleDiscipline(d)} className="hidden" />
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* PÉRIODE / DATE FILTER */}
        <div ref={dateRef} className="flex items-center px-3 relative shrink-0">
          <button
            onClick={() => { setShowDate(v => !v); setShowDisc(false); }}
            className="flex items-center gap-2 font-bold text-xs h-full py-2"
          >
            <CalendarRange size={10} className={hasDateFilter ? "text-amber-400" : "text-neutral-600"} />
            <span className={hasDateFilter ? "text-amber-400" : "text-neutral-400"}>{dateBtnLabel}</span>
            {hasDateFilter && <X size={8} aria-hidden="true" />}
            <ChevronDown size={8} className={`text-neutral-600 transition-transform ${showDate ? "rotate-180" : ""}`} />
          </button>

          {showDate && (
            <div className="absolute top-full right-0 w-72 bg-[#0f0f0f] border border-neutral-800 rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] z-[300] overflow-hidden">
              <div className="p-2 border-b border-neutral-800 bg-[#0a0a0a]">
                <div className="text-[9px] text-neutral-600 mb-1.5 font-bold uppercase tracking-wider">Raccourcis</div>
                <div className="flex flex-wrap gap-1">
                  {DATE_PRESETS.map(p => (
                    <button
                      key={p.key}
                      onClick={() => applyPreset(p.days)}
                      className="text-[10px] px-2 py-1 rounded-full bg-neutral-800 text-neutral-300 hover:bg-white hover:text-black font-bold transition-all border border-neutral-700 hover:border-white"
                    >
                      {p.label}
                    </button>
                  ))}
                  <button
                    onClick={clearDates}
                    className="text-[10px] px-2 py-1 rounded-full bg-transparent text-neutral-600 hover:text-red-400 font-bold transition-colors border border-neutral-800"
                  >
                    Réinitialiser
                  </button>
                </div>
              </div>

              <div className="p-3 space-y-3">
                <div>
                  <label className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider block mb-1">Date début</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={e => setDateFrom(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 text-white text-[11px] font-mono px-2 py-1.5 rounded focus:outline-none focus:border-neutral-600 [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider block mb-1">Date fin</label>
                  <input
                    type="date"
                    value={dateTo}
                    min={dateFrom || undefined}
                    onChange={e => setDateTo(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 text-white text-[11px] font-mono px-2 py-1.5 rounded focus:outline-none focus:border-neutral-600 [color-scheme:dark]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RÉGION / VILLE */}
        <div className="flex items-center px-3 gap-2 shrink-0">
          <MapPin size={10} className={hasGeoFilter ? "text-blue-400" : "text-blue-600"} />
          <select
            value={region}
            onChange={e => handleRegionChange(e.target.value)}
            className={`bg-transparent font-bold text-[10px] focus:outline-none cursor-pointer max-w-[130px] transition-colors ${region ? "text-blue-300" : "text-neutral-400"}`}
          >
            <option value="" className="bg-neutral-950 text-neutral-300">Toutes Régions</option>
            {regionsDB.map(item => (
              <option key={item.id} value={item.name} className="bg-neutral-950 text-white">{item.name}</option>
            ))}
          </select>

          <select
            value={ville}
            onChange={e => setVille(e.target.value)}
            className={`bg-transparent font-bold text-[10px] border-l border-neutral-800 pl-2 ml-1 focus:outline-none cursor-pointer max-w-[110px] transition-colors ${ville ? "text-white" : "text-neutral-500"}`}
          >
            <option value="" className="bg-neutral-950 text-neutral-300">Toutes Villes</option>
            {villesDB.map(v => (
              <option key={v} value={v} className="bg-neutral-950 text-white">{v}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── CHIPS FILTRES ACTIFS ─────────────────────────────────── */}
      {hasAnyFilter && (
        <div className="min-h-[32px] flex items-center gap-1.5 px-3 py-1.5 bg-[#050505] border-t border-neutral-900 flex-wrap">
          {q && (
            <span className="h-5 px-2 rounded-full bg-white text-black text-[10px] font-bold flex items-center gap-1">
              {q}<button onClick={() => setQ("")}><X size={10} /></button>
            </span>
          )}
          {region && (
            <span className="h-5 px-2 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center gap-1">
              <MapPin size={8} />{region}<button onClick={() => handleRegionChange("")}><X size={10} /></button>
            </span>
          )}
          {ville && (
            <span className="h-5 px-2 rounded-full bg-blue-900 border border-blue-700 text-blue-200 text-[10px] font-bold flex items-center gap-1">
              {ville}<button onClick={() => setVille("")}><X size={10} /></button>
            </span>
          )}
          {hasDateFilter && (
            <span className="h-5 px-2 rounded-full bg-amber-900 border border-amber-700 text-amber-200 text-[10px] font-bold flex items-center gap-1">
              <CalendarRange size={8} />
              {dateFrom && dateTo ? `${dateFrom} → ${dateTo}` : dateFrom ? `≥ ${dateFrom}` : `≤ ${dateTo}`}
              <button onClick={clearDates}><X size={10} /></button>
            </span>
          )}
          {!isAllSelected && selectedDisciplines.slice(0, 3).map((d) => (
            <span key={d} className="h-5 px-2 rounded-full bg-red-700 text-white text-[10px] font-bold flex items-center gap-1">
              {d}<button onClick={() => toggleDiscipline(d)}><X size={10} /></button>
            </span>
          ))}
          {!isAllSelected && selectedDisciplines.length > 3 && (
            <span className="h-5 px-2 rounded-full bg-neutral-800 text-neutral-300 text-[10px] font-bold">
              +{selectedDisciplines.length - 3} disc.
            </span>
          )}
        </div>
      )}
    </div>
  );
}
