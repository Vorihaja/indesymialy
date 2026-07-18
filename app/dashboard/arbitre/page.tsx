"use client"

import React, { useState, useEffect, useRef, createContext, useContext } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard, ClipboardList, History, BookOpen, BadgeCheck, Calendar, Star, FileWarning, Wallet,
  Search, Bell, X, MapPin, Clock, AlertTriangle, Eye, Upload, Shield, Award, Scale, Gavel, 
  Timer, Zap, ShieldAlert, Check
} from "lucide-react"

type ArbitreModule = "overview" | "designations" | "historique" | "reglements" | "certifs" | "dispos" | "evaluations" | "rapports" | "finances" | "jugement"
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
      <div className="relative w-full max-w-sm bg-zinc-950 border border-zinc-800 shadow-xl overflow-hidden"><div className="h-1 w-full bg-amber-500" />
        <div className="p-3.5"><div className="flex justify-between"><div className="flex items-center gap-1.5"><div className="h-5 w-5 bg-amber-500 text-black font-black text-[10px] flex items-center justify-center">IM</div><span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Indesy Mialy • Arbitre</span></div><button onClick={cancel} className="text-zinc-600 hover:text-zinc-300"><X className="h-3 w-3" /></button></div>
          <h4 className="mt-3 text-[11.5px] font-bold uppercase text-white">{popup.title}</h4><p className="mt-1 text-[11px] leading-[1.5] text-zinc-400 whitespace-pre-wrap">{popup.message}</p>
          {popup.showInput && <input autoFocus value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && ok()} placeholder={popup.inputPlaceholder} className="mt-3 h-8 w-full bg-zinc-900 border border-zinc-800 px-2.5 text-[11px] text-white outline-none" />}
          <div className="mt-3.5 flex justify-end gap-1.5">{(popup.type === "confirm" || popup.showInput) && <button onClick={cancel} className="h-7 px-3 text-[10.5px] border border-zinc-800 text-zinc-400">{popup.cancelText || "Annuler"}</button>}<button onClick={ok} className="h-7 px-3 text-[10.5px] font-bold bg-amber-500 text-black">{popup.confirmText || "OK"}</button></div>
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
        <div className="border border-zinc-900 bg-zinc-950 p-4"><p className="text-[10px] uppercase font-bold text-zinc-500">Combats arbitrés</p><p className="mt-1 text-xl font-black text-white">147</p><p className="text-[10px] text-zinc-500">dont 12 en 2026</p></div>
        <div className="border border-zinc-900 bg-zinc-950 p-4"><p className="text-[10px] uppercase font-bold text-zinc-500">Désignations à venir</p><p className="mt-1 text-xl font-black text-amber-400">3</p><p className="text-[10px] text-zinc-500">prochains 30 jours</p></div>
        <div className="border border-zinc-900 bg-zinc-950 p-4"><p className="text-[10px] uppercase font-bold text-zinc-500">Note moyenne</p><p className="mt-1 text-xl font-black text-white flex items-center gap-1">4.8<Star className="h-4 w-4 text-amber-500 fill-amber-500" /></p><p className="text-[10px] text-emerald-400">Top 5% fédération</p></div>
        <div className="border border-zinc-900 bg-zinc-950 p-4"><p className="text-[10px] uppercase font-bold text-zinc-500">Licence</p><p className="mt-1 text-sm font-bold text-emerald-400">Fédérale A - Valide</p><p className="text-[10px] text-zinc-500">Expire 31/12/2026</p></div>
      </div>
      <div className="grid md:grid-cols-3 gap-3">
        <div className="md:col-span-2 border border-zinc-900 bg-zinc-950 p-5"><h3 className="text-sm font-bold text-white flex items-center gap-2"><Gavel className="h-4 w-4 text-amber-500" />Prochaine désignation</h3><div className="mt-3 border border-amber-500/20 bg-amber-500/5 p-4 flex justify-between items-center"><div><p className="text-sm font-bold text-white">MFN VI - Co-Main Event • Arbitre centre</p><p className="text-[11px] text-zinc-400 flex items-center gap-2"><Calendar className="h-3 w-3" />15 Août 20h30 • <MapPin className="h-3 w-3" />Gymnase Mahajanga • Andry T. vs Sitraka R. (-84kg)</p></div><button onClick={() => ctx?.showPopup({ title: "Convocation", message: "Convocation officielle téléchargée", type: "success" })} className="h-7 px-3 bg-amber-500 text-black text-[11px] font-bold">Voir convocation</button></div></div>
        <div className="border border-zinc-900 bg-zinc-950 p-5"><h3 className="text-sm font-bold text-white">Alerte conformité</h3><div className="mt-3 bg-red-500/10 border border-red-500/20 p-3"><p className="text-xs text-red-300 flex items-center gap-2"><AlertTriangle className="h-3.5 w-3.5" />Certificat médical arbitre à renouveler dans 14j</p></div><button onClick={() => ctx?.showPopup({ title: "Médical", message: "Upload requis", type: "warning" })} className="mt-3 w-full h-8 border border-zinc-800 text-[11px] text-zinc-300">Régulariser</button></div>
      </div>
    </div>
  )
}
function DesignationsModule() {
  const ctx = useContext(PopupContext)
  const fights = [{ id: "d1", event: "MFN VI", fight: "Andry T. vs Sitraka R.", role: "Arbitre centre", date: "15/08/2026 20:30", status: "Confirmée" }, { id: "d2", event: "Nosy Be Open", fight: "Finale -77kg", role: "Juge 1", date: "02/09/2026 16:00", status: "En attente" }]
  return <div className="space-y-3"><h3 className="text-sm font-bold text-white">Mes Désignations</h3>{fights.map((f) => (<div key={f.id} className="flex flex-col md:flex-row md:items-center justify-between gap-3 border border-zinc-900 bg-zinc-950 p-4"><div><p className="text-sm font-bold text-white">{f.event} • {f.fight}</p><p className="text-[11px] text-zinc-500 flex items-center gap-2"><Clock className="h-3 w-3" />{f.date} • {f.role}</p></div><div className="flex items-center gap-2"><span className={`px-2 py-0.5 text-[10px] font-bold uppercase ${f.status === "Confirmée"? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>{f.status}</span><button onClick={() => ctx?.showConfirm({ title: "Confirmer désignation?", message: `${f.event} - ${f.fight}`, confirmText: "Confirmer", onConfirm: () => ctx.showPopup({ title: "Confirmée", message: "Organisateur notifié", type: "success" }) })} className="h-7 px-3 bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300">Gérer</button></div></div>))}</div>
}
function HistoriqueModule() { return <div className="border border-zinc-900 bg-zinc-950 overflow-hidden"><table className="w-full text-left"><thead><tr className="bg-zinc-900/30 border-b border-zinc-900 text-[10px] uppercase font-bold text-zinc-500"><th className="p-3">Date</th><th className="p-3">Combat</th><th className="p-3">Rôle</th><th className="p-3">Décision</th><th className="p-3">Note</th></tr></thead><tbody className="divide-y divide-zinc-900 text-xs">{[{ d: "12/04/2026", c: "Rakoto vs Razafy", r: "Centre", dec: "TKO R2", n: "4.9" }, { d: "08/02/2026", c: "Guillaume B. vs Rova K.", r: "Juge", dec: "Décision partagée", n: "4.7" }].map((row) => (<tr key={row.d + row.c} className="hover:bg-zinc-900/20"><td className="p-3 text-zinc-400">{row.d}</td><td className="p-3 font-bold text-white">{row.c}</td><td className="p-3 text-zinc-400">{row.r}</td><td className="p-3 text-zinc-300">{row.dec}</td><td className="p-3 text-amber-400 font-bold">{row.n}</td></tr>))}</tbody></table></div> }
function ReglementsModule() { const ctx = useContext(PopupContext); return <div className="grid md:grid-cols-2 gap-3">{[{ t: "Règlement MMA FMMADA 2026", v: "v4.2 • PDF" }, { t: "Protocole gestion KO / commotion", v: "Obligatoire" }, { t: "Formation Arbitrage Vidéo", v: "Quiz 12/15 validé" }].map((doc) => (<div key={doc.t} className="border border-zinc-900 bg-zinc-950 p-4 flex justify-between items-center"><div><p className="text-sm font-bold text-white flex items-center gap-2"><BookOpen className="h-4 w-4 text-zinc-600" />{doc.t}</p><p className="text-[11px] text-zinc-500">{doc.v}</p></div><button onClick={() => ctx?.showPopup({ title: doc.t, message: "Ouverture du document", type: "info" })} className="h-7 w-7 border border-zinc-800 flex items-center justify-center text-zinc-500"><Eye className="h-3 w-3" /></button></div>))}</div> }
function CertifsModule() { return <div className="grid md:grid-cols-2 gap-3"><div className="border border-zinc-900 bg-zinc-950 p-5"><p className="text-[10px] uppercase font-bold text-zinc-500">Grade Fédéral</p><p className="mt-1 text-lg font-black text-white">Arbitre National A</p><p className="mt-2 text-[11px] text-zinc-500 flex items-center gap-2"><BadgeCheck className="h-3.5 w-3.5 text-emerald-500" />Certifié depuis 2022 • FMMADA</p></div><div className="border border-zinc-900 bg-zinc-950 p-5"><p className="text-[10px] uppercase font-bold text-zinc-500">Licence</p><p className="mt-1 text-sm font-bold text-emerald-400">N° ARB-2026-0842 • Valide</p><div className="mt-3 h-1.5 w-full bg-zinc-900"><div className="h-full bg-emerald-500" style={{ width: "82%" }} /></div><p className="mt-1 text-[11px] text-zinc-500">Expire dans 142 jours</p></div></div> }
function DisposModule() { const ctx = useContext(PopupContext); const days = ["Lun 11","Mar 12","Mer 13","Jeu 14","Ven 15","Sam 16","Dim 17"]; return <div className="border border-zinc-900 bg-zinc-950 p-5"><h3 className="text-sm font-bold text-white flex items-center gap-2"><Calendar className="h-4 w-4 text-amber-500" />Disponibilités Août</h3><div className="mt-4 grid grid-cols-7 gap-2">{days.map((d) => (<button key={d} onClick={() => ctx?.showPopup({ title: d, message: "Basculer dispo / indispo", type: "info" })} className="h-14 border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900 text-[11px] font-bold text-zinc-400 hover:text-white">{d}<span className="block mt-1 h-1 w-1 bg-emerald-500 mx-auto" /></button>))}</div></div> }
function EvaluationsModule() { return <div className="space-y-3">{[{ by: "Superviseur Fédéral", note: "4.9/5", com: "Excellent placement, gestion du KO très pro" }, { by: "Org. MFN V", note: "4.7/5", com: "Très bon briefing combattants" }].map((ev) => (<div key={ev.by} className="border border-zinc-900 bg-zinc-950 p-4"><div className="flex justify-between"><p className="text-sm font-bold text-white">{ev.by}</p><span className="text-amber-400 font-bold text-sm">{ev.note}</span></div><p className="text-[11px] text-zinc-500 mt-1">"{ev.com}"</p></div>))}</div> }
function RapportsModule() { const ctx = useContext(PopupContext); return <div className="space-y-3"><button onClick={() => ctx?.showPopup({ title: "Nouveau rapport", message: "Formulaire incident / disqualification", type: "prompt" })} className="w-full h-10 border border-dashed border-zinc-700 bg-zinc-900/20 text-xs text-zinc-400 flex items-center justify-center gap-2"><Upload className="h-4 w-4" />Rédiger rapport d'arbitrage / incident</button><div className="border border-zinc-900 bg-zinc-950 p-4 flex justify-between items-center"><div><p className="text-sm font-bold text-white">Rapport #RPT-2026-042 • MFN V</p><p className="text-[11px] text-zinc-500">Carton jaune • Coup bas R2 • Validé</p></div><span className="px-2 py-0.5 bg-zinc-800 text-[11px] text-zinc-400">Clôturé</span></div></div> }
function FinancesModule() { return <div className="grid md:grid-cols-3 gap-3"><div className="border border-zinc-900 bg-zinc-950 p-4"><p className="text-[10px] uppercase text-zinc-500">Indemnités 30j</p><p className="text-xl font-black text-white mt-1">950 000 Ar</p></div><div className="border border-zinc-900 bg-zinc-950 p-4"><p className="text-[10px] uppercase text-zinc-500">En attente</p><p className="text-xl font-black text-amber-400 mt-1">250 000 Ar</p></div><div className="border border-zinc-900 bg-zinc-950 p-4"><p className="text-[10px] uppercase text-zinc-500">Km défrayés</p><p className="text-sm font-bold text-white mt-1">420 km • 84 000 Ar</p></div></div> }

// ============================================================================
// OUTIL DE JUGEMENT LIVE ULTRA COMPLET (TOUTES DISCIPLINES)
// ============================================================================
type DisciplineType = "MMA" | "JUDO" | "KICKBOXING" | "GRAPPLING"

function JugementModule() {
  const ctx = useContext(PopupContext)
  const [discipline, setDiscipline] = useState<DisciplineType>("MMA")
  const [round, setRound] = useState(1)
  const [timer, setTimer] = useState(300) // 5 minutes
  const [isRunning, setIsRunning] = useState(false)

  // Scores Communs / Striking
  const [blueScore, setBlueScore] = useState({ points: 10, hits: 0, takedowns: 0, ipon: 0, waza: 0, penalties: 0 })
  const [redScore, setRedScore] = useState({ points: 9, hits: 0, takedowns: 0, ipon: 0, waza: 0, penalties: 0 })

  // Logique du Chronomètre
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined
    if (isRunning && timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, timer])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const resetScoresForDiscipline = (disc: DisciplineType) => {
    setDiscipline(disc)
    setRound(1)
    setIsRunning(false)
    if (disc === "JUDO") {
      setTimer(240) // 4 min Judo
      setBlueScore({ points: 0, hits: 0, takedowns: 0, ipon: 0, waza: 0, penalties: 0 })
      setRedScore({ points: 0, hits: 0, takedowns: 0, ipon: 0, waza: 0, penalties: 0 })
    } else {
      setTimer(300) // 5 min MMA/Kick
      setBlueScore({ points: 10, hits: 0, takedowns: 0, ipon: 0, waza: 0, penalties: 0 })
      setRedScore({ points: 9, hits: 0, takedowns: 0, ipon: 0, waza: 0, penalties: 0 })
    }
  }

  const soumettreDecision = () => {
    ctx?.showPopup({
      title: "Soumission de la carte de score",
      message: `Feuille de match enregistrée avec succès pour la discipline [${discipline}].\nDonnées cryptées envoyées à la table centrale de la fédération.`,
      type: "success"
    })
  }

  return (
    <div className="space-y-4">
      {/* Configuration d'Entête du Match */}
      <div className="flex flex-col lg:flex-row gap-3 justify-between items-start lg:items-center bg-zinc-950 border border-zinc-900 p-4">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-amber-500 flex items-center gap-2">
            <Scale className="h-4 w-4" /> Console de Jugement d'Officiel
          </h2>
          <p className="text-[11px] text-zinc-500 mt-0.5">Saisie synchronisée en temps réel • ID Combat: #CBT-2026-9942</p>
        </div>
        
        {/* Sélecteur de Discipline Dynamique */}
        <div className="flex gap-1 bg-zinc-900/50 p-1 border border-zinc-850">
          {(["MMA", "JUDO", "KICKBOXING", "GRAPPLING"] as DisciplineType[]).map((disc) => (
            <button
              key={disc}
              onClick={() => resetScoresForDiscipline(disc)}
              className={`h-7 px-3 text-[10px] font-bold uppercase transition ${
                discipline === disc ? "bg-amber-500 text-black font-black" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {disc}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Principal du Live */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Colonne Gauche & Centre : Les Combattants et Actions */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Module Chronomètre Centralisé */}
          <div className="bg-zinc-950 border border-zinc-900 p-4 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-2 left-3 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-500">Flux Live Synchronisé</span>
            </div>
            
            <div className="text-4xl font-mono font-black text-white tracking-widest my-1 flex items-center gap-3">
              <Timer className="h-6 w-6 text-amber-500" />
              {formatTime(timer)}
            </div>

            <div className="flex gap-2 mt-2">
              <button 
                onClick={() => setIsRunning(!isRunning)} 
                className={`h-7 px-4 text-[10px] font-bold uppercase ${isRunning ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-200 border border-zinc-700'}`}
              >
                {isRunning ? "Pause" : "Démarrer"}
              </button>
              <button 
                onClick={() => { setIsRunning(false); resetScoresForDiscipline(discipline) }} 
                className="h-7 px-3 bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 font-bold uppercase hover:text-white"
              >
                Reset
              </button>
            </div>

            {discipline !== "JUDO" && (
              <div className="flex items-center gap-1 mt-4 border-t border-zinc-900/60 pt-3 w-full justify-center">
                {[1, 2, 3, 4, 5].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRound(r)}
                    className={`h-6 w-12 font-bold text-[10px] rounded-none border transition-all ${
                      round === r ? "bg-amber-500 text-black border-amber-500" : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    R{r}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Zone Interactive des Coins */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* COIN BLEU */}
            <div className="bg-zinc-950 border-2 border-blue-900/50 p-4 relative">
              <div className="absolute top-0 right-0 bg-blue-600 text-white px-2 py-0.5 text-[8.5px] font-black uppercase tracking-wider">
                Coin Bleu
              </div>
              <h3 className="text-xs font-black uppercase text-white tracking-wide">R. ANDRIAMAHENINA</h3>
              <p className="text-[10px] text-zinc-500 uppercase font-bold">Madagascar • 77.1 KG</p>

              {/* Système de points principal selon discipline */}
              <div className="mt-4 bg-zinc-900/40 border border-zinc-900 p-3 flex items-center justify-between">
                <div>
                  <p className="text-[9px] uppercase font-bold text-zinc-400">Score de la reprise</p>
                  <p className="text-3xl font-black text-blue-400 mt-0.5">{blueScore.points}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <button onClick={() => setBlueScore(s => ({ ...s, points: s.points + 1 }))} className="h-6 w-8 bg-zinc-800 text-white font-bold text-xs hover:bg-zinc-700">+</button>
                  <button onClick={() => setBlueScore(s => ({ ...s, points: Math.max(0, s.points - 1) }))} className="h-6 w-8 bg-zinc-800 text-white font-bold text-xs hover:bg-zinc-700">-</button>
                </div>
              </div>

              {/* Frappes / Actions spécifiques */}
              <div className="mt-4 space-y-2">
                {discipline !== "JUDO" ? (
                  <>
                    <div className="flex justify-between items-center bg-zinc-900/20 p-2 border border-zinc-900">
                      <span className="text-[11px] text-zinc-400 font-medium">Frappes Significatives</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-white">{blueScore.hits}</span>
                        <button onClick={() => setBlueScore(s => ({ ...s, hits: s.hits + 1 }))} className="h-6 px-2 bg-zinc-800 text-[10px] font-bold text-zinc-300">+</button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center bg-zinc-900/20 p-2 border border-zinc-900">
                      <span className="text-[11px] text-zinc-400 font-medium">Amenées au sol (TD)</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-white">{blueScore.takedowns}</span>
                        <button onClick={() => setBlueScore(s => ({ ...s, takedowns: s.takedowns + 1 }))} className="h-6 px-2 bg-zinc-800 text-[10px] font-bold text-zinc-300">+</button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-center bg-zinc-900/20 p-2 border border-zinc-900">
                      <span className="text-[11px] font-bold text-amber-500">IPPON</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-white">{blueScore.ipon}</span>
                        <button onClick={() => setBlueScore(s => ({ ...s, ipon: Math.min(1, s.ipon + 1) }))} className="h-6 px-2 bg-amber-500 text-black text-[10px] font-black">IPPON</button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center bg-zinc-900/20 p-2 border border-zinc-900">
                      <span className="text-[11px] text-zinc-300 font-medium">WAZA-ARI</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-white">{blueScore.waza}</span>
                        <button onClick={() => setBlueScore(s => ({ ...s, waza: s.waza + 1 }))} className="h-6 px-2 bg-zinc-800 text-[10px] font-bold text-zinc-300">+</button>
                      </div>
                    </div>
                  </>
                )}

                {/* Pénalités unifiées (Shido / Faute) */}
                <div className="flex justify-between items-center border border-red-950/40 bg-red-950/5 p-2">
                  <span className="text-[11px] text-red-400 font-bold flex items-center gap-1">
                    <ShieldAlert className="h-3.5 w-3.5" /> Pénalités / Shido
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-red-400">{blueScore.penalties}</span>
                    <button onClick={() => setBlueScore(s => ({ ...s, penalties: s.penalties + 1 }))} className="h-6 px-2 bg-red-950/40 border border-red-900 text-[10px] font-black text-red-400 hover:bg-red-900/40">+</button>
                  </div>
                </div>
              </div>
            </div>

            {/* COIN ROUGE */}
            <div className="bg-zinc-950 border-2 border-red-900/50 p-4 relative">
              <div className="absolute top-0 right-0 bg-red-600 text-white px-2 py-0.5 text-[8.5px] font-black uppercase tracking-wider">
                Coin Rouge
              </div>
              <h3 className="text-xs font-black uppercase text-white tracking-wide">F. RAZAFINDRAKOTO</h3>
              <p className="text-[10px] text-zinc-500 uppercase font-bold">Madagascar • 76.9 KG</p>

              {/* Système de points principal selon discipline */}
              <div className="mt-4 bg-zinc-900/40 border border-zinc-900 p-3 flex items-center justify-between">
                <div>
                  <p className="text-[9px] uppercase font-bold text-zinc-400">Score de la reprise</p>
                  <p className="text-3xl font-black text-red-400 mt-0.5">{redScore.points}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <button onClick={() => setRedScore(s => ({ ...s, points: s.points + 1 }))} className="h-6 w-8 bg-zinc-800 text-white font-bold text-xs hover:bg-zinc-700">+</button>
                  <button onClick={() => setRedScore(s => ({ ...s, points: Math.max(0, s.points - 1) }))} className="h-6 w-8 bg-zinc-800 text-white font-bold text-xs hover:bg-zinc-700">-</button>
                </div>
              </div>

              {/* Frappes / Actions spécifiques */}
              <div className="mt-4 space-y-2">
                {discipline !== "JUDO" ? (
                  <>
                    <div className="flex justify-between items-center bg-zinc-900/20 p-2 border border-zinc-900">
                      <span className="text-[11px] text-zinc-400 font-medium">Frappes Significatives</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-white">{redScore.hits}</span>
                        <button onClick={() => setRedScore(s => ({ ...s, hits: s.hits + 1 }))} className="h-6 px-2 bg-zinc-800 text-[10px] font-bold text-zinc-300">+</button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center bg-zinc-900/20 p-2 border border-zinc-900">
                      <span className="text-[11px] text-zinc-400 font-medium">Amenées au sol (TD)</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-white">{redScore.takedowns}</span>
                        <button onClick={() => setRedScore(s => ({ ...s, takedowns: s.takedowns + 1 }))} className="h-6 px-2 bg-zinc-800 text-[10px] font-bold text-zinc-300">+</button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-center bg-zinc-900/20 p-2 border border-zinc-900">
                      <span className="text-[11px] font-bold text-amber-500">IPPON</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-white">{redScore.ipon}</span>
                        <button onClick={() => setRedScore(s => ({ ...s, ipon: Math.min(1, s.ipon + 1) }))} className="h-6 px-2 bg-amber-500 text-black text-[10px] font-black">IPPON</button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center bg-zinc-900/20 p-2 border border-zinc-900">
                      <span className="text-[11px] text-zinc-300 font-medium">WAZA-ARI</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-white">{redScore.waza}</span>
                        <button onClick={() => setRedScore(s => ({ ...s, waza: s.waza + 1 }))} className="h-6 px-2 bg-zinc-800 text-[10px] font-bold text-zinc-300">+</button>
                      </div>
                    </div>
                  </>
                )}

                {/* Pénalités unifiées (Shido / Faute) */}
                <div className="flex justify-between items-center border border-red-950/40 bg-red-950/5 p-2">
                  <span className="text-[11px] text-red-400 font-bold flex items-center gap-1">
                    <ShieldAlert className="h-3.5 w-3.5" /> Pénalités / Shido
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-red-400">{redScore.penalties}</span>
                    <button onClick={() => setRedScore(s => ({ ...s, penalties: s.penalties + 1 }))} className="h-6 px-2 bg-red-950/40 border border-red-900 text-[10px] font-black text-red-400 hover:bg-red-900/40">+</button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Colonne Droite : Critères d'Évaluation & Clôture */}
        <div className="space-y-4">
          <div className="bg-zinc-950 border border-zinc-900 p-4 flex flex-col justify-between h-full">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
                <Gavel className="h-3.5 w-3.5 text-amber-500" /> Critères de Jugement Officiels
              </h3>
              
              <div className="space-y-2.5 text-[11px] border-b border-zinc-900 pb-4">
                <p className="text-zinc-400 leading-normal">
                  Selon la charte fédérale <span className="text-amber-500 font-bold">Indesy Mialy v2026</span>, la notation doit respecter l'ordre d'importance strict suivant :
                </p>
                <div className="bg-zinc-900/40 p-2.5 border border-zinc-900 space-y-1.5 font-medium text-zinc-300">
                  <p className="flex items-center gap-2"><Zap className="h-3 w-3 text-amber-500 shrink-0" /> 1. Efficacité de l'impact / Dommages</p>
                  <p className="flex items-center gap-2"><Scale className="h-3 w-3 text-amber-500 shrink-0" /> 2. Combativité & Agressivité effective</p>
                  <p className="flex items-center gap-2"><MapPin className="h-3 w-3 text-amber-500 shrink-0" /> 3. Contrôle de la zone de combat</p>
                </div>
              </div>

              {/* Raccourcis d'Arrêts Instantanés */}
              <div className="mt-4 space-y-2">
                <h4 className="text-[10px] uppercase font-black text-zinc-500 tracking-wider">Fin de Match Prématurée</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => ctx?.showPopup({ title: "KO / Soumission", message: "Victoire enregistrée par arrêt de l'arbitre central.", type: "success" })} className="h-8 border border-zinc-800 bg-zinc-900 text-[10px] text-white font-bold uppercase hover:bg-zinc-850">
                    KO / TKO / SUB
                  </button>
                  <button onClick={() => ctx?.showPopup({ title: "Disqualification", message: "En attente du rapport d'incident formel de l'arbitre.", type: "warning" })} className="h-8 border border-red-900/50 bg-red-950/10 text-[10px] text-red-400 font-bold uppercase hover:bg-red-950/20">
                    Disqualification
                  </button>
                </div>
              </div>
            </div>

            {/* Validation Finale */}
            <div className="mt-6 pt-4 border-t border-zinc-900">
              <button 
                onClick={soumettreDecision}
                className="w-full h-10 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <Check className="h-4 w-4 stroke-[3px]" /> Transmettre la carte
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

// ============================================================================
// COMPOSANT PRINCIPAL : DASHBOARD
// ============================================================================
export default function ArbitreDashboard() {
  const [active, setActive] = useState<ArbitreModule>("overview")
  const [search, setSearch] = useState("")
  const [popup, setPopup] = useState<PopupState>({ open: false, title: "", message: "", type: "info" })
  const showPopup = (o: Partial<PopupState> & { title: string; message: string }) => setPopup({ open: true, title: o.title || "Info", message: o.message, type: o.type || "info", confirmText: "Fermer" })
  const showConfirm = (o: Partial<PopupState> & { title: string; message: string; confirmText?: string; cancelText?: string; onConfirm?: (...a: unknown[]) => void; onCancel?: () => void }) => setPopup({ open: true, title: o.title || "Confirmation", message: o.message, type: o.type || "confirm", confirmText: o.confirmText || "Confirmer", cancelText: o.cancelText || "Annuler", onConfirm: o.onConfirm, onCancel: o.onCancel })

  const menu = [
    { id: "overview" as ArbitreModule, label: "Vue d'ensemble", icon: <LayoutDashboard className="h-5 w-5" /> },
    { id: "jugement" as ArbitreModule, label: "Jugement Live", icon: <Scale className="h-5 w-5" />, badge: "LIVE" },
    { id: "designations" as ArbitreModule, label: "Désignations", icon: <ClipboardList className="h-5 w-5" />, badge: "3" },
    { id: "historique" as ArbitreModule, label: "Historique combats", icon: <History className="h-5 w-5" /> },
    { id: "reglements" as ArbitreModule, label: "Règlements & Formations", icon: <BookOpen className="h-5 w-5" /> },
    { id: "certifs" as ArbitreModule, label: "Licence & Grade", icon: <BadgeCheck className="h-5 w-5" /> },
    { id: "dispos" as ArbitreModule, label: "Disponibilités", icon: <Calendar className="h-5 w-5" /> },
    { id: "evaluations" as ArbitreModule, label: "Évaluations", icon: <Star className="h-5 w-5" /> },
    { id: "rapports" as ArbitreModule, label: "Rapports & Incidents", icon: <FileWarning className="h-5 w-5" /> },
    { id: "finances" as ArbitreModule, label: "Indemnités", icon: <Wallet className="h-5 w-5" /> },
  ]

  return (
    <PopupContext.Provider value={{ showPopup, showConfirm, showPrompt: showConfirm }}>
      <div className="flex min-h-screen bg-black text-zinc-100">
        <aside className="fixed inset-y-0 left-0 z-20 w-64 border-r border-zinc-900 bg-zinc-950 flex flex-col justify-between p-4">
          <div>
            <div className="flex items-center gap-3 px-2 py-3 border-b border-zinc-900"><div className="h-9 w-9 bg-amber-500 text-black font-black flex items-center justify-center">IM</div><div><h1 className="text-sm font-black uppercase">INDESY MIALY</h1><span className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">Espace Arbitre</span></div></div>
            <div className="mt-4 flex items-center gap-3 border border-zinc-900 bg-zinc-900/30 p-3"><div className="h-10 w-10 bg-zinc-800 border border-zinc-700 flex items-center justify-center font-black">AR</div><div><p className="text-xs font-bold">M. Rakotondrabe</p><p className="text-[10px] text-zinc-500">Arbitre National A • 147 combats</p></div></div>
            <nav className="mt-6 space-y-1">{menu.map((it) => (<button key={it.id} onClick={() => setActive(it.id)} className={`flex w-full items-center justify-between px-4 py-2.5 text-[11.5px] font-medium border-l-2 ${active === it.id? "bg-amber-500/10 text-amber-400 border-amber-500" : "text-zinc-400 border-transparent hover:bg-zinc-900 hover:text-zinc-200"}`}><span className="flex items-center gap-3">{it.icon}{it.label}</span>{(it as any).badge && <span className={`h-4 min-w-4 px-1 text-[9px] font-black flex items-center justify-center ${it.id === "jugement" ? "bg-red-600 text-white animate-pulse px-1.5" : "bg-amber-500 text-black"}`}>{(it as any).badge}</span>}</button>))}</nav>
          </div>
          <div className="border border-zinc-900 bg-zinc-900/20 p-3"><div className="flex items-center gap-2 text-[10px] text-zinc-400"><Shield className="h-3.5 w-3.5 text-emerald-500" />Officiel FMMADA • Impartialité & sécurité</div></div>
        </aside>

        <div className="pl-64 flex flex-col flex-1">
          <header className="sticky top-0 z-10 h-16 border-b border-zinc-900 bg-black/80 backdrop-blur-md flex items-center justify-between px-8">
            <div className="relative w-80"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher combat, event, règle..." className="w-full bg-zinc-900/30 border border-zinc-800 py-2 pl-10 pr-3 text-xs outline-none focus:border-amber-500/30" /></div>
            <div className="flex items-center gap-3"><span className="hidden md:flex items-center gap-2 text-[11px] text-zinc-400"><Award className="h-3.5 w-3.5 text-amber-500" />Grade A • Éligible Main Event</span><div className="h-6 w-[1px] bg-zinc-800" /><button className="relative border border-zinc-800 bg-zinc-900/40 p-2 text-zinc-400"><Bell className="h-4 w-4" /><span className="absolute top-1 right-1 h-2 w-2 bg-amber-500" /></button></div>
          </header>

          <main className="flex-1 p-8 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div key={active} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
                {active === "overview" && <OverviewModule />}
                {active === "jugement" && <JugementModule />}
                {active === "designations" && <DesignationsModule />}
                {active === "historique" && <HistoriqueModule />}
                {active === "reglements" && <ReglementsModule />}
                {active === "certifs" && <CertifsModule />}
                {active === "dispos" && <DisposModule />}
                {active === "evaluations" && <EvaluationsModule />}
                {active === "rapports" && <RapportsModule />}
                {active === "finances" && <FinancesModule />}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
      <BrandPopup popup={popup} setPopup={setPopup} />
    </PopupContext.Provider>
  )
}