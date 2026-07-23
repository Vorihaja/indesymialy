"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/client"
import { getRoleDashboardPath } from "@/lib/role-routing"

const ROLE_ICONS: any = {
  fan: "◐", combattant: "🥊", coach: "◑", club: "⬢", federation: "⬣", organisateur: "◈", sponsor: "⬔", vendeur: "⬕", juge: "⬖", arbitre: "⬗"
}

export default function AuthPage(){
  const supabase = createClient()
  const router = useRouter()
  const [mode,setMode] = useState<"signin"|"signup">("signup")
  const [step,setStep] = useState(1)
  const [email,setEmail] = useState("")
  const [password,setPassword] = useState("")
  const [roles,setRoles] = useState<any[]>([])
  const [disciplines,setDisciplines] = useState<any[]>([])
  const [regions,setRegions] = useState<any[]>([])
  const [cities,setCities] = useState<any[]>([])
  const [selectedRole,setSelectedRole] = useState("")
  const [selectedDisc,setSelectedDisc] = useState<string[]>([])
  const [selectedRegion,setSelectedRegion] = useState("")
  const [selectedCity,setSelectedCity] = useState("")
  const [loading,setLoading] = useState(false)
  const [msg,setMsg] = useState("")

  useEffect(()=>{
    supabase.from("roles").select("*").then(r=>setRoles(r.data||[]))
    supabase.from("disciplines").select("*").then(r=>setDisciplines(r.data||[]))
    supabase.from("regions").select("*").then(r=>setRegions(r.data||[]))
    supabase.from("cities").select("*").then(r=>setCities(r.data||[]))
  },[])

  const filteredCities = cities.filter((c:any)=>!selectedRegion || c.region_id === selectedRegion)
  const toggle = (list:string[], id:string, set:any)=> set(list.includes(id)? list.filter((x:string)=>x!==id) : [...list, id])

  const redirectToRoleDashboard = async (userId: string, userEmail?: string | null) => {
    if (userEmail === "jayaherve@proton.me") { router.push("/admin"); return }
    const { data: userRole } = await supabase.from("user_roles").select("roles(slug)").eq("user_id", userId).limit(1).maybeSingle()
    const role = userRole?.roles as { slug?: string } | { slug?: string }[] | null
    router.push(getRoleDashboardPath(Array.isArray(role) ? role[0]?.slug : role?.slug))
  }

  const handleSignup = async ()=>{
    try{
      if(!selectedRegion ||!selectedCity) throw new Error("Choisis ta région et ta ville")
      if(!selectedRole) throw new Error("Choisis un rôle")
      setLoading(true); setMsg("")
      const { error: suErr } = await supabase.auth.signUp({ email, password })
      if(suErr) throw suErr
      const { data: li, error: liErr } = await supabase.auth.signInWithPassword({ email, password })
      if(liErr) throw liErr
      const uid = li.user?.id; if(!uid) throw new Error("Erreur session")
      const { error: roleError } = await supabase.from("user_roles").insert({ user_id: uid, role_id: selectedRole })
      if(roleError) throw roleError
      if(selectedDisc.length) await supabase.from("user_disciplines").insert(selectedDisc.map(did=>({ user_id: uid, discipline_id: did })))
      await supabase.from("profiles").upsert({ id: uid, email, region_id: selectedRegion, city_id: selectedCity }, { onConflict: 'id' })
      const selectedRoleData = roles.find((role:any) => role.id === selectedRole)
      router.push(getRoleDashboardPath(selectedRoleData?.slug))
    }catch(err:any){
      setMsg(err.message || "Erreur")
    }finally{ setLoading(false) }
  }

  const handleSignin = async ()=>{
    try{
      setLoading(true); setMsg("")
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if(error) throw error
      if(!data.user) throw new Error("Session introuvable")
      await redirectToRoleDashboard(data.user.id, data.user.email)
    }catch(err:any){ setMsg(err.message) } finally{ setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex">
      {/* LEFT - BRAND & ERP SPECIFICITY */}
      <div className="hidden lg:flex w-[44%] relative border-r border-white/10 p-12 flex-col justify-between overflow-hidden bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('https://jwoxjvrsgywmlvbzhyoi.supabase.co/storage/v1/object/public/public-images/logo_sans_fond')", backgroundBlendMode: "overlay" }}>
        <div className="absolute inset-0 bg-black/60 z-0" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.05),transparent_50%)] z-0" />
        <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,rgba(0,0,0,0.4)_100%)] z-0" />
        
        <div className="relative z-10">
          
          <h1 className="mt-20 text-5xl font-black leading-[0.85] tracking-tighter uppercase">
            CARRIERE.<br/>BUSINESS.
            <br/>COMMUNAUTE.
          </h1>
                   
        </div>
        
        <p className="relative z-10 text-xs tracking-widest text-zinc-500">INDESY MIALY ERP • 2026 </p>
      </div>

      {/* RIGHT - FORM */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="flex gap-2 mb-8">
            {[1,2,3].map(i=>(
              <div key={i} className={`h-1 flex-1 transition-all rounded-none ${mode==="signin"? "bg-blue-600" : i<=step? "bg-red-600" : "bg-white/10"}`} />
            ))}
          </div>

          <h2 className="text-3xl font-black tracking-tighter">
            {mode==="signin"? "BON RETOUR." : step===1? "QUI ES-TU?" : step===2? "D'OÙ VIENS-TU?" : "TU COMBATS QUOI?"}
          </h2>
          <p className="text-sm text-zinc-500 mt-2 tracking-wide">
            {mode==="signin"? "Connecte-toi à ton écosystème" : "Inscription en 20 secondes • Choisis ton rôle initial"}
          </p>

          <div className="mt-8 space-y-4">
            {mode==="signup" && step===1 && <>
              <div className="space-y-3">
                <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="w-full bg-neutral-900 border border-white/10 rounded-none px-4 py-3.5 text-sm outline-none focus:border-blue-500 transition" />
                <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Mot de passe" className="w-full bg-neutral-900 border border-white/10 rounded-none px-4 py-3.5 text-sm outline-none focus:border-blue-500 transition" />
              </div>
              <button onClick={()=>{ if(!email||!password){ setMsg("Renseigne email et mdp"); return } setStep(2)}} className="w-full bg-blue-600 text-white font-black tracking-widest text-sm py-4 rounded-none hover:bg-blue-500 transition">CONTINUER →</button>
            </>}

            {mode==="signup" && step===2 && <>
              <div className="grid grid-cols-2 gap-3">
                <select value={selectedRegion} onChange={e=>{setSelectedRegion(e.target.value); setSelectedCity("")}} className="bg-neutral-900 border border-white/10 rounded-none px-3 py-3.5 text-sm outline-none focus:border-blue-500 transition">
                  <option value="">Région</option>
                  {regions.map((r:any)=><option key={r.id} value={r.id}>{r.nom || r.name}</option>)}
                </select>
                <select value={selectedCity} onChange={e=>setSelectedCity(e.target.value)} className="bg-neutral-900 border border-white/10 rounded-none px-3 py-3.5 text-sm outline-none focus:border-blue-500 transition">
                  <option value="">Ville</option>
                  {filteredCities.map((c:any)=><option key={c.id} value={c.id}>{c.nom || c.name}</option>)}
                </select>
              </div>

              <p className="text-xs tracking-widest font-bold text-zinc-400 pt-2">TES RÔLES</p>
              <div className="grid grid-cols-2 gap-2">
                {roles.map((r:any)=>{
                  const active = selectedRole === r.id
                  return (
                    <button type="button" key={r.id} onClick={()=>setSelectedRole(r.id)}
                      className={`text-left border rounded-none p-3 flex items-center justify-between transition ${active? "bg-blue-600 text-white border-blue-500" : "bg-neutral-900 border-white/10 hover:border-white/20"}`}>
                      <span className="text-sm font-bold">{r.label}</span>
                      <span className="text-base opacity-60">{ROLE_ICONS[r.slug]||"•"}</span>
                    </button>
                  )
                })}
              </div>
              <div className="flex gap-2">
                <button onClick={()=>setStep(1)} className="flex-1 border border-white/10 rounded-none py-4 text-xs tracking-widest hover:border-white/20 transition">RETOUR</button>
                <button onClick={()=>setStep(3)} className="flex-[2] bg-blue-600 text-white font-black tracking-widest text-sm py-4 rounded-none hover:bg-blue-500 transition">SUIVANT →</button>
              </div>
            </>}

            {mode==="signup" && step===3 && <>
              <p className="text-xs tracking-widest font-bold text-zinc-400">TES DISCIPLINES</p>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-auto pr-1">
                {disciplines.map((d:any)=>{
                  const active = selectedDisc.includes(d.id)
                  return (
                    <button type="button" key={d.id} onClick={()=>toggle(selectedDisc, d.id, setSelectedDisc)}
                      className={`px-3 py-1.5 text-xs border rounded-none transition ${active? "bg-blue-600 text-white border-blue-500" : "bg-neutral-900 border-white/10 text-zinc-400 hover:border-white/20"}`}>
                      {d.nom || d.name}
                    </button>
                  )
                })}
              </div>
              <button onClick={handleSignup} disabled={loading} className="w-full bg-blue-600 text-white font-black tracking-widest text-sm py-4 rounded-none disabled:opacity-50 hover:bg-blue-500 transition">
                {loading? "CRÉATION..." : "REJOINDRE INDESY MIALY"}
              </button>
              <button onClick={()=>setStep(2)} className="w-full border border-white/10 rounded-none py-3 text-xs tracking-widest hover:border-white/20 transition">RETOUR</button>
            </>}

            {mode==="signin" && <>
              <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="w-full bg-neutral-900 border border-white/10 rounded-none px-4 py-3.5 text-sm outline-none focus:border-blue-500 transition" />
              <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Mot de passe" className="w-full bg-neutral-900 border border-white/10 rounded-none px-4 py-3.5 text-sm outline-none focus:border-blue-500 transition" />
              <button onClick={handleSignin} disabled={loading} className="w-full bg-blue-600 text-white font-black tracking-widest text-sm py-4 rounded-none hover:bg-blue-500 transition">{loading? "..." : "SE CONNECTER"}</button>
            </>}
          </div>

          <div className="mt-6 flex justify-center">
            <button onClick={()=>{ setMode(mode==="signin"?"signup":"signin"); setStep(1); setMsg("") }} className="text-xs tracking-widest text-zinc-500 hover:text-white transition underline underline-offset-8">
              {mode==="signin"? "Pas encore de compte? S'inscrire" : "Déjà membre? Se connecter"}
            </button>
          </div>

          {msg && <p className="mt-6 text-sm bg-red-500/10 border border-red-500/20 text-red-400 rounded-none p-3">{msg}</p>}
        </div>
      </div>
    </div>
  )
}
