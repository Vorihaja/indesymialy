"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/client"

const fmt = (n:number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")
type Tab = "overview" | "combats" | "finances" | "entrainements" | "profil"
type Tx = { id:string; transaction_type:"recette"|"depense"; category:string; label:string; amount:number; transaction_date:string }
type Fight = { id:string; fighter_id?:string; opponent:string; event:string; result: "victoire" | "defaite" | "nul" | "a_venir"; purse:number; fight_date:string }
type Profile = { id?:string; full_name:string; phone:string; email:string; team:string; discipline:string; weight:number; height:number; licence:string; address:string; cin:string; emergency_contact:string }

const CATEGORIES = {
  recette: ["purse", "prime_victoire", "sponsoring", "ppv_part", "autre_recette"],
  depense: ["coach_cut", "manager_cut", "medical", "licence", "deplacement", "equipement", "autre_depense"]
}

export default function FighterDashboard(){
  const supabase = createClient()
  const [tab, setTab] = useState<Tab>("finances")
  const [txs, setTxs] = useState<Tx[]>([])
  const [fights, setFights] = useState<Fight[]>([])
  const [profile, setProfile] = useState<Profile>({
    full_name: "Mialy Rakoto",
    phone: "034 12 345 67",
    email: "mialy@titan.mg",
    team: "TITAN FIGHT CLUB",
    discipline: "MMA - 70kg",
    weight: 70,
    height: 178,
    licence: "MMA-MG-2026-042",
    address: "Ambodivona, Antananarivo",
    cin: "101 234 567 890",
    emergency_contact: "033 98 765 43"
  })
  const [filter, setFilter] = useState<"all"|"recette"|"depense">("all")
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ transaction_type:"recette" as any, category:"purse", label:"", amount:500000, transaction_date: new Date().toISOString().slice(0,10) })
  const [q, setQ] = useState("")

  const load = async()=>{
    // Transactions combattant
    const { data: t } = await supabase.from("fighter_transactions").select("*").order("transaction_date",{ascending:false}).limit(100)
    if(!t || t.length===0){
      setTxs([
        { id:"1", transaction_type:"recette", category:"purse", label:"Fight Night Antananarivo vs Rajo", amount:800000, transaction_date:"2026-04-12" },
        { id:"2", transaction_type:"depense", category:"coach_cut", label:"Cut Coach 20%", amount:160000, transaction_date:"2026-04-13" },
        { id:"3", transaction_type:"depense", category:"medical", label:"Visite medicale + IRM", amount:120000, transaction_date:"2026-04-20" },
        { id:"4", transaction_type:"recette", category:"prime_victoire", label:"Prime victoire KO", amount:200000, transaction_date:"2026-04-12" },
        { id:"5", transaction_type:"recette", category:"sponsoring", label:"Sponsor Titan Wear", amount:300000, transaction_date:"2026-05-01" },
      ])
    } else setTxs(t as any)

    const { data: f } = await supabase.from("fighter_fights").select("*").order("fight_date",{ascending:false}).limit(50)
    if(!f || f.length===0){
      setFights([
        { id:"1", opponent:"Rajo Andrian", event:"TITAN Fight Night 12", result:"victoire", purse:800000, fight_date:"2026-04-12" },
        { id:"2", opponent:"Sitraka Pro", event:"MMA Madagascar Open", result:"a_venir", purse:1000000, fight_date:"2026-06-15" },
        { id:"3", opponent:"Lova Killa", event:"Underground 8", result:"defaite", purse:400000, fight_date:"2026-02-10" },
      ])
    } else setFights(f as any)

    // Profil combattant
    const { data: p } = await supabase.from("fighter_profiles").select("*").limit(1).single()
    if(p) setProfile(p as any)
  }
  useEffect(()=>{ load() },[])

  const recettes = txs.filter(t=>t.transaction_type==="recette").reduce((s,t)=>s+t.amount,0)
  const depenses = txs.filter(t=>t.transaction_type==="depense").reduce((s,t)=>s+t.amount,0)
  const marge = recettes - depenses
  const target = 2000000
  const taux = Math.round((recettes/target)*100)
  const filtered = filter==="all"? txs : txs.filter(t=>t.transaction_type===filter)

  const handleAdd = async()=>{
    const { data } = await supabase.from("fighter_transactions").insert({
      transaction_type: form.transaction_type, category: form.category, label: form.label, amount: Number(form.amount), transaction_date: form.transaction_date
    }).select().single()
    if(data) setTxs([data as any,...txs])
    else setTxs([{ id: Date.now().toString(),...form } as any,...txs])
    setShowAdd(false)
  }

  const wins = fights.filter(f=>f.result==="victoire").length

  return (
    <div className="w-full bg-black text-white px-4 sm:px-8 pb-10">
      <div className="max-w- mx-auto">
        <div className="flex items-center justify-between py-6">
          <h1 className="font-mono font-black tracking-widest">TITAN FIGHTER • ERP</h1>
          <div className="flex gap-1 rounded-full p-18">
            {(["overview","combats","finances","entrainements","profil"] as Tab[]).map(t=>(
              <button key={t} onClick={()=>setTab(t)} className={`h-7 px-4 rounded-full font-mono text-xs uppercase ${tab===t?'bg-white text-black font-bold':'text-neutral-500'}`}>{t}</button>
            ))}
          </div>
        </div>

        {tab==="overview" && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-4"><div className="font-mono text-xs uppercase text-neutral-500">Gains Totaux</div><div className="font-mono font-black text-lg text-green-400 mt-2">+{fmt(recettes)} Ar</div></div>
            <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-4"><div className="font-mono text-xs uppercase text-neutral-500">Cuts & Frais</div><div className="font-mono font-black text-lg text-red-400 mt-2">-{fmt(depenses)} Ar</div></div>
            <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-4"><div className="font-mono text-xs uppercase text-neutral-500">Net Combattant</div><div className="font-mono font-black text-lg mt-2">{fmt(marge)} Ar</div></div>
            <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-4"><div className="font-mono text-xs uppercase text-neutral-500">Victoires</div><div className="font-mono font-black text-lg mt-2">{wins} / {fights.length}</div></div>
          </div>
        )}

        {tab==="combats" && (
          <div className="bg-neutral-950 border border-neutral-900 rounded-2xl overflow-hidden">
            <div className="p-4 flex justify-between items-center border-b border-neutral-900">
              <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Rechercher adversaire..." className="h-9 w-64 bg-black border border-neutral-800 rounded-full px-4 font-mono text-xs" />
              <div className="font-mono text-xs text-neutral-500">{fights.length} combats</div>
            </div>
            <table className="w-full font-mono text-xs">
              <thead className="text-[10px] uppercase text-neutral-500 border-b border-neutral-900"><tr><th className="text-left p-3">Date</th><th className="text-left">Event vs Adversaire</th><th>Résultat</th><th className="text-right pr-4">Purse</th></tr></thead>
              <tbody>
                {fights.filter(f=>f.opponent.toLowerCase().includes(q.toLowerCase()) || f.event.toLowerCase().includes(q.toLowerCase())).map(f=>(
                  <tr key={f.id} className="border-b border-neutral-900/50 hover:bg-neutral-900/50">
                    <td className="p-3 text-neutral-400">{f.fight_date}</td>
                    <td><span className="font-bold">{f.event}</span> <span className="text-neutral-500">vs {f.opponent}</span></td>
                    <td><span className={`px-2 py-0.5 rounded-full text-[10px] uppercase ${f.result==='victoire'?'bg-green-900/20 text-green-400':f.result==='defaite'?'bg-red-900/20 text-red-400':'bg-neutral-800 text-neutral-400'}`}>{f.result}</span></td>
                    <td className="text-right pr-4 font-black text-green-400">+{fmt(f.purse)} Ar</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab==="finances" && (
          <>
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="font-mono font-black tracking-widest">FINANCES COMBATTANT</h2>
                <p className="font-mono text-xs text-neutral-500 uppercase">Objectif {fmt(target)} Ar • {taux}% atteint</p>
              </div>
              <div className="flex gap-2">
                <button onClick={()=>setShowAdd(true)} className="h-9 px-5 bg-white text-black font-mono text-xs font-bold uppercase rounded-full">+ Transaction</button>
                <button onClick={()=>window.print()} className="h-9 px-5 border border-neutral-800 font-mono text-xs uppercase rounded-full">Export PDF</button>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-4"><div className="font-mono text-xs uppercase text-neutral-500">Gains</div><div className="font-mono font-black text-green-400 mt-2">+{fmt(recettes)} Ar</div><div className="w-full h-1 bg-neutral-900 mt-3 rounded"><div className="h-1 bg-green-500 rounded" style={{width:`${Math.min(taux,100)}%`}} /></div></div>
              <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-4"><div className="font-mono text-xs uppercase text-neutral-500">Cuts & Dépenses</div><div className="font-mono font-black text-red-400 mt-2">-{fmt(depenses)} Ar</div><div className="font-mono text-xs text-neutral-600 mt-3">{((depenses/recettes)*100||0).toFixed(0)}% des gains</div></div>
              <div className={`bg-neutral-950 border rounded-2xl p-4 ${marge>=0?'border-green-900/30':'border-red-900/50'}`}><div className="font-mono text-xs uppercase text-neutral-500">Net à empocher</div><div className={`font-mono font-black mt-2 ${marge>=0?'text-white':'text-red-400'}`}>{fmt(marge)} Ar</div><div className="font-mono text-xs text-neutral-500 mt-3">Saison 2026</div></div>
              <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-4"><div className="font-mono text-xs uppercase text-neutral-500">Objectif vs Réalisé</div><div className="font-mono font-black mt-2">{taux}%</div><div className="font-mono text-xs text-neutral-500 mt-3">{fmt(recettes)} / {fmt(target)} Ar</div></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-5">
                <h3 className="font-mono font-bold text-xs uppercase mb-4">Répartition</h3>
                <div className="space-y-3">
                  {Object.entries(txs.reduce((acc:any,t)=>{acc[t.category]=(acc[t.category]||0)+t.amount; return acc},{})).map(([cat, amount]:any)=>(
                    <div key={cat} className="flex justify-between items-center font-mono text-xs">
                      <span className="uppercase text-neutral-400">{cat}</span>
                      <div className="flex items-center gap-3"><div className="w-24 h-1.5 bg-neutral-900 rounded"><div className="h-1.5 bg-white rounded" style={{width:`${Math.min((amount/recettes)*100,100)}%`}} /></div><span className="w-20 text-right">{fmt(Number(amount))} Ar</span></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="lg:col-span-2 bg-neutral-950 border border-neutral-900 rounded-2xl overflow-hidden">
                <div className="p-4 flex justify-between items-center border-b border-neutral-900">
                  <div className="flex gap-1">{(["all","recette","depense"] as const).map(f=>(<button key={f} onClick={()=>setFilter(f)} className={`h-7 px-3 rounded-full font-mono text-[10px] uppercase border ${filter===f?'bg-white text-black border-white':'border-neutral-800 text-neutral-500'}`}>{f}</button>))}</div>
                  <span className="font-mono text-xs text-neutral-600">{filtered.length} transactions</span>
                </div>
                <div className="overflow-x-auto"><table className="w-full font-mono text-xs"><thead className="text-[10px] uppercase text-neutral-500 border-b border-neutral-900"><tr><th className="text-left p-3">Date</th><th className="text-left">Label</th><th>Cat</th><th className="text-right pr-4">Montant</th></tr></thead><tbody>{filtered.map(t=>(<tr key={t.id} className="border-b border-neutral-900/50 hover:bg-neutral-900/50"><td className="p-3 text-neutral-400">{t.transaction_date}</td><td className="font-bold">{t.label}</td><td><span className={`px-2 py-0.5 rounded-full text-[10px] uppercase ${t.transaction_type==='recette'?'bg-green-900/20 text-green-400':'bg-red-900/20 text-red-400'}`}>{t.category}</span></td><td className={`text-right pr-4 font-black ${t.transaction_type==='recette'?'text-green-400':'text-red-400'}`}>{t.transaction_type==='recette'?'+':''}{fmt(t.amount)} Ar</td></tr>))}</tbody></table></div>
              </div>
            </div>
          </>
        )}

        {tab==="profil" && (
          <div className="space-y-4">
            <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-6 flex justify-between items-start">
              <div className="flex gap-4 items-center">
                <div className="w-16 h-16 rounded-full bg-white text-black grid place-items-center font-mono font-black text-xl">{profile.full_name.split(" ").map(n=>n[0]).join("").slice(0,2)}</div>
                <div>
                  <h2 className="font-mono font-black text-lg tracking-widest uppercase">{profile.full_name}</h2>
                  <p className="font-mono text-xs text-neutral-500 uppercase">{profile.team} • {profile.discipline}</p>
                  <div className="flex gap-2 mt-2">
                    <span className="px-2 py-0.5 rounded-full bg-green-900/20 text-green-400 text-[10px] font-mono uppercase">Licence {profile.licence}</span>
                    <span className="px-2 py-0.5 rounded-full bg-neutral-900 text-neutral-400 text-[10px] font-mono uppercase">{profile.weight}KG / {profile.height}CM</span>
                  </div>
                </div>
              </div>
              <button onClick={()=>alert('Edit profil à brancher')} className="h-8 px-4 border border-neutral-800 rounded-full font-mono text-[10px] uppercase">Editer</button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-5">
                <h3 className="font-mono font-bold text-xs uppercase mb-4 text-neutral-400">Coordonnées</h3>
                <div className="space-y-4 font-mono text-xs">
                  <div><div className="text-[10px] uppercase text-neutral-600">Téléphone</div><div className="mt-1 font-bold">{profile.phone}</div></div>
                  <div><div className="text-[10px] uppercase text-neutral-600">Email</div><div className="mt-1 font-bold">{profile.email}</div></div>
                  <div><div className="text-[10px] uppercase text-neutral-600">Adresse</div><div className="mt-1">{profile.address}</div></div>
                  <div><div className="text-[10px] uppercase text-neutral-600">Contact Urgence</div><div className="mt-1 font-bold text-red-400">{profile.emergency_contact}</div></div>
                </div>
              </div>

              <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-5">
                <h3 className="font-mono font-bold text-xs uppercase mb-4 text-neutral-400">Renseignements Sportifs</h3>
                <div className="space-y-4 font-mono text-xs">
                  <div className="flex justify-between"><span className="text-neutral-500 uppercase text-[10px]">Discipline</span><span className="font-bold">{profile.discipline}</span></div>
                  <div className="flex justify-between"><span className="text-neutral-500 uppercase text-[10px]">Equipe</span><span className="font-bold">{profile.team}</span></div>
                  <div className="flex justify-between"><span className="text-neutral-500 uppercase text-[10px]">Poids</span><span className="font-bold">{profile.weight} kg</span></div>
                  <div className="flex justify-between"><span className="text-neutral-500 uppercase text-[10px]">Taille</span><span className="font-bold">{profile.height} cm</span></div>
                  <div className="flex justify-between"><span className="text-neutral-500 uppercase text-[10px]">Licence</span><span className="font-bold text-green-400">{profile.licence}</span></div>
                  <div className="w-full h-px bg-neutral-900 my-2" />
                  <div className="flex justify-between"><span className="text-neutral-500 uppercase text-[10px]">Combats</span><span className="font-bold">{fights.length}</span></div>
                  <div className="flex justify-between"><span className="text-neutral-500 uppercase text-[10px]">Victoires</span><span className="font-bold text-green-400">{fights.filter(f=>f.result==='victoire').length}</span></div>
                </div>
              </div>

              <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-5">
                <h3 className="font-mono font-bold text-xs uppercase mb-4 text-neutral-400">Documents & Identité</h3>
                <div className="space-y-4 font-mono text-xs">
                  <div><div className="text-[10px] uppercase text-neutral-600">CIN</div><div className="mt-1 font-bold">{profile.cin}</div></div>
                  <div><div className="text-[10px] uppercase text-neutral-600">Statut Médical</div><div className="mt-1 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500" /> <span className="text-green-400 font-bold uppercase">Apte - 12/2026</span></div></div>
                  <div className="pt-2 space-y-2">
                    <button className="w-full h-9 bg-white text-black rounded-full font-bold uppercase text-[10px]">Voir Licence PDF</button>
                    <button className="w-full h-9 border border-neutral-800 rounded-full uppercase text-[10px]">Certificat Médical</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab==="entrainements" && <div className="font-mono text-xs text-neutral-500 py-20 text-center border border-dashed border-neutral-800 rounded-2xl">Module entrainements / pointage - même structure que présences Club</div>}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur grid place-items-center p-4">
          <div className="w-full max-w-md bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
            <h3 className="font-mono font-bold text-xs uppercase mb-4">Nouvelle transaction combattant</h3>
            <div className="space-y-3 font-mono text-xs">
              <select value={form.transaction_type} onChange={e=>setForm({...form, transaction_type:e.target.value as any, category: CATEGORIES[e.target.value as keyof typeof CATEGORIES][0]})} className="w-full h-10 bg-black border border-neutral-800 rounded-xl px-3"><option value="recette">Recette</option><option value="depense">Dépense</option></select>
              <select value={form.category} onChange={e=>setForm({...form, category:e.target.value})} className="w-full h-10 bg-black border border-neutral-800 rounded-xl px-3">{CATEGORIES[form.transaction_type as keyof typeof CATEGORIES].map(c=><option key={c} value={c}>{c}</option>)}</select>
              <input value={form.label} onChange={e=>setForm({...form, label:e.target.value})} placeholder="Ex: Purse vs..." className="w-full h-10 bg-black border border-neutral-800 rounded-xl px-3" />
              <input type="number" value={form.amount} onChange={e=>setForm({...form, amount:Number(e.target.value)})} className="w-full h-10 bg-black border border-neutral-800 rounded-xl px-3" />
              <input type="date" value={form.transaction_date} onChange={e=>setForm({...form, transaction_date:e.target.value})} className="w-full h-10 bg-black border border-neutral-800 rounded-xl px-3" />
              <div className="flex gap-2 pt-2"><button onClick={()=>setShowAdd(false)} className="flex-1 h-10 border border-neutral-800 rounded-xl uppercase">Annuler</button><button onClick={handleAdd} className="flex-1 h-10 bg-white text-black rounded-xl uppercase font-bold">Enregistrer</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
