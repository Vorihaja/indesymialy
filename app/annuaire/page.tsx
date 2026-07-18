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
      <div className="max-w- mx-auto px-4 sm:px-8 py-6">
        {/* HEADER */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <h1 className="font-mono font-black text- tracking-widest">ANNUAIRE</h1>
            <p className="font-mono text- text-neutral-500 uppercase">Tous les rôles • {data.length} résultats</p>
          </div>
        </div>

        {/* ONGLETS */}
        <div className="w-full overflow-x-auto scrollbar-hide border-b border-neutral-900 mb-6">
          <div className="flex gap-1 min-w-max pb-0">
            {ROLES.map(r=>{
              const isActive = active===r.key
              return (
                <button
                  key={r.key}
                  onClick={()=>setActive(r.key)}
                  className={`h-10 px-5 font-mono text- font-bold uppercase tracking-widest whitespace-nowrap border-b-2 transition-all
                    ${isActive? "border-white text-white bg-neutral-900" : "border-transparent text-neutral-500 hover:text-white hover:bg-neutral-900/50"}`}
                >
                  {r.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* GRID */}
        {loading? <div className="font-mono text- text-neutral-600">Chargement {active}...</div> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {data.map(org=>(
              <Link key={org.id} href={`/annuaire/${org.id}`} className="group bg-neutral-950 border border-neutral-900 rounded-2xl p-4 hover:border-white/20 transition">
                <div className="flex gap-3">
                  <div className="w-12 h-12 rounded-xl bg-neutral-900 grid place-items-center font-mono font-black text-">{org.name?.[0]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-mono font-bold text- truncate group-hover:text-white">{org.name}</div>
                    <div className="font-mono text- text-neutral-500 uppercase">{org.type} • {org.region||""} {org.ville||""}</div>
                    <div className="font-mono text- text-neutral-600 mt-1 truncate">{org.discipline||"—"}</div>
                  </div>
                </div>
              </Link>
            ))}
            {data.length===0 && <div className="col-span-full py-20 text-center font-mono text- text-neutral-600 border border-dashed border-neutral-800 rounded-2xl">Aucun {active} trouvé • vérifie le champ `type` dans `organizations`</div>}
          </div>
        )}
      </div>
    </div>
  )
}