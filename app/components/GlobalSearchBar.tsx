"use client";
import { useEffect, useState, useMemo, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, Filter, MapPin, X, Check } from "lucide-react";
import { createClient } from "@/lib/client";
import { DISCIPLINES, useDisciplineFilter } from "../discipline-filter-context";

export default function GlobalSearchBar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const { selectedDisciplines, toggleDiscipline, isAllSelected, clearAll, selectAll } = useDisciplineFilter();

  const [q, setQ] = useState(searchParams?.get("search") || "");
  const [region, setRegion] = useState(searchParams?.get("region") || "");
  const [ville, setVille] = useState(searchParams?.get("ville") || "");
  const [regionsDB, setRegionsDB] = useState<string[]>([]);
  const [villesDB, setVillesDB] = useState<string[]>([]);
  const [results, setResults] = useState<any>({ orgs: [], events: [] });
  const [showResults, setShowResults] = useState(false);
  const [showDisc, setShowDisc] = useState(false);

  const discRef = useRef<HTMLDivElement>(null);

  // Fermer quand on clique dehors
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (discRef.current &&!discRef.current.contains(e.target as Node)) {
        setShowDisc(false);
      }
      // fermer aussi results si clique hors barre
      const target = e.target as HTMLElement;
      if (!target.closest("#global-search-input")) setShowResults(false);
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  // Charger régions / villes dynamiques depuis DB
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("organizations").select("region, ville");
      if (data) {
        const regs = [...new Set(data.map((d: any) => d.region).filter(Boolean))] as string[];
        const vills = [...new Set(data.filter((d: any) =>!region || d.region === region).map((d: any) => d.ville).filter(Boolean))] as string[];
        if (regs.length) setRegionsDB(regs);
        if (vills.length) setVillesDB(vills);
        else setVillesDB([...new Set(data.map((d: any) => d.ville).filter(Boolean))] as string[]);
      }
    })();
  }, [region]);

  const updateURL = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams?.toString());
    if (value) params.set(key, value); else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  };

  useEffect(() => { updateURL("search", q); }, [q]);
  useEffect(() => { if(region) { updateURL("region", region); setVille(""); } else { updateURL("region",""); } }, [region]);
  useEffect(() => { updateURL("ville", ville); }, [ville]);

  useEffect(() => {
    if (q.length < 2) { setResults({ orgs: [], events: [] }); return; }
    const t = setTimeout(async () => {
      const like = `%${q}%`;
      const [orgsRes, eventsRes] = await Promise.all([
        supabase.from("organizations").select("id,name,type,discipline,region,ville").ilike("name", like).limit(6),
        supabase.from("events").select("id,title").ilike("title", like).limit(6),
      ]);
      setResults({ orgs: orgsRes.data || [], events: eventsRes.data || [] });
      setShowResults(true);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="relative w-full bg-neutral-950 font-mono border-b border-neutral-900">
      {/* BARRE 40px */}
      <div className="h- flex items-stretch divide-x divide-neutral-900 text- uppercase tracking-wider">

        {/* SEARCH */}
        <div id="global-search-input" className="flex items-center flex-1 px-4 gap-2.5 relative">
          <Search size={12} className="text-neutral-600" />
          <input value={q} onChange={e => setQ(e.target.value)} onFocus={()=> q.length>=2 && setShowResults(true)} placeholder="RECHERCHE CLUB, COMBATTANT, EVENT..." className="w-full bg-transparent text-white placeholder-neutral-600 focus:outline-none font-bold text-" />
          {showResults && q.length>=2 && (
            <div className="absolute top- left-0 right-0 bg-[#0a0a0a] border border-neutral-800 rounded-b-xl p-2 z-[200] flex flex-col gap-1">
              {results.orgs.map((o:any)=><div key={o.id} className="text- px-2 py-1.5 bg-neutral-900 rounded flex justify-between"><span>{o.name}</span><span className="text-neutral-500">{o.ville||o.region}</span></div>)}
            </div>
          )}
        </div>

        {/* DISCIPLINE - dropdown vers le BAS */}
        <div ref={discRef} className="flex items-center px-3 relative shrink-0">
          <button onClick={() => setShowDisc(v =>!v)} className="flex items-center gap-2 font-bold text- h-full">
            <Filter size={10} className={isAllSelected? "text-neutral-600" : "text-red-500"} />
            <span className={isAllSelected? "text-neutral-400" : "text-white"}>{isAllSelected? "Disciplines" : `${selectedDisciplines.length} disc.`}</span>
          </button>

          {showDisc && (
            <div className="absolute top- left-0 w- bg-[#0f0f0f] border border-neutral-800 rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] z-[200] overflow-hidden animate-in fade-in slide-in-from-top-1">
              <div className="flex justify-between p-2 border-b border-neutral-800 bg-[#0a0a0a]">
                <button onClick={selectAll} className="text- bg-white text-black px-2.5 py-1 rounded-full font-black">TOUT SELECT</button>
                <button onClick={clearAll} className="text- bg-neutral-800 text-neutral-400 px-2.5 py-1 rounded-full font-bold">VIDER</button>
              </div>
              <div className="max-h- overflow-auto flex flex-col divide-y divide-neutral-900/60">
                {DISCIPLINES.map((d: string) => {
                  const active = selectedDisciplines.includes(d);
                  return (
                    <label key={d} className="flex items-center gap-2.5 px-3 py- hover:bg-neutral-900 cursor-pointer group">
                      <div className={`w- h- rounded- border flex items-center justify-center shrink-0 transition ${active? 'bg-white border-white' : 'border-neutral-700 group-hover:border-neutral-500'}`}>
                        {active && <Check size={10} className="text-black" strokeWidth={3} />}
                      </div>
                      <span className={`text- leading-none tracking-wide ${active? 'text-white font-bold' : 'text-neutral-400'}`}>{d}</span>
                      <input type="checkbox" checked={active} onChange={() => toggleDiscipline(d as any)} className="hidden" />
                    </label>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* REGION / VILLE dynamique DB */}
        <div className="flex items-center px-3 gap-2 shrink-0">
          <MapPin size={10} className="text-blue-500" />
          <select value={region} onChange={e => setRegion(e.target.value)} className="bg-transparent font-bold text- focus:outline-none cursor-pointer max-w- text-neutral-300">
            <option value="" className="bg-black">Toutes Régions</option>
            {(regionsDB.length? regionsDB : ["Analamanga","Boeny","DIANA"]).map(r => <option key={r} value={r} className="bg-black">{r}</option>)}
          </select>
          <select value={ville} onChange={e => setVille(e.target.value)} className="bg-transparent font-bold text- border-l border-neutral-800 pl-2 ml-1 focus:outline-none cursor-pointer max-w- text-white">
            <option value="" className="bg-black">Villes</option>
            {(villesDB.length? villesDB : ["Antananarivo","Mahajanga"]).map(v => <option key={v} value={v} className="bg-black">{v}</option>)}
          </select>
        </div>
      </div>

      {/* CHIPS */}
      {(q || region || ville ||!isAllSelected) && (
        <div className="min-h- flex items-center gap-1.5 px-3 py-1.5 bg-[#050505] border-t border-neutral-900 flex-wrap">
          {q && <span className="h-5 px-2 rounded-full bg-white text-black text- font-bold flex items-center gap-1">{q}<X size={10} className="cursor-pointer" onClick={() => setQ("")} /></span>}
          {region && <span className="h-5 px-2 rounded-full bg-blue-600 text-white text- font-bold flex items-center gap-1">{region}<X size={10} className="cursor-pointer" onClick={() => setRegion("")} /></span>}
          {ville && <span className="h-5 px-2 rounded-full bg-neutral-800 border border-neutral-700 text- flex items-center gap-1">{ville}<X size={10} className="cursor-pointer" onClick={() => setVille("")} /></span>}
          {!isAllSelected && selectedDisciplines.slice(0, 3).map((d: string) => <span key={d} className="h-5 px-2 rounded-full bg-red-700 text-white text- font-bold flex items-center gap-1">{d}<X size={10} className="cursor-pointer" onClick={() => toggleDiscipline(d as any)} /></span>)}
          {!isAllSelected && selectedDisciplines.length > 3 && <span className="h-5 px-2 rounded-full bg-neutral-800 text-">+{selectedDisciplines.length - 3}</span>}
        </div>
      )}
    </div>
  );
}