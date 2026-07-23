"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, Filter, MapPin, X, Check, CalendarRange, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/client";
import { DISCIPLINES, useDisciplineFilter } from "../../providers/search/discipline-filter-context";

const DATE_PRESETS = [
  { label: "Aujourd'hui",  days: 0,   key: "today"   },
  { label: "Cette semaine", days: 7,  key: "week"    },
  { label: "Ce mois",       days: 30, key: "month"   },
  { label: "3 mois",        days: 90, key: "quarter" },
  { label: "Cette année",   days: 365,key: "year"    },
];

function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function GlobalSearchBar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const { selectedDisciplines, toggleDiscipline, isAllSelected, clearAll, selectAll } = useDisciplineFilter();

  // ── États filtres ──────────────────────────────────────────────
  const [q, setQ] = useState(searchParams?.get("search") || "");
  const [region, setRegion] = useState(searchParams?.get("region") || "");
  const [ville, setVille] = useState(searchParams?.get("ville") || "");
  const [dateFrom, setDateFrom] = useState(searchParams?.get("dateFrom") || "");
  const [dateTo, setDateTo] = useState(searchParams?.get("dateTo") || "");

  // ── Données géo depuis Supabase ────────────────────────────────
  const [allGeo, setAllGeo] = useState<{ region: string; ville: string }[]>([]);
  const [regionsDB, setRegionsDB] = useState<string[]>([]);
  const [villesDB, setVillesDB] = useState<string[]>([]);

  // ── UI toggles ─────────────────────────────────────────────────
  const [showResults, setShowResults] = useState(false);
  const [showDisc, setShowDisc] = useState(false);
  const [showDate, setShowDate] = useState(false);
  const [results, setResults] = useState<any>({ orgs: [], events: [] });

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

  // Charger Régions & Villes
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("organizations")
        .select("region, ville")
        .not("region", "is", null);

      if (data && data.length > 0) {
        setAllGeo(data as { region: string; ville: string }[]);
        const regs = [...new Set(data.map((d: any) => d.region).filter(Boolean))].sort() as string[];
        setRegionsDB(regs);
        const vills = [...new Set(data.map((d: any) => d.ville).filter(Boolean))].sort() as string[];
        setVillesDB(vills);
      }
    })();
  }, []);

  // Filtrer les villes selon la région
  useEffect(() => {
    if (!allGeo.length) return;
    if (!region) {
      const vills = [...new Set(allGeo.map((d) => d.ville).filter(Boolean))].sort() as string[];
      setVillesDB(vills);
    } else {
      const vills = [...new Set(allGeo.filter((d) => d.region === region).map((d) => d.ville).filter(Boolean))].sort() as string[];
      setVillesDB(vills);
    }
  }, [region, allGeo]);

  // ── CENTRALISATION ET SYNCHRONISATION DE L'URL ─────────────────
  // Un seul effet global master gère l'URL pour éviter les conflits de push concurrents
  useEffect(() => {
    const params = new URLSearchParams();
    
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
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }, 150);

    return () => clearTimeout(handler);
  }, [q, region, ville, dateFrom, dateTo, selectedDisciplines, isAllSelected, pathname, router]);

  // Réinitialiser la ville si la région change
  const handleRegionChange = (newRegion: string) => {
    setRegion(newRegion);
    setVille("");
  };

  // ── Autocomplete live search ───────────────────────────────────
  useEffect(() => {
    if (q.length < 2) { setResults({ orgs: [], events: [] }); return; }
    const t = setTimeout(async () => {
      const like = `%${q}%`;
      const [orgsRes, eventsRes] = await Promise.all([
        supabase.from("organizations").select("id,name,type,discipline,region,ville").ilike("name", like).limit(5),
        supabase.from("events").select("id,title,date").ilike("title", like).limit(5),
      ]);
      setResults({ orgs: orgsRes.data || [], events: eventsRes.data || [] });
      setShowResults(true);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

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
          {showResults && (results.orgs.length > 0 || results.events.length > 0) && (
            <div className="absolute top-full left-0 right-0 bg-[#0a0a0a] border border-neutral-800 rounded-b-xl p-2 z-[300] flex flex-col gap-1 shadow-2xl">
              {results.orgs.length > 0 && (
                <>
                  <div className="text-[9px] text-neutral-600 px-1 pt-1 pb-0.5 font-bold">CLUBS / ORGS</div>
                  {results.orgs.map((o: any) => (
                    <div key={o.id} className="text-xs px-2 py-1.5 bg-neutral-900 rounded hover:bg-neutral-800 cursor-pointer flex justify-between gap-2">
                      <span className="text-white truncate">{o.name}</span>
                      <span className="text-neutral-500 shrink-0">{o.ville || o.region}</span>
                    </div>
                  ))}
                </>
              )}
              {results.events.length > 0 && (
                <>
                  <div className="text-[9px] text-neutral-600 px-1 pt-1 pb-0.5 font-bold">ÉVÈNEMENTS</div>
                  {results.events.map((ev: any) => (
                    <div key={ev.id} className="text-xs px-2 py-1.5 bg-neutral-900/60 rounded hover:bg-neutral-800 cursor-pointer flex justify-between gap-2">
                      <span className="text-white truncate">{ev.title}</span>
                      {ev.date && <span className="text-neutral-500 shrink-0">{new Date(ev.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}</span>}
                    </div>
                  ))}
                </>
              )}
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
                <span className="text-[10px] text-neutral-500 self-center">{selectedDisciplines.length}/{DISCIPLINES.length}</span>
                <button onClick={clearAll} className="text-[10px] bg-neutral-800 text-neutral-400 px-2.5 py-1 rounded-full font-bold hover:bg-neutral-700 transition-colors">VIDER</button>
              </div>
              <div className="max-h-56 overflow-auto flex flex-col divide-y divide-neutral-900/60">
                {DISCIPLINES.map((d: string) => {
                  const active = selectedDisciplines.includes(d);
                  return (
                    <label key={d} className="flex items-center gap-2.5 px-3 py-2 hover:bg-neutral-900 cursor-pointer group">
                      <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-all ${active ? "bg-white border-white" : "border-neutral-700 group-hover:border-neutral-500"}`}>
                        {active && <Check size={10} className="text-black" strokeWidth={3} />}
                      </div>
                      <span className={`text-xs leading-none tracking-wide ${active ? "text-white font-bold" : "text-neutral-400"}`}>{d}</span>
                      <input type="checkbox" checked={active} onChange={() => toggleDiscipline(d as any)} className="hidden" />
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
            {hasDateFilter && (
              <button onClick={e => { e.stopPropagation(); clearDates(); }} className="text-neutral-600 hover:text-white transition-colors">
                <X size={8} />
              </button>
            )}
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
            {regionsDB.map(r => (
              <option key={r} value={r} className="bg-neutral-950 text-white">{r}</option>
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
          {!isAllSelected && selectedDisciplines.slice(0, 3).map((d: string) => (
            <span key={d} className="h-5 px-2 rounded-full bg-red-700 text-white text-[10px] font-bold flex items-center gap-1">
              {d}<button onClick={() => toggleDiscipline(d as any)}><X size={10} /></button>
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