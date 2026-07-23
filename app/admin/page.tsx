"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/client"
import Navbar from "../../components/navigation/Navbar"

const TABS = [
  {id:"overview", label:"OVERVIEW"},
  {id:"flash", label:"FLASH • BREAKING"},
  {id:"users", label:"USERS • RÔLES"},
  {id:"role-requests", label:"DEMANDES DE RÔLES"},
  {id:"orgs", label:"ORGANISATIONS"},
  {id:"events", label:"EVENTS"},
  {id:"market", label:"MARKET"},
  {id:"finance", label:"FINANCES"},
]

type RoleRequest = {
  id: string
  user_id: string
  role_id: string
  email?: string
  status: string
  created_at: string
  roles: { label?: string; slug?: string } | { label?: string; slug?: string }[] | null
}

export default function SuperAdmin(){
  const supabase = createClient()
  const router = useRouter()
  const [tab,setTab]=useState("role-requests")
  const [stats,setStats]=useState({users:0, orgs:0, events:0, products:0, ca:0, flash:0})
  const [users,setUsers]=useState<any[]>([])
  const [orgs,setOrgs]=useState<any[]>([])
  const [events,setEvents]=useState<any[]>([])
  const [products,setProducts]=useState<any[]>([])
  const [transacs,setTransacs]=useState<any[]>([])
  const [flash,setFlash]=useState<any[]>([])
  const [roleRequests,setRoleRequests]=useState<RoleRequest[]>([])
  const [newFlash,setNewFlash]=useState("")
  const [editingId,setEditingId]=useState<string|null>(null)
  const [editingText,setEditingText]=useState("")
  const [loading,setLoading] = useState(true)

  const load = async()=>{
    const [{ data: profiles }, { data: organizations }, { data: evs }, { data: prods }, { data: trans }, { data: userRoles }, { data: flashs }, { data: requests }] = await Promise.all([
      supabase.from("profiles").select("*"),
      supabase.from("organizations").select("*"),
      supabase.from("events").select("*"),
      supabase.from("products").select("*"),
      supabase.from("transactions").select("*"),
      supabase.from("user_roles").select("user_id, roles(label, slug)"),
      supabase.from("breaking_news").select("*").order("created_at",{ascending:false}),
      supabase.from("role_requests").select("id, user_id, role_id, status, created_at, roles(label, slug)").order("created_at", { ascending: false })
    ])
    const rolesMap:any={}
    userRoles?.forEach((ur:any)=>{ (rolesMap[ur.user_id] ||= []).push(ur.roles?.label || ur.roles?.slug) })
    setUsers((profiles||[]).map((p:any)=>({...p, roles: rolesMap[p.id]?.join(", ")||"—", displayName: p.email?.split("@")[0]||"—"})))
    const emailByUserId = new Map((profiles||[]).map((profile:any)=>[profile.id, profile.email]))
    setOrgs(organizations||[]); setEvents(evs||[]); setProducts(prods||[]); setTransacs(trans||[]); setFlash(flashs||[]); setRoleRequests(((requests||[]) as RoleRequest[]).map(request=>({...request, email: emailByUserId.get(request.user_id)})))
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

  const reviewRoleRequest = async(id:string, approved:boolean)=>{
    const requestItem = roleRequests.find(r => r.id === id);

    // Tente l'RPC d'abord
    const { error: rpcError } = await supabase.rpc("review_role_request", { p_request_id: id, p_approved: approved })
    
    if(rpcError) {
      // Fallback manuel si la fonction RPC n'est pas encore enregistrée en DB
      const status = approved ? "approved" : "rejected";
      await supabase.from("role_requests").update({ status, reviewed_at: new Date().toISOString() }).eq("id", id);
      
      if (approved && requestItem) {
        await supabase.from("user_roles").insert({ user_id: requestItem.user_id, role_id: requestItem.role_id });
      }

      // Envoi de la notification au demandeur
      if (requestItem) {
        await supabase.from("user_notifications").insert({
          user_id: requestItem.user_id,
          title: approved ? "Demande de rôle validée" : "Demande de rôle rejetée",
          message: approved ? "Votre demande a été validée" : "Votre demande a été rejetée",
          type: approved ? "success" : "error"
        });
      }
    }
    await load()
  }

  if(loading) return <div className="fixed inset-x-0 bottom-0 top-[var(--platform-header-height)] z-[9999] bg-neutral-950 grid place-items-center text-white text-xs tracking-widest mono rounded-none">SUPER ADMIN • LOADING</div>

  return (
    <div className="fixed inset-x-0 bottom-0 top-[var(--platform-header-height)] z-[9999] bg-neutral-950 text-white flex flex-col overflow-hidden antialiased rounded-none">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=JetBrains+Mono:wght@400;700&display=swap'); *{font-family:Inter,sans-serif; border-radius: 0px !important;} .mono{font-family:JetBrains Mono,monospace}`}</style>

      {/* NAVBAR CONTAINER */}
      <div className="w-full shrink-0 z-50">
        <Navbar />
      </div>

      {/* CORE INTERFACE CONTAINER */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <aside style={{width:'250px'}} className="shrink-0 bg-neutral-900 border-r border-white/10 flex flex-col rounded-none">
          <div className="h-14 px-4 flex items-center gap-2.5 border-b border-white/10">
            <div className="flex flex-col leading-none gap-0.5"><span className="text-xs font-bold tracking-[0.12em] mono">SUPER ADMIN</span><span className="text-[10px] text-zinc-500 mono">Indesy Mialy</span></div>
            <div className="ml-auto w-2 h-2 rounded-none bg-[#00e676] shadow-[0_0_8px_rgba(0,230,118,0.6)]" />
          </div>
          <nav className="flex-1 px-2.5 pt-4 flex flex-col gap-1">
            {TABS.map(t=><button key={t.id} onClick={()=>setTab(t.id)} className={`h-9 w-full rounded-none text-xs font-bold tracking-[0.12em] mono text-left px-3 ${tab===t.id?'bg-blue-600 text-white':'text-zinc-500 hover:text-zinc-300 hover:bg-neutral-950'}`}>{t.label}</button>)}
          </nav>
          <div className="p-2.5 border-t border-white/10 flex flex-col gap-2">
            <button onClick={()=>router.push("/")} className="h-9 w-full rounded-none bg-neutral-950 border border-white/10 text-xs mono text-zinc-400 hover:text-white transition">← SITE</button>
            <button onClick={()=>router.push("/admin/database")} className="h-9 w-full rounded-none bg-[#00e676]/10 border border-[#00e676]/30 text-xs mono text-[#00e676] font-bold hover:bg-[#00e676]/20 transition">DATABASE RAW</button>
          </div>
        </aside>

        <main className="flex-1 min-w-0 overflow-auto bg-neutral-950">
          <div className="w-full max-w-7xl p-5 lg:p-8">
            {tab==="flash" && (
              <div className="bg-neutral-900 border border-white/10 rounded-none overflow-hidden">
                <div className="p-5 border-b border-white/10 flex justify-between items-center"><h2 className="text-sm font-black mono">FLASH • {flash.length}</h2><span className="text-xs mono text-[#00e676]">Live → site public</span></div>
                <div className="p-5 flex gap-2 border-b border-white/10">
                  <input value={newFlash} onChange={e=>setNewFlash(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addFlash()} placeholder="Nouvelle flash news..." className="flex-1 h-11 bg-neutral-950 border border-white/10 rounded-none px-4 text-xs mono outline-none focus:border-blue-500 transition" />
                  <button onClick={addFlash} className="h-11 px-6 rounded-none bg-blue-600 text-white text-xs mono font-bold hover:bg-blue-500 transition">PUBLIER</button>
                </div>
                <div className="flex flex-col">
                  {flash.map((f:any)=>(
                    <div key={f.id} className="px-5 py-4 border-t border-white/5 hover:bg-neutral-950/50 flex items-center justify-between gap-3">
                      {editingId===f.id? (
                        <div className="flex-1 flex gap-2">
                          <input value={editingText} onChange={e=>setEditingText(e.target.value)} className="flex-1 h-9 bg-neutral-950 border border-blue-500 rounded-none px-3 text-xs mono outline-none" autoFocus />
                          <button onClick={saveEdit} className="h-9 px-4 rounded-none bg-[#00e676] text-black text-xs mono font-bold">SAUVER</button>
                          <button onClick={()=>setEditingId(null)} className="h-9 px-4 rounded-none bg-neutral-950 border border-white/10 text-xs mono text-white">ANNULER</button>
                        </div>
                      ) : (
                        <>
                          <span className="text-xs mono text-zinc-300 pr-4 flex-1">{f.text}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs mono text-zinc-600 hidden lg:block">{new Date(f.created_at).toLocaleDateString()}</span>
                            <button onClick={()=>startEdit(f)} className="h-7 px-3 rounded-none bg-blue-600/20 border border-blue-500/30 text-xs mono text-blue-400 font-bold hover:bg-blue-600/30 transition">MODIFIER</button>
                            <button onClick={()=>delFlash(f.id)} className="h-7 px-3 rounded-none bg-red-700/20 border border-red-700/30 text-xs mono text-red-400 hover:bg-red-700/30 transition">SUPPR</button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                  {flash.length===0 && <div className="py-16 text-center text-xs mono text-zinc-600">Aucune news</div>}
                </div>
              </div>
            )}
            {tab==="overview" && <div className="grid grid-cols-2 lg:grid-cols-3 gap-3"><div className="bg-neutral-900 border border-white/10 rounded-none p-5"><div className="text-xs mono text-zinc-500">FLASH</div><div className="text-2xl font-black mt-1">{stats.flash}</div></div><div className="bg-neutral-900 border border-white/10 rounded-none p-5"><div className="text-xs mono text-zinc-500">ORGAS</div><div className="text-2xl font-black mt-1">{stats.orgs}</div></div><div className="bg-neutral-900 border border-white/10 rounded-none p-5"><div className="text-xs mono text-zinc-500">USERS</div><div className="text-2xl font-black mt-1">{stats.users}</div></div></div>}
            
            {tab==="role-requests" && (
              <div className="bg-neutral-900 border border-white/10 rounded-none overflow-hidden">
                <div className="p-5 border-b border-white/10 flex justify-between items-center">
                  <h2 className="text-sm font-black mono">DEMANDES DE RÔLES • {roleRequests.filter(r=>r.status==="pending").length} EN ATTENTE DE VALIDATION</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-neutral-950 text-zinc-500 mono border-b border-white/10">
                      <tr>
                        <th className="px-5 py-3">UTILISATEUR (DEMANDEUR)</th>
                        <th className="px-5 py-3">RÔLE DEMANDÉ</th>
                        <th className="px-5 py-3">DATE</th>
                        <th className="px-5 py-3">STATUT</th>
                        <th className="px-5 py-3">ACTIONS ADMIN</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roleRequests.map((request)=>{
                        const role = Array.isArray(request.roles) ? request.roles[0] : request.roles;
                        const isPending = request.status === "pending";
                        const isApproved = request.status === "approved";
                        const isRejected = request.status === "rejected";

                        return (
                          <tr key={request.id} className="border-t border-white/5 hover:bg-neutral-950/30">
                            <td className="px-5 py-3 text-zinc-300 font-mono">{request.email || request.user_id}</td>
                            <td className="px-5 py-3 text-blue-300 mono font-bold">{role?.label || role?.slug || "—"}</td>
                            <td className="px-5 py-3 text-zinc-500 font-mono">{new Date(request.created_at).toLocaleDateString()}</td>
                            <td className="px-5 py-3 font-mono">
                              {isPending && <span className="bg-amber-500/15 border border-amber-500/30 text-amber-400 px-2 py-0.5 uppercase font-bold">En attente de validation</span>}
                              {isApproved && <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 uppercase font-bold">Validée (Accepté)</span>}
                              {isRejected && <span className="bg-red-500/15 border border-red-500/30 text-red-400 px-2 py-0.5 uppercase font-bold">Rejetée (Refusé)</span>}
                            </td>
                            <td className="px-5 py-3">
                              {isPending ? (
                                <div className="flex gap-2">
                                  <button onClick={()=>reviewRoleRequest(request.id, true)} className="bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 font-mono text-xs font-bold text-emerald-400 hover:bg-emerald-500 hover:text-black transition">ACCEPTER</button>
                                  <button onClick={()=>reviewRoleRequest(request.id, false)} className="bg-red-500/20 border border-red-500/40 px-3 py-1 font-mono text-xs font-bold text-red-400 hover:bg-red-500 hover:text-white transition">REJETER</button>
                                </div>
                              ) : (
                                <span className="text-zinc-600 font-mono text-[10px]">Traitée</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {roleRequests.length===0&&<div className="py-16 text-center text-xs mono text-zinc-600">Aucune demande de rôle enregistrée</div>}
              </div>
            )}

            {tab==="orgs" && <div className="bg-neutral-900 border border-white/10 rounded-none overflow-hidden"><div className="p-5"><h2 className="text-sm font-black mono">ORGS • {orgs.length}</h2></div><div className="overflow-x-auto"><table className="w-full text-xs text-left"><thead className="bg-neutral-950 text-zinc-500 mono border-b border-white/10"><tr><th className="px-5 py-3">NOM</th><th className="px-5 py-3">TYPE</th><th className="px-5 py-3">DISCIPLINE</th></tr></thead><tbody>{orgs.map((o:any)=><tr key={o.id} className="border-t border-white/5 hover:bg-neutral-950/20"><td className="px-5 py-3 font-bold">{o.name}</td><td className="px-5 py-3 text-zinc-300">{o.type}</td><td className="px-5 py-3 mono text-zinc-500">{o.discipline||"—"}</td></tr>)}</tbody></table></div></div>}
            {tab==="users" && <div className="bg-neutral-900 border border-white/10 rounded-none overflow-hidden"><div className="p-5"><h2 className="text-sm font-black mono">USERS • {users.length}</h2></div><div className="overflow-x-auto"><table className="w-full text-xs text-left"><thead className="bg-neutral-950 text-zinc-500 mono border-b border-white/10"><tr><th className="px-5 py-3">EMAIL</th><th className="px-5 py-3">RÔLES</th></tr></thead><tbody>{users.map((u:any)=><tr key={u.id} className="border-t border-white/5 hover:bg-neutral-950/20"><td className="px-5 py-3 text-zinc-300">{u.email}</td><td className="px-5 py-3 text-[#00e676] mono">{u.roles}</td></tr>)}</tbody></table></div></div>}
          </div>
        </main>
      </div>
    </div>
  )
}
