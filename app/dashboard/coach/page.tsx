"use client"

import React, { useState, useRef, createContext, useContext } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard, Users, Dumbbell, Calendar, Wallet, 
  Search, Bell, Plus, X, Eye, Shield, Activity, Target, Flame, Video
} from "lucide-react"

type CoachModule = "overview" | "roster" | "trainings" | "camps" | "matchmaking" | "perfs" | "medical" | "finances" | "messages"
type PopupType = "info" | "success" | "warning" | "confirm" | "prompt"
interface PopupState { open: boolean; title: string; message: string; type: PopupType; confirmText?: string; cancelText?: string; onConfirm?: (...a: unknown[]) => void; onCancel?: () => void; showInput?: boolean; inputPlaceholder?: string; inputValue?: string }
const PopupContext = createContext<{
  showPopup: (o: Partial<PopupState> & { title: string; message: string }) => void;
  showConfirm: (o: Partial<PopupState> & { title: string; message: string }) => void;
  showPrompt?: (o: Partial<PopupState> & { title: string; message: string }) => void;
} | null>(null)

type SetPopupType = React.Dispatch<React.SetStateAction<PopupState>>

function BrandPopup({ popup, setPopup }: { popup: PopupState; setPopup: SetPopupType }) {
  const prevInputValue = useRef(popup.inputValue || "")
  const [input, setInput] = useState(popup.inputValue || "")
  if (popup.open && input !== (popup.inputValue || "") && prevInputValue.current !== (popup.inputValue || "")) {
    prevInputValue.current = popup.inputValue || ""
    setInput(popup.inputValue || "")
  }
  if (!popup.open) return null
  const close = () => setPopup((p) => ({...p, open: false }))
  const ok = () => { if (popup.showInput && !input.trim()) return; popup.onConfirm?.(input.trim()); close() }
  const cancel = () => { popup.onCancel?.(); close() }
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={cancel} />
      <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 shadow-xl">
        <div className="h-1 w-full bg-amber-500" />
        <div className="p-3.5">
          <div className="flex justify-between">
            <div className="flex items-center gap-1.5">
              <div className="h-5 w-5 bg-amber-500 text-black font-black text-xs flex items-center justify-center">IM</div>
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Indesy Mialy • Coach</span>
            </div>
            <button onClick={cancel}><X className="h-3 w-3 text-zinc-600" /></button>
          </div>
          <h4 className="mt-3 text-[11.5px] font-bold uppercase text-white">{popup.title}</h4>
          <p className="mt-1 text-xs leading-[1.5] text-zinc-400 whitespace-pre-wrap">{popup.message}</p>
          {popup.showInput && <input autoFocus value={input} onChange={e => setInput(e.target.value)} placeholder={popup.inputPlaceholder} className="mt-3 h-8 w-full bg-zinc-900 border border-zinc-800 px-2.5 text-xs text-white outline-none" />}
          <div className="mt-3.5 flex justify-end gap-1.5">
            {(popup.type === "confirm" || popup.showInput) && <button onClick={cancel} className="h-7 px-3 text-[10.5px] border border-zinc-800 text-zinc-400">{popup.cancelText || "Annuler"}</button>}
            <button onClick={ok} className="h-7 px-3 text-[10.5px] font-bold bg-amber-500 text-black">{popup.confirmText || "OK"}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function OverviewModule() {
  const ctx = useContext(PopupContext)
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="border border-zinc-900 bg-zinc-950 p-4"><p className="text-xs uppercase font-bold text-zinc-500">Combattants actifs</p><p className="mt-1 text-xl font-black text-white">8</p><p className="text-xs text-emerald-400">2 en fight camp</p></div>
        <div className="border border-zinc-900 bg-zinc-950 p-4"><p className="text-xs uppercase font-bold text-zinc-500">Combats ce mois</p><p className="mt-1 text-xl font-black text-amber-400">3</p><p className="text-xs text-zinc-500">15/08 • 02/09 • 20/09</p></div>
        <div className="border border-zinc-900 bg-zinc-950 p-4"><p className="text-xs uppercase font-bold text-zinc-500">Charge entraînement</p><p className="mt-1 text-xl font-black text-white">84%</p><p className="text-xs text-zinc-500">12 séances / semaine</p></div>
        <div className="border border-zinc-900 bg-zinc-950 p-4"><p className="text-xs uppercase font-bold text-zinc-500">Win rate roster</p><p className="mt-1 text-xl font-black text-white">71%</p><p className="text-xs text-emerald-400">17W-7L en 2026</p></div>
      </div>
      <div className="grid md:grid-cols-3 gap-3">
        <div className="md:col-span-2 border border-zinc-900 bg-zinc-950 p-5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2"><Flame className="h-4 w-4 text-amber-500" />Alertes Fight Camp</h3>
          <div className="mt-3 space-y-2">
            <div className="flex justify-between items-center bg-amber-500/10 border border-amber-500/20 p-3"><span className="text-xs text-amber-200">Rakoto • Weight cut -4.2kg en 8j • Suivi hydratation requis</span><button onClick={() => ctx?.showPopup({ title: "Poids", message: "Ouvre suivi poids détaillé", type: "warning" })} className="text-xs font-bold text-amber-400 underline">Voir</button></div>
            <div className="flex justify-between items-center bg-red-500/10 border border-red-500/20 p-3"><span className="text-xs text-red-300">Andry T. • Certif médical expire dans 5j • Bloque combat</span><button className="text-xs font-bold text-red-400 underline">Régulariser</button></div>
          </div>
        </div>
        <div className="border border-zinc-900 bg-zinc-950 p-5">
          <h3 className="text-sm font-bold text-white">Prochain combat</h3>
          <p className="text-sm font-black text-white mt-2">Andry T. vs Sitraka R.</p>
          <p className="text-xs text-zinc-500 flex items-center gap-2 mt-1"><Calendar className="h-3 w-3" />15 Août 20h30 • MFN VI</p>
          <div className="mt-3 h-1.5 w-full bg-zinc-900"><div className="h-full bg-amber-500" style={{ width: "68%" }} /></div>
          <p className="mt-1 text-xs text-zinc-500">Fight camp 68% • Sparring final Jeudi</p>
        </div>
      </div>
    </div>
  )
}

