"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/client"

const ROLE_CONFIG: any = {
  super_admin: { label: "SUPER ADMIN", color: "#1230ff", modules: ["Tous les modules"] },
  federation: { label: "FÉDÉRATION", color: "#1230ff", modules: ["Ligues", "Clubs", "Licences", "Compétitions", "Finances"] },
  ligue: { label: "LIGUE", color: "#1230ff", modules: ["Clubs", "Compétitions", "Arbitres", "Finances"] },
  club: { label: "CLUB / DOJO", color: "#00e676", modules: ["Membres", "Combattants", "Coachs", "Finances", "Boutique"] },
  coach: { label: "COACH", color: "#00e676", modules: ["Mes Combattants", "Planning", "Résultats"] },
  combattant: { label: "COMBATTANT", color: "#ff3b30", modules: ["Ma Licence", "Mes Combats", "Palmarès", "Poids"] },
  arbitre: { label: "ARBITRE / JUGE", color: "#ffcc00", modules: ["Désignations", "Events à juger", "Historique"] },
  organisateur: { label: "ORGANISATEUR", color: "#1230ff", modules: ["Créer Event", "Inscriptions", "Scan QR", "Billetterie"] },
  vendeur: { label: "VENDEUR", color: "#00e676", modules: ["Produits", "Stock", "Commandes", "CA"] },
  fan: { label: "FAN", color: "#5b7cff", modules: ["Favoris", "Billets", "Combattants suivis"] },
}

