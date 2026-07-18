"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/client"
import Link from "next/link"

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

export default function AnnuairePage(){
  const supabase = createClient()
  const [active, setActive] = useState("club")
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(()=>{
    (async()=>{
      setLoading(true)
      const { data: res } = await supabase.from("organizations").select("*").ilike("type", `%${active}%`).limit(100)
      setData(res||[])
      setLoading(false)
    })()
  },[active])

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-[1680px] mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* HEADER - style navbar */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="font-mono font-black text-2xl tracking-widest uppercase">ANNUAIRE</h1>
            <p className="font-mono text-xs text-neutral-500 uppercase mt-1">Tous les rôles • {data.length} résultats</p>
          </div>
        </div>

        {/* ONGLETS - pills style navbar comme events page */}
        <div className="w-full overflow-x-auto scrollbar-hide border-b border-neutral-900 pb-0">
          <div className="flex gap-2 min-w-max pb-4">
            {ROLES.map(r=>{
              const isActive = active===r.key
              return (
                <button
                  key={r.key}
                  onClick={()=>setActive(r.key)}
                  className={`h-9 px-4 font-mono text-xs font-bold uppercase tracking-widest whitespace-nowrap rounded-full border transition-all
                    ${isActive? "bg-white text-black border-white" : "bg-neutral-950 text-neutral-500 border-neutral-900 hover:text-white hover:border-white/20"}`}
                >
                  {r.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* GRID */}
        {loading? <div className="font-mono text-sm text-neutral-600">Chargement {active}...</div> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {data.map(org=>(
              <Link key={org.id} href={`/annuaire/${org.id}`} className="group bg-neutral-950 border border-neutral-900 rounded-2xl p-4 hover:border-white/20 transition-all">
                <div className="flex gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white text-black grid place-items-center font-mono font-black text-sm">{org.name?.[0]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-mono font-bold text-sm truncate group-hover:text-white">{org.name}</div>
                    <div className="font-mono text-[11px] text-neutral-500 uppercase truncate">{org.type} • {org.region||""} {org.ville||""}</div>
                    <div className="font-mono text-[11px] text-neutral-600 mt-1 truncate">{org.discipline||"—"}</div>
                  </div>
                </div>
              </Link>
            ))}
            {data.length===0 && <div className="col-span-full py-20 text-center font-mono text-sm text-neutral-600 border border-dashed border-neutral-800 rounded-2xl bg-neutral-950">Aucun {active} trouvé • vérifie le champ `type` dans `organizations`</div>}
          </div>
        )}
      </div>
    </div>
  )
}
