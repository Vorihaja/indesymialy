"use client"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/client"

const TABS = ["OVERVIEW","MEMBRES","PLANNING","PRESENCES","FINANCES","BOUTIQUE"] as const

export default function ERPClub(){
  const { orgId } = useParams() as { orgId: string }
  const supabase = createClient()
  const [tab,setTab]=useState<typeof TABS[number]>("OVERVIEW")
  const [org,setOrg]=useState<any>(null)
  const [members,setMembers]=useState<any[]>([])
  const [sessions,setSessions]=useState<any[]>([])
  const [transacs,setTransacs]=useState<any[]>([])
  const [newMember,setNewMember]=useState({full_name:"",discipline:"MMA",plan:"Mensuel"})

  const load = async()=>{
    const { data: o } = await supabase.from("organizations").select("*").eq("id",orgId).single()
    const { data: m } = await supabase.from("club_members").select("*").eq("organization_id",orgId).order("joined_at",{ascending:false})
    const { data: s } = await supabase.from("training_sessions").select("*").eq("organization_id",orgId)
    const { data: t } = await supabase.from("transactions").select("*").eq("organization_id",orgId).order("created_at",{ascending:false})
    setOrg(o); setMembers(m||[]); setSessions(s||[]); setTransacs(t||[])
  }
  useEffect(()=>{ load() },[orgId])

  const addMember = async()=>{
    if(!newMember.full_name) return
    await supabase.from("club_members").insert({...newMember, organization_id: orgId, expires_at: new Date(Date.now()+30*24*3600*1000)})
    setNewMember({full_name:"",discipline:"MMA",plan:"Mensuel"}); load()
  }
  const toggleStatus = async(id:string,status:string)=>{
    await supabase.from("club_members").update({status: status==="actif"?"impayé":"actif"}).eq("id",id); load()
  }

  const ca = transacs.filter(t=>t.type==="income").reduce((a,b)=>a+(b.amount||0),0)
  const actifs = members.filter(m=>m.status==="actif").length
  const impayes = members.filter(m=>m.status==="impayé").length

  return (
    <div className="fixed inset-0 z-[999] bg-[#060a14] text-white flex overflow-hidden">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');.mono{font-family:JetBrains Mono,monospace}`}</style>

      {/* ASIDE 250px COMME DEMANDÉ */}
      <aside style={{width:'250px'}} className="shrink-0 bg-[#080d1c] border-r border-[rgba(26,42,90,0.4)] flex flex-col">
        <div className="h- px-4 flex items-center gap-2 border-b border-white/10">
          <div className="w-7 h-7 rounded-full bg-[#1230ff] grid place-items-center text- font-black">C</div>
          <div className="leading-none"><div className="text- mono font-bold">{org?.name||"CLUB"}</div><div className="text- text-zinc-500 mono">{org?.type||"Organisation"}</div></div>
        </div>
        <nav className="flex-1 p-2.5 flex flex-col gap-1 pt-4">
          {TABS.map(t=><button key={t} onClick={()=>setTab(t)} className={`h-9 w-full text-left px-3 rounded-lg text- mono font-bold tracking-widest ${tab===t?'bg-[#1230ff] text-white':'text-zinc-500 hover:bg-[#0b1226] hover:text-white'}`}>{t}</button>)}
        </nav>
        <div className="p-2.5 border-t border-white/10 text- mono text-zinc-600">ERP v1 • {members.length} licenciés</div>
      </aside>

      <main className="flex-1 overflow-auto p-6 max-w-">
        {tab==="OVERVIEW" && (
          <div className="grid gap-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="h- bg-[#0b1226] border border-white/10 rounded-2xl p-5"><div className="text- mono text-zinc-500">CA MOIS</div><div className="text- font-black">{ca.toLocaleString()} Ar</div><div className="text- text-[#00e676]">+12% vs mois dernier</div></div>
              <div className="h- bg-[#0b1226] border border-white/10 rounded-2xl p-5"><div className="text- mono text-zinc-500">ACTIFS</div><div className="text- font-black">{actifs} / {members.length}</div><div className="text- text-red-400">{impayes} impayés</div></div>
              <div className="h- bg-[#0b1226] border border-white/10 rounded-2xl p-5"><div className="text- mono text-zinc-500">SESSIONS</div><div className="text- font-black">{sessions.length}</div><div className="text- text-zinc-500">par semaine</div></div>
            </div>
            <div className="bg-[#0b1226] border border-white/10 rounded-2xl p-5">
              <h3 className="text- mono font-bold mb-4">MEMBRES RÉCENTS</h3>
              <div className="flex flex-col divide-y divide-white/5">{members.slice(0,5).map(m=><div key={m.id} className="py-2.5 flex justify-between text- mono"><span>{m.full_name} • {m.discipline}</span><span className={m.status==="actif"?"text-[#00e676]":"text-red-400"}>{m.status}</span></div>)}</div>
            </div>
          </div>
        )}

        {tab==="MEMBRES" && (
          <div className="bg-[#0b1226] border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-4 flex gap-2 border-b border-white/10">
              <input value={newMember.full_name} onChange={e=>setNewMember({...newMember,full_name:e.target.value})} placeholder="Nom complet" className="h-9 bg-[#080e20] border border-white/10 rounded-xl px-3 text- mono flex-1 outline-none" />
              <select value={newMember.discipline} onChange={e=>setNewMember({...newMember,discipline:e.target.value})} className="h-9 bg-[#080e20] border border-white/10 rounded-xl px-3 text- mono"><option>MMA</option><option>Judo</option><option>Boxe Anglaise</option><option>Karaté</option></select>
              <button onClick={addMember} className="h-9 px-5 rounded-xl bg-[#1230ff] text- mono font-bold">AJOUTER LICENCIÉ</button>
            </div>
            <table className="w-full text- mono"><thead className="bg-[#080e20] text- text-zinc-500"><tr><th className="text-left px-5 py-3">NOM</th><th>DISCIPLINE</th><th>PLAN</th><th>STATUT</th><th>ACTION</th></tr></thead><tbody>{members.map(m=><tr key={m.id} className="border-t border-white/5 hover:bg-white/[0.02]"><td className="px-5 py-3 font-bold">{m.full_name}</td><td className="px-5 py-3 text-center">{m.discipline}</td><td className="px-5 py-3 text-center">{m.plan}</td><td className="px-5 py-3 text-center"><span className={`px-2 py-0.5 rounded-full text- ${m.status==="actif"?"bg-[#00e676]/20 text-[#00e676]":"bg-red-500/20 text-red-400"}`}>{m.status}</span></td><td className="px-5 py-3 text-center"><button onClick={()=>toggleStatus(m.id,m.status)} className="h-7 px-3 rounded-full bg-white/10 text-">TOGGLE</button></td></tr>)}</tbody></table>
          </div>
        )}

        {tab==="PLANNING" && (
          <div className="grid grid-cols-2 gap-3">
            {["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"].map((day,i)=><div key={day} className="bg-[#0b1226] border border-white/10 rounded-2xl p-4"><div className="text- mono font-bold mb-3">{day.toUpperCase()}</div><div className="flex flex-col gap-2">{sessions.filter(s=>s.day_of_week===i).map(s=><div key={s.id} className="h-12 bg-[#080e20] rounded-xl px-3 flex items-center justify-between"><span className="text- mono">{s.title} • {s.start_time?.slice(0,5)}</span><span className="text- text-zinc-500">{s.coach_name}</span></div>)}{sessions.filter(s=>s.day_of_week===i).length===0 && <div className="text- text-zinc-600 mono">Aucun cours</div>}</div></div>)}
          </div>
        )}

        {tab==="FINANCES" && (
          <div className="bg-[#0b1226] border border-white/10 rounded-2xl p-5"><h3 className="text- mono font-bold mb-4">TRANSACTIONS • {transacs.length}</h3><div className="flex flex-col divide-y divide-white/5">{transacs.map(t=><div key={t.id} className="py-2.5 flex justify-between text- mono"><span>{t.description||t.type}</span><span className={t.type==="income"?"text-[#00e676]":"text-red-400"}>{t.type==="income"?"+":"-"}{t.amount} Ar</span></div>)}</div></div>
        )}
      </main>
    </div>
  )
}