"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/client"

export default function MembersPro(){
  const supabase = createClient()
  const [members,setMembers]=useState<any[]>([])
  const [form,setForm]=useState({full_name:"",discipline:"MMA",category:"senior",phone:""})

  const load=async()=>{ const {data}=await supabase.from("members").select("*").order("created_at",{ascending:false}); setMembers(data||[]) }
  useEffect(()=>{load()},[])

  const add=async()=>{
    if(!form.full_name) return
    const licence_no = `IM-${Date.now().toString().slice(-6)}`
    await supabase.from("members").insert({...form, licence_no, cotisation_status:"impayé"})
    setForm({full_name:"",discipline:"MMA",category:"senior",phone:""}); load()
  }
  const togglePay=async(m:any)=>{
    await supabase.from("members").update({cotisation_status: m.cotisation_status==='payé'?'impayé':'payé'}).eq("id",m.id); load()
  }

  return (
    <div className="p-6 max-w- mx-auto space-y-6">
      <div className="flex justify-between items-center"><h1 className="text- font-black mono">ERP MEMBRES • {members.length}</h1><span className="text- mono text-neutral-500">Licence PRO</span></div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex gap-2 flex-wrap">
        <input value={form.full_name} onChange={e=>setForm({...form, full_name:e.target.value})} placeholder="Nom complet" className="h-10 bg-black border border-neutral-800 rounded-xl px-3 text- flex-1" />
        <select value={form.discipline} onChange={e=>setForm({...form, discipline:e.target.value})} className="h-10 bg-black border border-neutral-800 rounded-xl px-3 text-"><option>MMA</option><option>Judo</option><option>Boxe Anglaise</option><option>Kick-Boxing</option></select>
        <select value={form.category} onChange={e=>setForm({...form, category:e.target.value})} className="h-10 bg-black border border-neutral-800 rounded-xl px-3 text-"><option>senior</option><option>junior</option><option>cadet</option></select>
        <input value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} placeholder="Tel" className="h-10 bg-black border border-neutral-800 rounded-xl px-3 text- w-" />
        <button onClick={add} className="h-10 px-6 bg-white text-black rounded-xl text- font-bold mono">+ AJOUTER</button>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
        <table className="w-full text-"><thead className="bg-black text- text-neutral-500 mono"><tr><th className="text-left p-3">NOM</th><th className="text-left p-3">DISC.</th><th className="text-left p-3">LICENCE</th><th className="text-left p-3">COTISATION</th><th className="p-3">ACTION</th></tr></thead>
        <tbody>{members.map(m=><tr key={m.id} className="border-t border-white/5"><td className="p-3 font-bold">{m.full_name}</td><td className="p-3">{m.discipline}</td><td className="p-3 mono text-">{m.licence_no}</td><td className="p-3"><span className={`px-2 py-1 rounded-full text- font-bold ${m.cotisation_status==='payé'?'bg-[#00e676] text-black':'bg-red-900 text-white'}`}>{m.cotisation_status}</span></td><td className="p-3 text-center"><button onClick={()=>togglePay(m)} className="h-7 px-3 bg-white text-black rounded-full text- font-bold">{m.cotisation_status==='payé'?'IMPAYÉ':'PAYER'}</button></td></tr>)}</tbody></table>
      </div>
    </div>
  )
}