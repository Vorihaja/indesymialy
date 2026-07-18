"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/client"

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
  const [selectedRoles,setSelectedRoles] = useState<string[]>([])
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

  const handleSignup = async ()=>{
    try{
      if(!selectedRegion ||!selectedCity) throw new Error("Choisis ta région et ta ville")
      if(!selectedRoles.length) throw new Error("Choisis au moins 1 rôle")
      setLoading(true); setMsg("")
      const { error: suErr } = await supabase.auth.signUp({ email, password })
      if(suErr) throw suErr
      const { data: li, error: liErr } = await supabase.auth.signInWithPassword({ email, password })
      if(liErr) throw liErr
      const uid = li.user?.id; if(!uid) throw new Error("Erreur session")
      if(selectedRoles.length) await supabase.from("user_roles").insert(selectedRoles.map(rid=>({ user_id: uid, role_id: rid })))
      if(selectedDisc.length) await supabase.from("user_disciplines").insert(selectedDisc.map(did=>({ user_id: uid, discipline_id: did })))
      await supabase.from("profiles").upsert({ id: uid, email, region_id: selectedRegion, city_id: selectedCity }, { onConflict: 'id' })
      router.push("/dashboard")
    }catch(err:any){
      setMsg(err.message || "Erreur")
    }finally{ setLoading(false) }
  }

  const handleSignin = async ()=>{
    try{
      setLoading(true); setMsg("")
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if(error) throw error
      router.push(email === "jayaherve@proton.me"? "/admin" : "/dashboard")
    }catch(err:any){ setMsg(err.message) } finally{ setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-[#050507] text-white flex">
      {/* LEFT - BRAND */}
      <div className="hidden lg:flex w-[44%] relative border-r border-white/10 p-12 flex-col justify-between overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.08),transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,rgba(255,255,255,0.02)_100%)]" />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center font-black text-">IM</div>
            <span className="tracking-[0.3em] text- font-bold">INDESY MIALY</span>
          </div>
          <h1 className="mt-20 text- font-black leading-[0.85] tracking-tighter">
            LE SANG.<br/>LA TERRE.<br/>LE COMBAT.
          </h1>
          <p className="mt-6 text- leading-6 text-zinc-400 max-w-">
            Premier écosystème malgache des sports de combat. 4 blocs interconnectés : Informatif, Réseau Social, ERP, Marketplace.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-3">
            {[
              ["Site Informatif","Clubs, combats, actus"],
              ["Réseau Social","Fans, combattants, orgas"],
              ["ERP","Gestion membres & events"],
              ["Marketplace","Équipements & billets"]
            ].map(([t,d])=>(
              <div key={t} className="border border-white/10 rounded-xl p-3 bg-white/[0.02]">
                <p className="text- font-bold tracking-widest">{t}</p>
                <p className="text- text-zinc-500 mt-1">{d}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="relative z-10 text- tracking-widest text-zinc-600">ANTANANARIVO • 2026 • BUILT FOR FIGHTERS</p>
      </div>

      {/* RIGHT - FORM */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-">
          <div className="flex gap-2 mb-8">
            {[1,2,3].map(i=>(
              <div key={i} className={`h- flex-1 transition-all ${mode==="signin"? "bg-white" : i<=step? "bg-white" : "bg-white/10"}`} />
            ))}
          </div>

          <h2 className="text-3xl font-black tracking-tighter">
            {mode==="signin"? "BON RETOUR." : step===1? "QUI ES-TU?" : step===2? "D'OÙ VIENS-TU?" : "TU COMBATS QUOI?"}
          </h2>
          <p className="text- text-zinc-500 mt-2 tracking-wide">
            {mode==="signin"? "Connecte-toi à ton écosystème" : "Inscription en 20 secondes • Rôles multiples possibles"}
          </p>

          <div className="mt-8 space-y-4">
            {mode==="signup" && step===1 && <>
              <div className="space-y-3">
                <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="w-full bg-[#0E0E10] border border-white/10 rounded-xl px-4 py-3.5 text- outline-none focus:border-white/30" />
                <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Mot de passe" className="w-full bg-[#0E0E10] border border-white/10 rounded-xl px-4 py-3.5 text- outline-none focus:border-white/30" />
              </div>
              <button onClick={()=>{ if(!email||!password){ setMsg("Renseigne email et mdp"); return } setStep(2)}} className="w-full bg-white text-black font-black tracking-widest text- py-4 rounded-xl hover:bg-zinc-200 transition">CONTINUER →</button>
            </>}

            {mode==="signup" && step===2 && <>
              <div className="grid grid-cols-2 gap-3">
                <select value={selectedRegion} onChange={e=>{setSelectedRegion(e.target.value); setSelectedCity("")}} className="bg-[#0E0E10] border border-white/10 rounded-xl px-3 py-3.5 text-">
                  <option value="">Région</option>
                  {regions.map((r:any)=><option key={r.id} value={r.id}>{r.nom || r.name}</option>)}
                </select>
                <select value={selectedCity} onChange={e=>setSelectedCity(e.target.value)} className="bg-[#0E0E10] border border-white/10 rounded-xl px-3 py-3.5 text-">
                  <option value="">Ville</option>
                  {filteredCities.map((c:any)=><option key={c.id} value={c.id}>{c.nom || c.name}</option>)}
                </select>
              </div>

              <p className="text- tracking-widest font-bold text-zinc-400 pt-2">TES RÔLES</p>
              <div className="grid grid-cols-2 gap-2">
                {roles.map((r:any)=>{
                  const active = selectedRoles.includes(r.id)
                  return (
                    <button type="button" key={r.id} onClick={()=>toggle(selectedRoles, r.id, setSelectedRoles)}
                      className={`text-left border rounded-xl p-3 flex items-center justify-between transition ${active? "bg-white text-black border-white" : "bg-[#0E0E10] border-white/10 hover:border-white/20"}`}>
                      <span className="text- font-bold">{r.label}</span>
                      <span className="text- opacity-60">{ROLE_ICONS[r.slug]||"•"}</span>
                    </button>
                  )
                })}
              </div>
              <div className="flex gap-2">
                <button onClick={()=>setStep(1)} className="flex-1 border border-white/10 rounded-xl py-4 text- tracking-widest">RETOUR</button>
                <button onClick={()=>setStep(3)} className="flex-[2] bg-white text-black font-black tracking-widest text- py-4 rounded-xl">SUIVANT →</button>
              </div>
            </>}

            {mode==="signup" && step===3 && <>
              <p className="text- tracking-widest font-bold text-zinc-400">TES DISCIPLINES</p>
              <div className="flex flex-wrap gap-2 max-h- overflow-auto pr-1">
                {disciplines.map((d:any)=>{
                  const active = selectedDisc.includes(d.id)
                  return (
                    <button type="button" key={d.id} onClick={()=>toggle(selectedDisc, d.id, setSelectedDisc)}
                      className={`rounded-full px-3 py-1.5 text- border transition ${active? "bg-white text-black border-white" : "bg-[#0E0E10] border-white/10 text-zinc-400"}`}>
                      {d.nom || d.name}
                    </button>
                  )
                })}
              </div>
              <button onClick={handleSignup} disabled={loading} className="w-full bg-white text-black font-black tracking-widest text- py-4 rounded-xl disabled:opacity-50">
                {loading? "CRÉATION..." : "REJOINDRE INDESY MIALY"}
              </button>
              <button onClick={()=>setStep(2)} className="w-full border border-white/10 rounded-xl py-3 text- tracking-widest">RETOUR</button>
            </>}

            {mode==="signin" && <>
              <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="w-full bg-[#0E0E10] border border-white/10 rounded-xl px-4 py-3.5 text-" />
              <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Mot de passe" className="w-full bg-[#0E0E10] border border-white/10 rounded-xl px-4 py-3.5 text-" />
              <button onClick={handleSignin} disabled={loading} className="w-full bg-white text-black font-black tracking-widest text- py-4 rounded-xl">{loading? "..." : "SE CONNECTER"}</button>
            </>}
          </div>

          <div className="mt-6 flex justify-center">
            <button onClick={()=>{ setMode(mode==="signin"?"signup":"signin"); setStep(1); setMsg("") }} className="text- tracking-widest text-zinc-500 hover:text-white transition underline underline-offset-8">
              {mode==="signin"? "Pas encore de compte? S'inscrire" : "Déjà membre? Se connecter"}
            </button>
          </div>

          {msg && <p className="mt-6 text- bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl p-3">{msg}</p>}
        </div>
      </div>
    </div>
  )
}