export default function Dashboard(){
  const supabase = createClient()
  const router = useRouter()
  const [loading,setLoading]=useState(true)
  const [roles,setRoles]=useState<string[]>([])
  const [activeRole,setActiveRole]=useState<string>("")
  const [org,setOrg]=useState<any>(null)
  const [userEmail,setUserEmail]=useState("")

  useEffect(()=>{(async()=>{
    const { data: { user } } = await supabase.auth.getUser()
    if(!user){ router.push("/auth"); return }
    setUserEmail(user.email||"")

    if(user.email === "jayaherve@proton.me"){
      setRoles(["super_admin"])
      setActiveRole("super_admin")
      setLoading(false)
      return
    }

    const { data: profile } = await supabase.from("profiles").select("id").eq("id", user.id).single()
    const { data: userRoles } = await supabase.from("user_roles").select("roles(slug)").eq("user_id", user.id)
    const slugs = userRoles?.map((ur:any)=>ur.roles.slug) || []

    if(slugs.length===0){
      // Pas de rôle -> on lui met fan par défaut
      const { data: fanRole } = await supabase.from("roles").select("id").eq("slug","fan").single()
      if(fanRole){
        await supabase.from("user_roles").insert({ user_id: user.id, role_id: fanRole.id })
        setRoles(["fan"])
        setActiveRole("fan")
      }
    } else {
      setRoles(slugs)
      setActiveRole(slugs[0])
    }

    // Cherche son orga si rôle orga
    const orgRoles = ["federation","ligue","club","organisateur","vendeur"]
    if(slugs.some((s:string)=>orgRoles.includes(s))){
      const { data: orgData } = await supabase.from("organizations").select("*").eq("owner_id", user.id).limit(1).single()
      if(orgData) setOrg(orgData)
    }

    setLoading(false)
  })()},[])

  if(loading) return <div className="fixed inset-0 z-[9999] bg-[#060a14] grid place-items-center text-white text- tracking-widest">DASHBOARD • LOADING</div>

  const config = ROLE_CONFIG[activeRole] || ROLE_CONFIG.fan

  return (
    <div className="fixed inset-0 z-[9998] bg-[#060a14] text-white flex overflow-hidden antialiased">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=JetBrains+Mono:wght@400;700&display=swap'); *{font-family:Inter,sans-serif}.mono{font-family:JetBrains Mono,monospace}`}</style>

      <aside style={{width:'250px'}} className="shrink-0 bg-[#080d1c] border-r border-[rgba(26,42,90,0.4)] flex flex-col">
        <div className="h- px-4 flex items-center gap-2.5 border-b border-[rgba(26,42,90,0.25)]">
          <div className="w-7 h-7 rounded-full bg-[#1230ff] grid place-items-center text- font-black">IM</div>
          <div className="flex flex-col leading-none gap-"><span className="text- font-bold mono truncate">{config.label}</span><span className="text- text-zinc-500 mono truncate">{userEmail.split("@")[0]}</span></div>
        </div>
        <nav className="flex-1 px-2.5 pt-4 flex flex-col gap-1">
          {config.modules.map((m:string)=><button key={m} className="h-9 w-full rounded-lg text- font-bold mono text-left px-3 bg-[#0b1226] border border-[rgba(26,42,90,0.3)] text-zinc-400 hover:text-white">{m}</button>)}
        </nav>
        <div className="p-2.5 border-t border-[rgba(26,42,90,0.25)] space-y-2">
          {roles.length>1 && (
            <div className="space-y-1">
              <p className="text- mono text-zinc-600">SWITCH RÔLE</p>
              <div className="flex flex-wrap gap-1">
                {roles.map(r=><button key={r} onClick={()=>setActiveRole(r)} className={`text- mono px-2 py-1 rounded-full border ${activeRole===r?'bg-[#1230ff] text-white border-[#1230ff]':'bg-[#0b1226] text-zinc-500 border-[rgba(26,42,90,0.4)]'}`}>{r}</button>)}
              </div>
            </div>
          )}
          <button onClick={()=>router.push("/")} className="h-9 w-full rounded-lg bg-[#0b1226] border border-[rgba(26,42,90,0.6)] text- mono text-zinc-400">← SITE</button>
          {activeRole==="super_admin" && <button onClick={()=>router.push("/admin")} className="h-9 w-full rounded-lg bg-[#1230ff] text- mono font-bold">SUPER ADMIN</button>}
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-auto">
        <div className="w-full max-w- p-5 lg:p-8">
          <div className="mb-7 flex justify-between items-start">
            <div><h1 className="text- lg:text- font-black leading-none">{config.label} • DASHBOARD</h1><p className="mt-2 text- font-bold tracking-[0.2em] text-[#5b7cff] mono uppercase">RÔLE: {activeRole} • INDESY MIALY</p></div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse" /><span className="text- mono text-zinc-500">EN LIGNE</span></div>
          </div>

          {!org && ["federation","ligue","club","organisateur","vendeur"].includes(activeRole)? (
            <div className="bg-[#0b1226] border border-[rgba(26,42,90,0.6)] rounded-2xl p-10 text-center">
              <h2 className="text- font-black">Aucune organisation trouvée</h2>
              <p className="text- text-zinc-500 mt-2">Tu es {activeRole} mais tu n'as pas encore créé ton {activeRole}. Crée-la pour apparaître dans l'annuaire.</p>
              <button onClick={async()=>{
                const name = prompt(`Nom de ton ${activeRole}?`)
                if(!name) return
                const { data: { user } } = await supabase.auth.getUser()
                const { data, error } = await supabase.from("organizations").insert({ name, type: activeRole, owner_id: user?.id }).select().single()
                if(error) alert(error.message)
                else { setOrg(data); location.reload() }
              }} className="mt-6 h-10 px-6 rounded-xl bg-[#1230ff] text- font-bold mono">+ CRÉER MON {activeRole.toUpperCase()}</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <div className="h- bg-[#0b1226] border border-[rgba(26,42,90,0.6)] rounded-2xl p-5 flex flex-col justify-between"><div className="text- mono text-zinc-500">ORGANISATION</div><div><div className="text- font-black leading-tight truncate">{org?.name || "Perso"}</div><div className="text- mono text-zinc-500 mt-1">{activeRole}</div></div></div>
                <div className="h- bg-[#0b1226] border border-[rgba(26,42,90,0.6)] rounded-2xl p-5 flex flex-col justify-between"><div className="text- mono text-zinc-500">STAT 1</div><div className="text- font-black">0</div></div>
                <div className="h- bg-[#0b1226] border border-[rgba(26,42,90,0.6)] rounded-2xl p-5 flex flex-col justify-between"><div className="text- mono text-zinc-500">STAT 2</div><div className="text- font-black">0</div></div>
                <div className="h- bg-[#1230ff] rounded-2xl p-5 flex flex-col justify-between"><div className="text- mono text-white/70">ACTION</div><div className="text- font-bold">Prêt à démarrer</div></div>
              </div>

              <div className="bg-[#0b1226] border border-[rgba(26,42,90,0.6)] rounded-2xl p-5">
                <h2 className="text- font-bold mono tracking-[0.16em]">MODULES • {activeRole.toUpperCase()}</h2>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                  {config.modules.map((m:string)=><div key={m} className="h-20 bg-[#080e20] rounded-xl border border-[rgba(26,42,90,0.25)] p-4 flex flex-col justify-between"><span className="text- font-medium">{m}</span><span className="text- mono text-zinc-600">À implémenter</span></div>)}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}