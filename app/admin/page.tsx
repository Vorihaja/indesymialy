"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/client"

const TABS = [
  {id:"overview", label:"OVERVIEW"},
  {id:"flash", label:"FLASH • BREAKING"},
  {id:"users", label:"USERS • RÔLES"},
  {id:"orgs", label:"ORGANISATIONS"},
  {id:"events", label:"EVENTS"},
  {id:"market", label:"MARKET"},
  {id:"finance", label:"FINANCES"},
]

export default function SuperAdmin(){
  const supabase = createClient()
  const router = useRouter()
  const [tab,setTab]=useState("flash")
  const [stats,setStats]=useState({users:0, orgs:0, events:0, products:0, ca:0, flash:0})
  const [users,setUsers]=useState<any[]>([])
  const [orgs,setOrgs]=useState<any[]>([])
  const [events,setEvents]=useState<any[]>([])
  const [products,setProducts]=useState<any[]>([])
  const [transacs,setTransacs]=useState<any[]>([])
  const [flash,setFlash]=useState<any[]>([])
  const [newFlash,setNewFlash]=useState("")
  const [editingId,setEditingId]=useState<string|null>(null)
  const [editingText,setEditingText]=useState("")
  const [loading,setLoading]=useState(true)

  const load = async()=>{
    const [{ data: profiles }, { data: organizations }, { data: evs }, { data: prods }, { data: trans }, { data: userRoles }, { data: flashs }] = await Promise.all([
      supabase.from("profiles").select("*"),
      supabase.from("organizations").select("*"),
      supabase.from("events").select("*"),
      supabase.from("products").select("*"),
      supabase.from("transactions").select("*"),
      supabase.from("user_roles").select("user_id, roles(label, slug)"),
      supabase.from("breaking_news").select("*").order("created_at",{ascending:false})
    ])
    const rolesMap:any={}
    userRoles?.forEach((ur:any)=>{ (rolesMap[ur.user_id] ||= []).push(ur.roles?.label || ur.roles?.slug) })
    setUsers((profiles||[]).map((p:any)=>({...p, roles: rolesMap[p.id]?.join(", ")||"—", displayName: p.email?.split("@")[0]||"—"})))
    setOrgs(organizations||[]); setEvents(evs||[]); setProducts(prods||[]); setTransacs(trans||[]); setFlash(flashs||[])
    setStats({users: profiles?.length||0, orgs: organizations?.length||0, events: evs?.length||0, products: prods?.length||0, ca: trans?.filter((t:any)=>t.type==="income").reduce((s:any,t:any)=>s+(t.amount||0),0)||0, flash: flashs?.length||0})
  }

  useEffect(()=>{(async()=>{
    const { data: { user } } = await supabase.auth.getUser()
    if(!user || user.email!== "jayaherve@proton.me"){ router.push("/auth"); return }
    await load(); setLoading(false)
  })()},[])

  const addFlash = async()=>{
    if(!newFlash.trim()) return
    await supabase.from("breaking_news").insert({ text: newFlash.trim() })
    setNewFlash(""); await load()
  }
  const delFlash = async(id:string)=>{ await supabase.from("breaking_news").delete().eq("id",id); await load() }
  const startEdit = (f:any)=>{ setEditingId(f.id); setEditingText(f.text) }
  const saveEdit = async()=>{
    if(!editingId ||!editingText.trim()) return
    await supabase.from("breaking_news").update({ text: editingText.trim() }).eq("id", editingId)
    setEditingId(null); setEditingText(""); await load()
  }

  if(loading) return <div className="fixed inset-0 z-[9999] bg-[#060a14] grid place-items-center text-white text- tracking-widest mono">SUPER ADMIN • LOADING</div>

  return (
    <div className="fixed inset-0 z-[9999] bg-[#060a14] text-white flex overflow-hidden antialiased">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=JetBrains+Mono:wght@400;700&display=swap'); *{font-family:Inter,sans-serif}.mono{font-family:JetBrains Mono,monospace}`}</style>
      <aside style={{width:'250px'}} className="shrink-0 bg-[#080d1c] border-r border-[rgba(26,42,90,0.4)] flex flex-col">
        <div className="h- px-4 flex items-center gap-2.5 border-b border-[rgba(26,42,90,0.25)]">
          <div className="w-7 h-7 rounded-full bg-[#1230ff] grid place-items-center text- font-black">IM</div>
          <div className="flex flex-col leading-none gap-"><span className="text- font-bold tracking-[0.12em] mono">SUPER ADMIN</span><span className="text- text-zinc-500 mono">Indesy Mialy</span></div>
          <div className="ml-auto w-2 h-2 rounded-full bg-[#00e676] shadow-[0_0_8px_rgba(0,230,118,0.6)]" />
        </div>
        <nav className="flex-1 px-2.5 pt-4 flex flex-col gap-1">
          {TABS.map(t=><button key={t.id} onClick={()=>setTab(t.id)} className={`h-9 w-full rounded-lg text- font-bold tracking-[0.12em] mono text-left px-3 ${tab===t.id?'bg-[#1230ff] text-white shadow-[0_2px_12px_rgba(18,48,255,0.35)]':'text-zinc-500 hover:text-zinc-300 hover:bg-[#0b1226]'}`}>{t.label}</button>)}
        </nav>
        <div className="p-2.5 border-t border-[rgba(26,42,90,0.25)] flex flex-col gap-2">
          <button onClick={()=>router.push("/")} className="h-9 w-full rounded-lg bg-[#0b1226] border border-[rgba(26,42,90,0.6)] text- mono text-zinc-400">← SITE</button>
          <button onClick={()=>router.push("/admin/database")} className="h-9 w-full rounded-lg bg-[#00e676]/10 border border-[#00e676]/30 text- mono text-[#00e676] font-bold">DATABASE RAW</button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-auto">
        <div className="w-full max-w- p-5 lg:p-8">
          {tab==="flash" && (
            <div className="bg-[#0b1226] border border-[rgba(26,42,90,0.6)] rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-[rgba(26,42,90,0.25)] flex justify-between items-center"><h2 className="text- font-black mono">FLASH • {flash.length}</h2><span className="text- mono text-[#00e676]">Live → site public</span></div>
              <div className="p-5 flex gap-2 border-b border-[rgba(26,42,90,0.25)]">
                <input value={newFlash} onChange={e=>setNewFlash(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addFlash()} placeholder="Nouvelle flash news..." className="flex-1 h-11 bg-[#080e20] border border-[rgba(26,42,90,0.6)] rounded-xl px-4 text- mono outline-none focus:border-[#1230ff]" />
                <button onClick={addFlash} className="h-11 px-6 rounded-xl bg-[#1230ff] text- mono font-bold">PUBLIER</button>
              </div>
              <div className="flex flex-col">
                {flash.map((f:any)=>(
                  <div key={f.id} className="px-5 py-4 border-t border-white/5 hover:bg-[#080e20] flex items-center justify-between gap-3">
                    {editingId===f.id? (
                      <div className="flex-1 flex gap-2">
                        <input value={editingText} onChange={e=>setEditingText(e.target.value)} className="flex-1 h-9 bg-[#0b1226] border border-[#1230ff]/50 rounded-xl px-3 text- mono outline-none" autoFocus />
                        <button onClick={saveEdit} className="h-9 px-4 rounded-full bg-[#00e676] text-black text- mono font-bold">SAUVER</button>
                        <button onClick={()=>setEditingId(null)} className="h-9 px-4 rounded-full bg-[#0b1226] border text- mono">ANNULER</button>
                      </div>
                    ) : (
                      <>
                        <span className="text- mono text-zinc-300 pr-4 flex-1">{f.text}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text- mono text-zinc-600 hidden lg:block">{new Date(f.created_at).toLocaleDateString()}</span>
                          <button onClick={()=>startEdit(f)} className="h-7 px-3 rounded-full bg-[#1230ff]/20 border border-[#1230ff]/30 text- mono text-[#5b7cff] font-bold">MODIFIER</button>
                          <button onClick={()=>delFlash(f.id)} className="h-7 px-3 rounded-full bg-red-700/20 border border-red-700/30 text- mono text-red-400">SUPPR</button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {flash.length===0 && <div className="py-16 text-center text- mono text-zinc-600">Aucune news</div>}
              </div>
            </div>
          )}
          {tab==="overview" && <div className="grid grid-cols-2 lg:grid-cols-3 gap-3"><div className="h- bg-[#0b1226] border border-[rgba(26,42,90,0.6)] rounded-2xl p-5"><div className="text- mono text-zinc-500">FLASH</div><div className="text- font-black">{stats.flash}</div></div><div className="h- bg-[#0b1226] border rounded-2xl p-5"><div className="text- mono text-zinc-500">ORGAS</div><div className="text- font-black">{stats.orgs}</div></div><div className="h- bg-[#0b1226] border rounded-2xl p-5"><div className="text- mono text-zinc-500">USERS</div><div className="text- font-black">{stats.users}</div></div></div>}
          {tab==="orgs" && <div className="bg-[#0b1226] border rounded-2xl overflow-hidden"><div className="p-5"><h2 className="text- mono">ORGS • {orgs.length}</h2></div><div className="overflow-x-auto"><table className="w-full text-"><thead className="bg-[#080e20] text- text-zinc-500 mono"><tr><th className="text-left px-5 py-3">NOM</th><th className="text-left px-5 py-3">TYPE</th><th className="text-left px-5 py-3">DISCIPLINE</th></tr></thead><tbody>{orgs.map((o:any)=><tr key={o.id} className="border-t border-white/5"><td className="px-5 py-3 font-bold">{o.name}</td><td className="px-5 py-3">{o.type}</td><td className="px-5 py-3 mono text-zinc-400">{o.discipline||"—"}</td></tr>)}</tbody></table></div></div>}
          {tab==="users" && <div className="bg-[#0b1226] border rounded-2xl overflow-hidden"><div className="p-5"><h2 className="text- mono">USERS • {users.length}</h2></div><table className="w-full text-"><thead className="bg-[#080e20] text- text-zinc-500 mono"><tr><th className="text-left px-5 py-3">EMAIL</th><th className="text-left px-5 py-3">RÔLES</th></tr></thead><tbody>{users.map((u:any)=><tr key={u.id} className="border-t border-white/5"><td className="px-5 py-3">{u.email}</td><td className="px-5 py-3 text-[#00e676] mono">{u.roles}</td></tr>)}</tbody></table></div>}
        </div>
      </main>
    </div>
  )
}