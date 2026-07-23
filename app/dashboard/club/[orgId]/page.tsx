"use client"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/client"
import Navbar from "../../../../components/navigation/Navbar"

const TABS = ["OVERVIEW", "MEMBRES", "PLANNING", "PRESENCES", "FINANCES", "BOUTIQUE"] as const

export default function ERPClub() {
  const { orgId } = useParams() as { orgId: string }
  const supabase = createClient()
  const [tab, setTab] = useState<typeof TABS[number]>("OVERVIEW")
  const [org, setOrg] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [transacs, setTransacs] = useState<any[]>([])
  const [newMember, setNewMember] = useState({ full_name: "", discipline: "MMA", plan: "Mensuel" })
  
  // États enrichis pour l'expérience utilisateur
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"tous" | "actif" | "impayé">("tous")
  const [logs, setLogs] = useState<string[]>(["Système initialisé", "Connexion sécurisée établie"])

  const load = async () => {
    const { data: o } = await supabase.from("organizations").select("*").eq("id", orgId).single()
    const { data: m } = await supabase.from("club_members").select("*").eq("organization_id", orgId).order("joined_at", { ascending: false })
    const { data: s } = await supabase.from("training_sessions").select("*").eq("organization_id", orgId)
    const { data: t } = await supabase.from("transactions").select("*").eq("organization_id", orgId).order("created_at", { ascending: false })
    setOrg(o); setMembers(m || []); setSessions(s || []); setTransacs(t || [])
  }
  
  useEffect(() => { load() }, [orgId])

  const addMember = async () => {
    if (!newMember.full_name) return
    await supabase.from("club_members").insert({ ...newMember, organization_id: orgId, expires_at: new Date(Date.now() + 30 * 24 * 3600 * 1000) })
    setLogs(prev => [`Nouveau licencié enregistré : ${newMember.full_name}`, ...prev])
    setNewMember({ full_name: "", discipline: "MMA", plan: "Mensuel" }); load()
  }

  const toggleStatus = async (id: string, status: string) => {
    const targetStatus = status === "actif" ? "impayé" : "actif"
    await supabase.from("club_members").update({ status: targetStatus }).eq("id", id)
    setLogs(prev => [`Statut membre ID ${id.slice(0,5)} permuté vers : ${targetStatus}`, ...prev])
    load()
  }

  const handleQuickIncome = async () => {
    await supabase.from("transactions").insert({ organization_id: orgId, type: "income", amount: 50000, description: "Règlement comptant direct" })
    setLogs(prev => ["Enregistrement d'une rentrée financière de 50 000 Ar", ...prev])
    load()
  }

  const ca = transacs.filter(t => t.type === "income").reduce((a, b) => a + (b.amount || 0), 0)
  const actifs = members.filter(m => m.status === "actif").length
  const impayes = members.filter(m => m.status === "impayé").length
  const ratioActifs = members.length > 0 ? Math.round((actifs / members.length) * 100) : 0

  const filteredMembers = members.filter(m => {
    const matchesSearch = m.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || m.discipline.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "tous" || m.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="fixed inset-x-0 bottom-0 top-[var(--platform-header-height)] z-[999] bg-neutral-950 text-white flex flex-col overflow-hidden select-none">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;900&display=swap');.mono{font-family:'JetBrains Mono',monospace}`}</style>

      {/* NAVBAR AVEC IMPORT CORRIGÉ DANS L'ARBORESCENCE APP */}
      <Navbar />

      {/* CONTENEUR PRINCIPAL APPRÈS NAVBAR */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* PANEL LATÉRAL / ASIDE 250px */}
        <aside style={{ width: '250px' }} className="shrink-0 bg-neutral-900 border-r border-neutral-800 flex flex-col justify-between">
          <div className="flex flex-col">
            <div className="h-16 px-4 flex items-center gap-3 border-b border-neutral-800/60 bg-neutral-950/40">
              <div className="w-8 h-8 rounded-none bg-red-600 grid place-items-center text-sm font-black text-white">IM</div>
              <div className="leading-none">
                <div className="text-sm mono font-black tracking-tight uppercase text-white">{org?.name || "Club d'Élite"}</div>
                <div className="text-[10px] text-neutral-500 mono font-bold uppercase mt-0.5">{org?.type || "Arts Martiaux"}</div>
              </div>
            </div>
            
            <nav className="p-3 flex flex-col gap-1 pt-4">
              {TABS.map(t => (
                <button 
                  key={t} 
                  onClick={() => setTab(t)} 
                  className={`h-9 w-full text-left px-3 rounded-none text-xs mono font-black tracking-wider transition-none flex items-center justify-between ${
                    tab === t 
                      ? 'bg-white text-black' 
                      : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                  }`}
                >
                  <span>{t}</span>
                  {t === "MEMBRES" && members.length > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 ${tab === t ? 'bg-black text-white' : 'bg-neutral-950 text-neutral-400'}`}>
                      {members.length}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-3 border-t border-neutral-800 bg-neutral-950/20 space-y-2">
            <div className="text-[10px] mono text-neutral-500 uppercase tracking-widest">// Système Logs</div>
            <div className="text-[9px] font-mono text-neutral-400 truncate bg-neutral-950 p-1.5 border border-neutral-800/80">
              {logs[0] || "Aucune action"}
            </div>
            <div className="text-[10px] mono text-neutral-600">ERP v2.1 • {members.length} athlètes</div>
          </div>
        </aside>

        {/* CONTENU PRINCIPAL DE L'APPLICATION */}
        <main className="flex-1 overflow-auto p-6 bg-neutral-950">
          
          {tab === "OVERVIEW" && (
            <div className="grid gap-6">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-neutral-900 border border-neutral-800 rounded-none p-5 flex flex-col justify-between relative group">
                  <div className="text-xs mono text-neutral-400 tracking-wider uppercase">// Chiffre d'affaires</div>
                  <div className="text-2xl font-black text-white tracking-tight my-2">{ca.toLocaleString()} Ar</div>
                  <div className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                    <span>↑ +12%</span> <span className="text-neutral-500">ce mois</span>
                  </div>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 rounded-none p-5 flex flex-col justify-between">
                  <div className="text-xs mono text-neutral-400 tracking-wider uppercase">// Licenciés Actifs</div>
                  <div className="text-2xl font-black text-white tracking-tight my-2">{actifs} <span className="text-xs text-neutral-500 font-normal">/ {members.length} total</span></div>
                  <div className="w-full h-1 bg-neutral-950 rounded-none overflow-hidden my-1">
                    <div className="h-full bg-amber-500" style={{ width: `${ratioActifs}%` }} />
                  </div>
                  <div className="text-[11px] text-red-400 font-mono">{impayes} dossiers en retard de paiement</div>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 rounded-none p-5 flex flex-col justify-between">
                  <div className="text-xs mono text-neutral-400 tracking-wider uppercase">// Sessions d'entraînement</div>
                  <div className="text-2xl font-black text-white tracking-tight my-2">{sessions.length}</div>
                  <div className="text-[11px] text-neutral-500 font-mono">Planifiées au calendrier hebdomadaire</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-none p-5">
                  <div className="flex items-center justify-between mb-4 border-b border-neutral-800 pb-2">
                    <h3 className="text-xs mono font-black uppercase text-neutral-400">// Dernières inscriptions d'athlètes</h3>
                    <span className="text-[10px] text-neutral-500 font-mono">Aperçu rapide</span>
                  </div>
                  <div className="flex flex-col divide-y divide-neutral-800">
                    {members.slice(0, 5).map(m => (
                      <div key={m.id} className="py-2.5 flex justify-between items-center text-xs mono">
                        <span className="text-white font-bold">{m.full_name} <span className="text-neutral-500 font-normal">• {m.discipline}</span></span>
                        <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-none ${m.status === "actif" ? "bg-emerald-950 text-emerald-400 border border-emerald-900" : "bg-red-950 text-red-400 border border-red-900"}`}>{m.status}</span>
                      </div>
                    ))}
                    {members.length === 0 && (
                      <div className="text-xs text-neutral-600 py-4 mono">Aucun membre enregistré dans cette organisation.</div>
                    )}
                  </div>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 rounded-none p-5 space-y-4">
                  <div className="text-xs mono font-black uppercase text-neutral-400 border-b border-neutral-800 pb-2">// Raccourcis tactiques</div>
                  <button 
                    onClick={handleQuickIncome}
                    className="w-full py-2.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-left px-3 text-xs font-mono font-bold uppercase transition-colors tracking-wide flex justify-between items-center"
                  >
                    <span>Encaisser 50 000 Ar</span>
                    <span className="text-neutral-500">💰 +</span>
                  </button>
                  <button 
                    onClick={() => setTab("MEMBRES")}
                    className="w-full py-2.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-left px-3 text-xs font-mono font-bold uppercase transition-colors tracking-wide flex justify-between items-center"
                  >
                    <span>Ajouter manuellement un membre</span>
                    <span className="text-neutral-500">👤 +</span>
                  </button>
                </div>
              </div>

            </div>
          )}

          {tab === "MEMBRES" && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-none overflow-hidden space-y-4 p-4">
              
              <div className="flex flex-col lg:flex-row gap-2 pb-4 border-b border-neutral-800">
                <input 
                  value={newMember.full_name} 
                  onChange={e => setNewMember({ ...newMember, full_name: e.target.value })} 
                  placeholder="Nom complet de l'athlète" 
                  className="h-10 bg-neutral-950 border border-neutral-800 rounded-none px-3 text-xs mono flex-1 outline-none focus:border-neutral-600 text-white placeholder-neutral-600" 
                />
                <select 
                  value={newMember.discipline} 
                  onChange={e => setNewMember({ ...newMember, discipline: e.target.value })} 
                  className="h-10 bg-neutral-950 border border-neutral-800 rounded-none px-3 text-xs mono outline-none text-neutral-300 focus:border-neutral-600"
                >
                  <option>MMA</option>
                  <option>Judo</option>
                  <option>Boxe Anglaise</option>
                  <option>Karaté</option>
                </select>
                <button 
                  onClick={addMember} 
                  className="h-10 px-6 bg-white text-black hover:bg-red-600 hover:text-white transition-colors text-xs mono font-black uppercase tracking-wider rounded-none"
                >
                  Ajouter licencié
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 items-center justify-between pt-2">
                <input 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Rechercher par nom ou discipline..."
                  className="h-8 w-full sm:w-64 bg-neutral-950 border border-neutral-800 rounded-none px-3 text-xs mono outline-none focus:border-neutral-700 placeholder-neutral-600"
                />
                
                <div className="flex gap-1 w-full sm:w-auto justify-end">
                  {(["tous", "actif", "impayé"] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setStatusFilter(f)}
                      className={`px-3 py-1 text-[10px] uppercase font-mono font-bold border ${statusFilter === f ? 'bg-white text-black border-white' : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white'}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs mono min-w-[600px]">
                  <thead className="bg-neutral-950 text-neutral-400 font-bold border-b border-neutral-800">
                    <tr>
                      <th className="text-left px-5 py-3 tracking-wider font-bold">NOM DE L'ATHLÈTE</th>
                      <th className="px-5 py-3 tracking-wider font-bold">DISCIPLINE</th>
                      <th className="px-5 py-3 tracking-wider font-bold">PLAN</th>
                      <th className="px-5 py-3 tracking-wider font-bold">STATUT ACCÈS</th>
                      <th className="text-right px-5 py-3 tracking-wider font-bold">ACTION RAPIDE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/40">
                    {filteredMembers.map(m => (
                      <tr key={m.id} className="hover:bg-neutral-950/40 transition-colors">
                        <td className="px-5 py-3.5 font-black text-white">{m.full_name}</td>
                        <td className="px-5 py-3.5 text-center text-neutral-300 font-bold">{m.discipline}</td>
                        <td className="px-5 py-3.5 text-center text-neutral-400">{m.plan}</td>
                        <td className="px-5 py-3.5 text-center">
                          <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-none border ${
                            m.status === "actif" 
                              ? "bg-emerald-950 text-emerald-400 border-emerald-900" 
                              : "bg-red-950 text-red-400 border-red-900"
                          }`}>
                            {m.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button 
                            onClick={() => toggleStatus(m.id, m.status)} 
                            className="h-7 px-3 bg-neutral-950 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 text-[10px] font-bold font-mono transition-colors rounded-none uppercase"
                          >
                            Permuter
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredMembers.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-6 text-neutral-600 font-mono">Aucun résultat trouvé pour cette sélection.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "PLANNING" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"].map((day, i) => (
                <div key={day} className="bg-neutral-900 border border-neutral-800 rounded-none p-4 space-y-3">
                  <div className="text-xs mono font-black text-neutral-400 border-b border-neutral-800 pb-1.5 uppercase tracking-wider">
                    // {day}
                  </div>
                  <div className="flex flex-col gap-2">
                    {sessions.filter(s => s.day_of_week === i).map(s => (
                      <div key={s.id} className="h-12 bg-neutral-950 border border-neutral-800/60 rounded-none px-3 flex items-center justify-between">
                        <span className="text-xs mono text-white font-bold">{s.title} <span className="text-neutral-500 text-[11px] font-normal">• {s.start_time?.slice(0, 5)}</span></span>
                        <span className="text-[10px] text-neutral-400 font-mono bg-neutral-900 px-2 py-0.5 border border-neutral-800">{s.coach_name}</span>
                      </div>
                    ))}
                    {sessions.filter(s => s.day_of_week === i).length === 0 && (
                      <div className="text-xs text-neutral-600 p-2 font-mono">Aucune session programmée</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "FINANCES" && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-none p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <h3 className="text-xs mono font-black uppercase text-neutral-400">// Grand livre des transactions • {transacs.length} entrées</h3>
                <span className="text-[11px] font-mono font-bold text-amber-500">Balance globale : {ca.toLocaleString()} Ar</span>
              </div>
              <div className="flex flex-col divide-y divide-neutral-800">
                {transacs.map(t => (
                  <div key={t.id} className="py-3 flex justify-between items-center text-xs mono hover:bg-neutral-950/20 px-2">
                    <div className="flex flex-col">
                      <span className="text-white font-bold">{t.description || "Règlement"}</span>
                      <span className="text-[10px] text-neutral-500">ID : {t.id.slice(0,8)}</span>
                    </div>
                    <span className={`font-black tracking-tight ${t.type === "income" ? "text-emerald-400" : "text-red-400"}`}>
                      {t.type === "income" ? "+" : "-"}{t.amount?.toLocaleString()} Ar
                    </span>
                  </div>
                ))}
                {transacs.length === 0 && (
                  <div className="text-xs text-neutral-600 py-6 text-center mono">Aucune transaction enregistrée.</div>
                )}
              </div>
            </div>
          )}

          {(tab === "PRESENCES" || tab === "BOUTIQUE") && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-none p-8 text-center space-y-3">
              <div className="text-sm mono text-neutral-400 uppercase tracking-widest">// Module en attente d'indexation</div>
              <p className="text-xs text-neutral-600 max-w-md mx-auto font-sans">Le module {tab.toLowerCase()} est en cours d'interconnexion avec les bases de données principales du club.</p>
            </div>
          )}

        </main>
      </div>
    </div>
  )
}
