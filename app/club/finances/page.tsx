"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/client"

type Tx = { id:string; transaction_type:"recette"|"depense"; category:string; label:string; amount:number; transaction_date:string }
const fmt = (n:number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")
const CATEGORIES = {
  recette: ["cotisation", "sponsoring", "ticket", "ppv", "vente_materiel", "autre_recette"],
  depense: ["location", "equipement", "coach", "federation", "deplacement", "marketing", "autre_depense"]
}

export default function ClubFinances(){
  const supabase = createClient()
  const [txs, setTxs] = useState<Tx[]>([])
  const [filter, setFilter] = useState<"all"|"recette"|"depense">("all")
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ transaction_type:"recette" as any, category:"cotisation", label:"", amount:50000, transaction_date: new Date().toISOString().slice(0,10) })

  const load = async()=>{
    const { data } = await supabase.from("club_transactions").select("*").order("transaction_date",{ascending:false}).limit(100)
    if(!data || data.length===0){
      setTxs([
        { id:"1", transaction_type:"recette", category:"cotisation", label:"Cotisations Mai - 24 membres", amount:1200000, transaction_date:"2026-05-01" },
        { id:"2", transaction_type:"depense", category:"location", label:"Location salle Ambodivona", amount:300000, transaction_date:"2026-05-02" },
        { id:"3", transaction_type:"depense", category:"equipement", label:"Gants + sacs", amount:150000, transaction_date:"2026-05-03" },
        { id:"4", transaction_type:"recette", category:"sponsoring", label:"Sponsor Fight Night", amount:500000, transaction_date:"2026-05-04" },
      ])
    } else setTxs(data as any)
  }
  useEffect(()=>{ load() },[])

  const recettes = txs.filter(t=>t.transaction_type==="recette").reduce((s,t)=>s+t.amount,0)
  const depenses = txs.filter(t=>t.transaction_type==="depense").reduce((s,t)=>s+t.amount,0)
  const marge = recettes - depenses
  const target = 1500000
  const taux = Math.round((recettes/target)*100)
  const filtered = filter==="all"? txs : txs.filter(t=>t.transaction_type===filter)

  const handleAdd = async()=>{
    const { data } = await supabase.from("club_transactions").insert({
      transaction_type: form.transaction_type,
      category: form.category,
      label: form.label,
      amount: Number(form.amount),
      transaction_date: form.transaction_date
    }).select().single()
    if(data) setTxs([data as any,...txs])
    else setTxs([{ id: Date.now().toString(),...form } as any,...txs])
    setShowAdd(false)
    setForm({...form, label:"", amount:50000})
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-8 relative z-0">
      <div className="max-w- mx-auto">
        {/* HEADER - C'ETAIT LUI QUI ETAIT CACHE */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-8 pt-20">
          <div>
            <h1 className="font-mono font-black text- tracking-widest">FINANCES • TITAN</h1>
            <p className="font-mono text- text-neutral-500 uppercase mt-1">Objectif {fmt(target)} Ar • {taux}% atteint</p>
          </div>
          <div className="flex gap-2">
            <button onClick={()=>setShowAdd(true)} className="h-9 px-5 bg-white text-black font-mono text- font-bold uppercase rounded-full hover:bg-neutral-200">+ Transaction</button>
            <button onClick={()=>window.print()} className="h-9 px-5 border border-neutral-800 font-mono text- uppercase rounded-full">Export PDF</button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-4">
            <div className="font-mono text- uppercase text-neutral-500">Encaissements</div>
            <div className="font-mono font-black text- text-green-400 mt-2">+{fmt(recettes)} Ar</div>
            <div className="w-full h-1 bg-neutral-900 mt-3 rounded"><div className="h-1 bg-green-500 rounded" style={{width:`${Math.min(taux,100)}%`}} /></div>
          </div>
          <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-4">
            <div className="font-mono text- uppercase text-neutral-500">Dépenses</div>
            <div className="font-mono font-black text- text-red-400 mt-2">-{fmt(depenses)} Ar</div>
            <div className="font-mono text- text-neutral-600 mt-3">{((depenses/recettes)*100||0).toFixed(0)}% des recettes</div>
          </div>
          <div className={`bg-neutral-950 border rounded-2xl p-4 ${marge>=0?'border-green-900/30':'border-red-900/50'}`}>
            <div className="font-mono text- uppercase text-neutral-500">Marge nette</div>
            <div className={`font-mono font-black text- mt-2 ${marge>=0?'text-white':'text-red-400'}`}>{fmt(marge)} Ar</div>
            <div className="font-mono text- text-neutral-500 mt-3">Bénéfice Mai 2026</div>
          </div>
          <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-4">
            <div className="font-mono text- uppercase text-neutral-500">Objectif vs Réalisé</div>
            <div className="font-mono font-black text- mt-2">{taux}%</div>
            <div className="font-mono text- text-neutral-500 mt-3">{fmt(recettes)} / {fmt(target)} Ar</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-5">
            <h3 className="font-mono font-bold text- uppercase mb-4">Répartition</h3>
            <div className="space-y-3">
              {Object.entries(txs.reduce((acc:any,t)=>{acc[t.category]=(acc[t.category]||0)+t.amount; return acc},{})).map(([cat, amount]:any)=>(
                <div key={cat} className="flex justify-between items-center font-mono text-">
                  <span className="uppercase text-neutral-400">{cat}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-1.5 bg-neutral-900 rounded"><div className="h-1.5 bg-white rounded" style={{width:`${Math.min((amount/recettes)*100,100)}%`}} /></div>
                    <span className="w-20 text-right">{fmt(Number(amount))} Ar</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-2 bg-neutral-950 border border-neutral-900 rounded-2xl overflow-hidden">
            <div className="p-4 flex justify-between items-center border-b border-neutral-900">
              <div className="flex gap-1">
                {(["all","recette","depense"] as const).map(f=>(
                  <button key={f} onClick={()=>setFilter(f)} className={`h-7 px-3 rounded-full font-mono text- uppercase border ${filter===f?'bg-white text-black border-white':'border-neutral-800 text-neutral-500'}`}>{f}</button>
                ))}
              </div>
              <span className="font-mono text- text-neutral-600">{filtered.length} transactions</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full font-mono text-">
                <thead className="text- uppercase text-neutral-500 border-b border-neutral-900"><tr><th className="text-left p-3">Date</th><th className="text-left">Label</th><th>Cat</th><th className="text-right pr-4">Montant</th></tr></thead>
                <tbody>
                  {filtered.map(t=>(
                    <tr key={t.id} className="border-b border-neutral-900/50 hover:bg-neutral-900/50">
                      <td className="p-3 text-neutral-400">{t.transaction_date}</td>
                      <td className="font-bold">{t.label}</td>
                      <td><span className={`px-2 py-0.5 rounded-full text- uppercase ${t.transaction_type==='recette'?'bg-green-900/20 text-green-400':'bg-red-900/20 text-red-400'}`}>{t.category}</span></td>
                      <td className={`text-right pr-4 font-black ${t.transaction_type==='recette'?'text-green-400':'text-red-400'}`}>{t.transaction_type==='recette'?'+':''}{fmt(t.amount)} Ar</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      {showAdd && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur grid place-items-center p-4">
          <div className="w-full max-w- bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
            <h3 className="font-mono font-bold text- uppercase mb-4">Nouvelle transaction</h3>
            <div className="space-y-3 font-mono text-">
              <select value={form.transaction_type} onChange={e=>setForm({...form, transaction_type:e.target.value as any, category: CATEGORIES[e.target.value as keyof typeof CATEGORIES][0]})} className="w-full h-10 bg-black border border-neutral-800 rounded-xl px-3">
                <option value="recette">Recette</option><option value="depense">Dépense</option>
              </select>
              <select value={form.category} onChange={e=>setForm({...form, category:e.target.value})} className="w-full h-10 bg-black border border-neutral-800 rounded-xl px-3">
                {CATEGORIES[form.transaction_type as keyof typeof CATEGORIES].map(c=><option key={c} value={c}>{c}</option>)}
              </select>
              <input value={form.label} onChange={e=>setForm({...form, label:e.target.value})} placeholder="Ex: Location salle" className="w-full h-10 bg-black border border-neutral-800 rounded-xl px-3" />
              <input type="number" value={form.amount} onChange={e=>setForm({...form, amount:Number(e.target.value)})} className="w-full h-10 bg-black border border-neutral-800 rounded-xl px-3" />
              <input type="date" value={form.transaction_date} onChange={e=>setForm({...form, transaction_date:e.target.value})} className="w-full h-10 bg-black border border-neutral-800 rounded-xl px-3" />
              <div className="flex gap-2 pt-2">
                <button onClick={()=>setShowAdd(false)} className="flex-1 h-10 border border-neutral-800 rounded-xl uppercase text-">Annuler</button>
                <button onClick={handleAdd} className="flex-1 h-10 bg-white text-black rounded-xl uppercase font-bold text-">Enregistrer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}