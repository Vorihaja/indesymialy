"use client"
import { useEffect, useState, useMemo, Suspense } from "react"
import { createClient } from "@/lib/client"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { useDisciplineFilter } from "../../providers/search/discipline-filter-context"

const ROLES = [
  { key: "combattant", label: "Combattants" },
  { key: "organisateur", label: "Organisateurs" },
  { key: "coach", label: "Coachs" },
  { key: "club", label: "Clubs" },
  { key: "arbitre", label: "Arbitres" },
  { key: "federation", label: "Fédération" },
  { key: "fan", label: "Fans" },
  { key: "sponsor", label: "Sponsors" },
  { key: "vendeur", label: "Vendeurs" },
] as const

function AnnuaireContent() {
  const supabase = createClient()
  const [active, setActive] = useState("club")
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Filtres globaux depuis GlobalSearchBar
  const { selectedDisciplines, isAllSelected } = useDisciplineFilter()
  const searchParams = useSearchParams()
  const globalSearch = searchParams?.get("search") || ""
  const globalRegion = searchParams?.get("region") || ""
  const globalVille = searchParams?.get("ville") || ""

  useEffect(() => {
    (async () => {
      setLoading(true)
      const { data: res } = await supabase.from("organizations").select("*").ilike("type", `%${active}%`).limit(200)
      setData(res || [])
      setLoading(false)
    })()
  }, [active])

  // Filtre client-side avec les filtres globaux
  const filteredData = useMemo(() => {
    return data.filter(org => {
      if (globalSearch && !org.name?.toLowerCase().includes(globalSearch.toLowerCase())) return false
      if (globalRegion && org.region && !org.region.toLowerCase().includes(globalRegion.toLowerCase())) return false
      if (globalVille && org.ville && !org.ville.toLowerCase().includes(globalVille.toLowerCase())) return false
      if (!isAllSelected && org.discipline && !selectedDisciplines.some((d: string) => org.discipline?.toLowerCase().includes(d.toLowerCase()))) return false
      return true
    })
  }, [data, globalSearch, globalRegion, globalVille, selectedDisciplines, isAllSelected])

  return (
    <div className="min-h-screen bg-neutral-950 text-white selection:bg-red-600 selection:text-white antialiased">
      <div className="max-w-[1680px] mx-auto px-4 sm:px-8 py-8 space-y-8">
        
        {/* HEADER - Brut & Typé Combat */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b-2 border-neutral-900 pb-6">
          <div className="space-y-1">
            <h1 className="font-mono font-black text-[36px] leading-none tracking-tighter uppercase text-white">
              ANNUAIRE <span className="text-red-600">/</span> {ROLES.find(r => r.key === active)?.label}
            </h1>
            <div className="flex items-center gap-2">
              <span className="h-1 w-8 bg-red-600 rounded-none" />
              <p className="font-mono text-[11px] font-bold tracking-widest text-neutral-500 uppercase">
                Base de données live • {filteredData.length} fiches{filteredData.length !== data.length ? ` / ${data.length}` : ""}
              </p>
            </div>
          </div>
        </div>

        {/* ONGLETS - Onglets Angulaires Sans Arrondis */}
        <div className="relative">
          <div className="w-full overflow-x-auto [scrollbar-width:none]">
            <div className="flex gap-1 min-w-max pr-4">
              {ROLES.map(r => {
                const isActive = active === r.key
                return (
                  <button
                    key={r.key}
                    onClick={() => setActive(r.key)}
                    className={`h-[42px] px-[20px] font-mono text-[11px] font-black uppercase tracking-wider whitespace-nowrap rounded-none border transition-none
                      ${isActive
                        ? "bg-white text-black border-white"
                        : "bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white hover:bg-neutral-800 hover:border-neutral-700"}`}
                  >
                    {r.label}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="pointer-events-none absolute right-0 top-0 h-full w-12 bg-gradient-to-l from-neutral-950 to-transparent sm:hidden" />
        </div>

        {/* Bandeau filtre global actif - Carré & Agressif */}
        {(!isAllSelected || globalSearch || globalRegion || globalVille) && (
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-neutral-900 border-l-4 border-amber-500 rounded-none">
            <div className="flex items-center gap-2 font-mono text-[11px] font-black text-amber-500 uppercase tracking-wider">
              FILTRES ACTIFS
            </div>
            <div className="h-4 w-px bg-neutral-800 hidden sm:block" />
            <div className="flex flex-wrap gap-2">
              {globalSearch && <span className="px-3 py-1 bg-white text-black rounded-none text-[10px] font-mono font-black uppercase tracking-wider">{globalSearch}</span>}
              {globalRegion && <span className="px-3 py-1 bg-neutral-800 text-neutral-200 border border-neutral-700 rounded-none text-[10px] font-mono font-bold uppercase tracking-wider">{globalRegion}</span>}
              {globalVille  && <span className="px-3 py-1 bg-neutral-800 text-neutral-200 border border-neutral-700 rounded-none text-[10px] font-mono font-bold uppercase tracking-wider">{globalVille}</span>}
              {!isAllSelected && <span className="px-3 py-1 bg-blue-950 text-blue-400 border border-blue-800 rounded-none text-[10px] font-mono font-black uppercase tracking-wider">{selectedDisciplines.length} DISCIPLINES</span>}
            </div>
          </div>
        )}

        {/* GRID - Cartes sans arrondis, bordures franches */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-[90px] bg-neutral-900 border border-neutral-800 rounded-none animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredData.map(org => (
              <Link 
                key={org.id} 
                href={`/annuaire/${org.id}`} 
                className="group relative bg-neutral-900 border border-neutral-800 rounded-none p-4 hover:bg-neutral-900 hover:border-neutral-600 transition-none block"
              >
                {/* Ligne d'accent de focus en haut de la carte */}
                <span className="absolute top-0 left-0 w-full h-[2px] bg-red-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left rounded-none" />
                
                <div className="flex gap-4 items-start">
                  {/* Avatar Carré Noir et Blanc */}
                  <div className="w-12 h-12 rounded-none bg-neutral-950 text-white border border-neutral-800 group-hover:bg-white group-hover:text-black group-hover:border-white grid place-items-center font-mono font-black text-[14px] shrink-0 transition-none">
                    {org.name?.[0]}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-mono font-black text-[14px] leading-tight truncate uppercase text-white group-hover:text-red-500 transition-none">
                      {org.name}
                    </div>
                    
                    <div className="font-mono text-[10px] leading-tight text-neutral-500 uppercase tracking-tighter mt-1 truncate">
                      {org.type} {org.region ? `• ${org.region}` : ""} {org.ville ? ` [${org.ville}]` : ""}
                    </div>
                    
                    {/* Badge Discipline Brut et Monochrome */}
                    <div className="inline-flex mt-2.5 px-2 py-0.5 bg-neutral-950 border border-neutral-800 rounded-none font-mono text-[9px] font-black text-neutral-400 uppercase tracking-widest truncate max-w-full group-hover:border-neutral-700 group-hover:text-neutral-200 transition-none">
                      {org.discipline || "NON SPÉCIFIÉ"}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
            
            {/* Cas vide rectiligne */}
            {filteredData.length === 0 && (
              <div className="col-span-full py-24 flex flex-col items-center gap-4 text-center border border-neutral-800 rounded-none bg-neutral-900">
                <div className="font-mono font-black text-[18px] text-neutral-700 uppercase tracking-tighter">— AUCUN RÉSULTAT —</div>
                <div className="font-mono text-[11px] font-bold text-neutral-500 uppercase tracking-wider px-4">
                  Aucun profil {active} ne correspond à vos filtres actuels {globalSearch ? `pour "${globalSearch}"` : ""}.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function AnnuairePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-950 text-white grid place-items-center font-mono text-xs">CHARGEMENT DE L'ANNUAIRE...</div>}>
      <AnnuaireContent />
    </Suspense>
  )
}