function RosterModule() {
  const ctx = useContext(PopupContext)
  const fighters = [{ id: "f1", name: "Rakoto 'Giant'", cat: "-77kg", rec: "8-2", status: "Camp", weight: "81.2kg", med: "Valide" }, { id: "f2", name: "Andry T.", cat: "-84kg", rec: "5-1", status: "Camp", weight: "86.4kg", med: "Expire 5j" }, { id: "f3", name: "Sitraka R.", cat: "-77kg", rec: "6-3", status: "Actif", weight: "78.1kg", med: "Valide" }]
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center"><h3 className="text-sm font-bold text-white">Mon Roster • {fighters.length}</h3><button onClick={() => ctx?.showPopup({ title: "Ajouter combattant", message: "Invitation lien roster", type: "prompt" })} className="h-8 px-3 bg-amber-500 text-black text-xs font-bold flex items-center gap-1.5"><Plus className="h-3.5 w-3.5" />Ajouter</button></div>
      <div className="border border-zinc-900 bg-zinc-950 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-zinc-900/30 border-b border-zinc-900 text-xs uppercase font-bold text-zinc-500">
              <th className="p-3">Combattant</th>
              <th className="p-3">Cat</th>
              <th className="p-3">Record</th>
              <th className="p-3">Poids</th>
              <th className="p-3">Médical</th>
              <th className="p-3">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900 text-xs">
            {fighters.map((f) => (
              <tr key={f.id} className="hover:bg-zinc-900/20">
                <td className="p-3 font-bold text-white flex items-center gap-2"><div className="h-7 w-7 bg-zinc-800 flex items-center justify-center text-xs font-black">{f.name[0]}</div>{f.name}</td>
                <td className="p-3 text-zinc-400">{f.cat}</td>
                <td className="p-3 text-zinc-300 font-mono">{f.rec}</td>
                <td className="p-3 text-zinc-400">{f.weight}</td>
                <td className="p-3"><span className={`px-1.5 py-0.5 text-xs font-bold ${f.med === "Valide"? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>{f.med}</span></td>
                <td className="p-3"><span className={`px-2 py-0.5 text-xs font-bold uppercase ${f.status === "Camp"? "bg-amber-500/10 text-amber-400" : "bg-zinc-800 text-zinc-400"}`}>{f.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TrainingsModule() {
  const days = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]
  return (
    <div className="space-y-3">
      <div className="flex justify-between"><h3 className="text-sm font-bold text-white">Planning Hebdo • Alpha MMA</h3><span className="text-xs text-zinc-500">12 séances • 8 combattants</span></div>
      <div className="grid grid-cols-7 gap-2">
        {days.map((d) => (
          <div key={d} className="border border-zinc-900 bg-zinc-950 p-2.5">
            <p className="text-xs font-bold text-zinc-400">{d}</p>
            <div className="mt-2 space-y-1.5">
              <div className="bg-zinc-900 border border-zinc-800 p-1.5"><p className="text-xs font-bold text-white">06:30 • Cardio</p><p className="text-xs text-zinc-500">Tous</p></div>
              <div className="bg-amber-500/10 border border-amber-500/20 p-1.5"><p className="text-xs font-bold text-amber-300">18:00 • Sparring</p><p className="text-xs text-zinc-500">Camp MFN</p></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CampsModule() {
  const ctx = useContext(PopupContext)
  return (
    <div className="space-y-3">
      <div className="border border-amber-500/20 bg-amber-500/5 p-5 flex justify-between items-center">
        <div>
          <p className="text-sm font-black text-white">Fight Camp • MFN VI • Andry T.</p>
          <p className="text-xs text-zinc-400 mt-1">6 semaines • Semaine 4/6 • Focus : lutte défensive + cardio</p>
          <div className="mt-2 h-1.5 w-64 bg-zinc-900"><div className="h-full bg-amber-500" style={{ width: "68%" }} /></div>
        </div>
        <button onClick={() => ctx?.showPopup({ title: "Camp", message: "Programme détaillé + sparring partners", type: "info" })} className="h-8 px-3 bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">Voir programme</button>
      </div>
      <div className="grid md:grid-cols-3 gap-2">
        <div className="border border-zinc-900 bg-zinc-950 p-3"><p className="text-xs uppercase font-bold text-zinc-500">Sparring</p><p className="text-sm font-bold text-white mt-1">8/10 prévus</p></div>
        <div className="border border-zinc-900 bg-zinc-950 p-3"><p className="text-xs uppercase font-bold text-zinc-500">Weight cut</p><p className="text-sm font-bold text-amber-400 mt-1">-2.6kg restants</p></div>
        <div className="border border-zinc-900 bg-zinc-950 p-3"><p className="text-xs uppercase font-bold text-zinc-500">Vidéos analysées</p><p className="text-sm font-bold text-white mt-1">14</p></div>
      </div>
    </div>
  )
}

function MatchmakingModule() {
  const ctx = useContext(PopupContext)
  return (
    <div className="space-y-3">
      {[{ adv: "Défi reçu : Rova K. veut Andry T. (-84kg)", bourse: "800k Ar + prime", st: "À décider" }, { adv: "Offre orga : MFN VII - Rakoto vs Bema (-77kg)", bourse: "1.2M Ar", st: "En attente" }].map((m) => (
        <div key={m.adv} className="border border-zinc-900 bg-zinc-950 p-4 flex justify-between items-center">
          <div><p className="text-sm font-bold text-white">{m.adv}</p><p className="text-xs text-zinc-500">{m.bourse}</p></div>
          <div className="flex gap-1.5">
            <button onClick={() => ctx?.showPopup({ title: "Refusé", message: "Défi décliné", type: "info" })} className="h-7 px-3 border border-zinc-800 text-xs text-zinc-400">Décliner</button>
            <button onClick={() => ctx?.showConfirm({ title: "Accepter?", message: m.adv, confirmText: "Accepter", onConfirm: () => ctx.showPopup({ title: "Accepté", message: "Manager orga notifié", type: "success" }) })} className="h-7 px-3 bg-amber-500 text-black text-xs font-bold">Accepter</button>
          </div>
        </div>
      ))}
    </div>
  )
}

function PerfsModule() { 
  return (
    <div className="grid md:grid-cols-2 gap-3">
      <div className="border border-zinc-900 bg-zinc-950 p-5">
        <h3 className="text-sm font-bold text-white flex items-center gap-2"><Target className="h-4 w-4 text-amber-500" />Stats Andry T. - dernier combat</h3>
        <div className="mt-3 space-y-2 text-xs">
          <div className="flex justify-between"><span className="text-zinc-500">Sig. Strikes</span><span className="text-white font-bold">42 / 78 (53%)</span></div>
          <div className="flex justify-between"><span className="text-zinc-500">Takedowns</span><span className="text-white font-bold">3/5</span></div>
          <div className="flex justify-between"><span className="text-zinc-500">Contrôle</span><span className="text-white font-bold">4:12</span></div>
        </div>
      </div>
      <div className="border border-zinc-900 bg-zinc-950 p-5">
        <h3 className="text-sm font-bold text-white flex items-center gap-2"><Video className="h-4 w-4 text-zinc-500" />Vidéos à analyser</h3>
        <p className="text-xs text-zinc-500 mt-2">3 vidéos adversaires taguées • 2 sparrings à reviewer</p>
        <button className="mt-3 w-full h-8 border border-zinc-800 bg-zinc-900 text-xs text-zinc-300">Ouvrir studio vidéo</button>
      </div>
    </div>
  ) 
}

function MedicalModule() { 
  return (
    <div className="space-y-3">
      <div className="border border-red-500/20 bg-red-500/5 p-4 flex justify-between items-center">
        <div><p className="text-sm font-bold text-red-300">Andry T. • Certif expire dans 5j</p><p className="text-xs text-zinc-400">Bloque la pesée officielle MFN VI</p></div>
        <span className="px-2 py-1 bg-red-500/20 text-red-300 text-xs font-bold uppercase">Urgent</span>
      </div>
      <div className="grid md:grid-cols-3 gap-2">
        {["Rakoto - Poids 81.2kg • Hydra 61%", "Sitraka - OK • 78.1kg", "Andry - Alerte cut -2.6kg"].map((t) => (
          <div key={t} className="border border-zinc-900 bg-zinc-950 p-3 text-xs text-zinc-400">{t}</div>
        ))}
      </div>
    </div>
  ) 
}

function FinancesModule() { 
  return (
    <div className="grid md:grid-cols-3 gap-3">
      <div className="border border-zinc-900 bg-zinc-950 p-4"><p className="text-xs uppercase text-zinc-500">Commissions coaching (30j)</p><p className="text-xl font-black text-white mt-1">2 850 000 Ar</p></div>
      <div className="border border-zinc-900 bg-zinc-950 p-4"><p className="text-xs uppercase text-zinc-500">En attente orgas</p><p className="text-xl font-black text-amber-400 mt-1">1 200 000 Ar</p></div>
      <div className="border border-zinc-900 bg-zinc-950 p-4"><p className="text-xs uppercase text-zinc-500">Abonnements fighters</p><p className="text-sm font-bold text-white mt-1">6/8 à jour</p><p className="text-xs text-zinc-500">2 impayés</p></div>
    </div>
  ) 
}

function MessagesModule() { 
  const ctx = useContext(PopupContext); 
  return (
    <div className="space-y-2">
      {[{ n: "Rakoto", m: "Coach, poids ce matin 81.2kg", t: "07:12" }, { n: "Orga MFN", m: "Convocation pesée Andry - 14/08 16h", t: "Hier" }].map((msg) => (
        <div key={msg.n} className="flex justify-between items-center border border-zinc-900 bg-zinc-950 p-4">
          <div><p className="text-sm font-bold text-white">{msg.n}</p><p className="text-xs text-zinc-500">{msg.m}</p></div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">{msg.t}</span>
            <button onClick={() => ctx?.showPopup({ title: msg.n, message: msg.m, type: "info" })} className="h-6 w-6 border border-zinc-800 flex items-center justify-center text-zinc-500"><Eye className="h-3 w-3" /></button>
          </div>
        </div>
      ))}
    </div>
  ) 
}

export default function CoachDashboard() {
  const [active, setActive] = useState<CoachModule>("overview")
  const [search, setSearch] = useState("")
  const [popup, setPopup] = useState<PopupState>({ open: false, title: "", message: "", type: "info" })
  const showPopup = (o: Partial<PopupState> & { title: string; message: string }) => setPopup({ open: true, title: o.title || "Info", message: o.message, type: o.type || "info", confirmText: "Fermer" })
  const showConfirm = (o: Partial<PopupState> & { title: string; message: string; confirmText?: string; onConfirm?: (...a: unknown[]) => void; onCancel?: () => void }) => setPopup({ open: true, title: o.title || "Confirmation", message: o.message, type: o.type || "confirm", confirmText: o.confirmText || "Confirmer", cancelText: "Annuler", onConfirm: o.onConfirm, onCancel: o.onCancel })

  const menu = [
    { id: "overview" as CoachModule, label: "Vue d'ensemble", icon: <LayoutDashboard className="h-5 w-5" /> },
    { id: "roster" as CoachModule, label: "Mes Combattants", icon: <Users className="h-5 w-5" />, badge: "8" },
    { id: "trainings" as CoachModule, label: "Entraînements", icon: <Dumbbell className="h-5 w-5" /> },
    { id: "camps" as CoachModule, label: "Camps & Fight Prep", icon: <Flame className="h-5 w-5" />, badge: "2" },
    { id: "matchmaking" as CoachModule, label: "Matchmaking", icon: <Activity className="h-5 w-5" />, badge: "2" },
    { id: "perfs" as CoachModule, label: "Perfs & Vidéo", icon: <Activity className="h-5 w-5" /> },
    { id: "medical" as CoachModule, label: "Médical & Poids", icon: <Activity className="h-5 w-5" /> },
    { id: "finances" as CoachModule, label: "Finances", icon: <Wallet className="h-5 w-5" /> },
    { id: "messages" as CoachModule, label: "Messages", icon: <Activity className="h-5 w-5" />, badge: "3" },
  ]

  return (
    <PopupContext.Provider value={{ showPopup, showConfirm, showPrompt: showConfirm }}>
      <div className="flex min-h-screen bg-black text-zinc-100">
        <aside className="fixed inset-y-0 left-0 z-20 w-64 border-r border-zinc-900 bg-zinc-950 flex flex-col justify-between p-4">
          <div>
            <div className="flex items-center gap-3 px-2 py-3 border-b border-zinc-900">
              <div className="h-9 w-9 bg-amber-500 text-black font-black flex items-center justify-center">IM</div>
              <div><h1 className="text-sm font-black uppercase">INDESY MIALY</h1><span className="text-xs text-amber-500 font-bold uppercase tracking-widest">Espace Coach</span></div>
            </div>
            <div className="mt-4 flex items-center gap-3 border border-zinc-900 bg-zinc-900/30 p-3">
              <div className="h-10 w-10 bg-zinc-800 border border-zinc-700 flex items-center justify-center font-black">CK</div>
              <div><p className="text-xs font-bold">Coach Kolo</p><p className="text-xs text-zinc-500">Alpha MMA Mahajanga • 12 ans exp.</p></div>
            </div>
            <nav className="mt-6 space-y-1">
              {menu.map((it) => (
                <button 
                  key={it.id} 
                  onClick={() => setActive(it.id)} 
                  className={`flex w-full items-center justify-between px-4 py-2.5 text-xs font-medium border-l-2 ${active === it.id? "bg-amber-500/10 text-amber-400 border-amber-500" : "text-zinc-400 border-transparent hover:bg-zinc-900 hover:text-zinc-200"}`}
                >
                  <span className="flex items-center gap-3">{it.icon}{it.label}</span>
                  {(it as any).badge && <span className="h-4 min-w-4 px-1 bg-zinc-800 text-[10px] font-bold text-zinc-300 flex items-center justify-center">{(it as any).badge}</span>}
                </button>
              ))}
            </nav>
          </div>
          <div className="border border-zinc-900 bg-zinc-900/20 p-3">
            <div className="flex items-center gap-2 text-xs text-zinc-400"><Shield className="h-3.5 w-3.5 text-emerald-500" />Licence Coach Fédérale valide • 8 fighters assurés</div>
          </div>
        </aside>

        <div className="pl-64 flex flex-col flex-1">
          <header className="sticky top-0 z-10 h-16 border-b border-zinc-900 bg-black/80 backdrop-blur-md flex items-center justify-between px-8">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher combattant, combat, programme..." className="w-full bg-zinc-900/30 border border-zinc-800 py-2 pl-10 pr-3 text-xs outline-none focus:border-amber-500/30" />
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden md:flex items-center gap-2 text-xs text-zinc-400"><Flame className="h-3.5 w-3.5 text-amber-500" />2 fighters en camp • MFN VI</span>
              <div className="h-6 w-[1px] bg-zinc-800" />
              <button className="relative border border-zinc-800 bg-zinc-900/40 p-2 text-zinc-400">
                <Bell className="h-4 w-4" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-amber-500" />
              </button>
              <button onClick={() => showPopup({ title: "Nouveau programme", message: "Créer programme d'entraînement", type: "prompt" })} className="flex items-center gap-2 bg-amber-500 px-4 py-2 text-xs font-bold text-black"><Plus className="h-4 w-4" />Programme</button>
            </div>
          </header>

          <main className="flex-1 p-8 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div key={active} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
                {active === "overview" && <OverviewModule />}
                {active === "roster" && <RosterModule />}
                {active === "trainings" && <TrainingsModule />}
                {active === "camps" && <CampsModule />}
                {active === "matchmaking" && <MatchmakingModule />}
                {active === "perfs" && <PerfsModule />}
                {active === "medical" && <MedicalModule />}
                {active === "finances" && <FinancesModule />}
                {active === "messages" && <MessagesModule />}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
      <BrandPopup popup={popup} setPopup={setPopup} />
    </PopupContext.Provider>
  )
}