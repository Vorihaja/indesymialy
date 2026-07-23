"use client"

import React, { useState, useEffect, useRef, createContext, useContext } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard, ClipboardList, History, BookOpen, BadgeCheck, Calendar, Star, FileWarning, Wallet,
  Search, Bell, X, MapPin, Clock, AlertTriangle, Eye, Upload, Shield, Award, Scale, Gavel, 
  Timer, Zap, ShieldAlert, Check, Activity, BarChart3, FileText, Users, HeartPulse, GraduationCap,
  MessageSquare, Package, Video, FileCheck, Stethoscope, Plane, CreditCard, Target, TrendingUp,
  FileSpreadsheet, Download, Filter, MoreVertical, ExternalLink, Info, CheckCircle2, XCircle,
  AlertCircle, UserCheck, TimerReset, Flag, Shirt, Briefcase, BookMarked, LifeBuoy,
  Settings, Database, PieChart, Trophy, Siren
} from "lucide-react"

type ArbitreModule = "overview" | "designations" | "historique" | "reglements" | "certifs" | "dispos" | "evaluations" | "rapports" | "finances" | "jugement" | "materiel" | "medical" | "formation" | "communication" | "stats"
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

// ===================== OVERVIEW ULTRA COMPLET =====================
function OverviewModule() {
  const ctx = useContext(PopupContext)
  return (
    <div className="space-y-5">
      {/* KPIs ORIGINAUX CONSERVÉS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="border border-zinc-900 bg-zinc-950 p-4"><p className="text-[10px] uppercase font-bold text-zinc-500">Combats arbitrés</p><p className="mt-1 text-xl font-black text-white">147</p><p className="text-[10px] text-zinc-500">dont 12 en 2026 • 89 en Centre</p><div className="mt-2 h-1 w-full bg-zinc-900"><div className="h-full bg-white" style={{width:"72%"}} /></div></div>
        <div className="border border-zinc-900 bg-zinc-950 p-4"><p className="text-[10px] uppercase font-bold text-zinc-500">Désignations à venir</p><p className="mt-1 text-xl font-black text-amber-400">3</p><p className="text-[10px] text-zinc-500">prochains 30 jours • 1 Main Event</p><div className="mt-2 flex gap-1"><span className="h-1 w-3 bg-amber-500"/><span className="h-1 w-3 bg-zinc-700"/><span className="h-1 w-3 bg-zinc-700"/></div></div>
        <div className="border border-zinc-900 bg-zinc-950 p-4"><p className="text-[10px] uppercase font-bold text-zinc-500">Note moyenne</p><p className="mt-1 text-xl font-black text-white flex items-center gap-1">4.8<Star className="h-4 w-4 text-amber-500 fill-amber-500" /></p><p className="text-[10px] text-emerald-400">Top 5% fédération • +0.2 vs 2025</p></div>
        <div className="border border-zinc-900 bg-zinc-950 p-4"><p className="text-[10px] uppercase font-bold text-zinc-500">Licence</p><p className="mt-1 text-sm font-bold text-emerald-400">Fédérale A - Valide</p><p className="text-[10px] text-zinc-500">Expire 31/12/2026 • N° ARB-2026-0842</p><p className="mt-2 text-[9px] text-amber-500 flex items-center gap-1"><Shield className="h-3 w-3"/> Eligible International</p></div>
      </div>

      {/* NOUVEAU : KPIs SECONDAIRES */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          {k:"Ponctualité", v:"100%", sub:"0 retard / 12 events", col:"text-emerald-400"},
          {k:"Taux contestation", v:"1.3%", sub:"2/147 combats", col:"text-white"},
          {k:"Interventions méd.", v:"7", sub:"dont 2 KO sévères", col:"text-amber-400"},
          {k:"KM parcourus 2026", v:"1 840 km", sub:"Défrayés intégralement", col:"text-zinc-300"},
          {k:"Briefings", v:"12/12", sub:"Conformité 100%", col:"text-emerald-400"},
          {k:"Disponibilité", v:"89%", sub:"Août complet", col:"text-white"},
        ].map(i=>(
          <div key={i.k} className="border border-zinc-900 bg-zinc-950/60 p-3"><p className="text-[9px] uppercase font-bold text-zinc-500">{i.k}</p><p className={`mt-1 text-sm font-black ${i.col}`}>{i.v}</p><p className="text-[9px] text-zinc-600">{i.sub}</p></div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <div className="md:col-span-2 border border-zinc-900 bg-zinc-950 p-5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2"><Gavel className="h-4 w-4 text-amber-500" />Prochaine désignation • Détail complet</h3>
          <div className="mt-3 border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div><p className="text-sm font-bold text-white">MFN VI - Co-Main Event • Arbitre centre</p><p className="text-[11px] text-zinc-400 flex items-center gap-2"><Calendar className="h-3 w-3" />15 Août 20h30 • <MapPin className="h-3 w-3" />Gymnase Mahajanga • Andry T. vs Sitraka R. (-84kg)</p></div>
              <button onClick={() => ctx?.showPopup({ title: "Convocation", message: "Convocation officielle téléchargée\n• Heure pesée: 14h00\n• Briefing arbitres: 18h30\n• Tenue: Polo noir IM + pantalon noir", type: "success" })} className="h-7 px-3 bg-amber-500 text-black text-[11px] font-bold">Voir convocation</button>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[10px]">
              <div className="bg-black/40 border border-zinc-800 p-2"><p className="text-zinc-500 uppercase font-bold">Indemnité</p><p className="text-white font-bold">350 000 Ar + KM</p></div>
              <div className="bg-black/40 border border-zinc-800 p-2"><p className="text-zinc-500 uppercase font-bold">Contact Orga</p><p className="text-white font-bold">Hery R. - 034 12 345 67</p></div>
              <div className="bg-black/40 border border-zinc-800 p-2"><p className="text-zinc-500 uppercase font-bold">Superviseur</p><p className="text-white font-bold">M. Andriamasy A</p></div>
            </div>
            <div className="flex gap-2 text-[10px]"><span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">✓ Certif médical OK</span><span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">✓ Licence validée</span><span className="px-2 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20">! Rapport pesée à faire</span></div>
          </div>
          {/* Timeline saison */}
          <div className="mt-4 border-t border-zinc-900 pt-4">
            <h4 className="text-[11px] font-bold uppercase text-zinc-400 flex items-center gap-2"><Activity className="h-3.5 w-3.5"/>Saison 2026 - Progression</h4>
            <div className="mt-3 flex items-center gap-2"><div className="flex-1 h-1.5 bg-zinc-900 flex"><div className="h-full bg-amber-500" style={{width:"68%"}}/><div className="h-full bg-zinc-700" style={{width:"32%"}}/></div><span className="text-[10px] text-zinc-500">17/25 events prévus</span></div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="border border-zinc-900 bg-zinc-950 p-5"><h3 className="text-sm font-bold text-white">Alerte conformité</h3><div className="mt-3 bg-red-500/10 border border-red-500/20 p-3"><p className="text-xs text-red-300 flex items-center gap-2"><AlertTriangle className="h-3.5 w-3.5" />Certificat médical arbitre à renouveler dans 14j</p><p className="text-[10px] text-red-300/70 mt-1">Visite chez Dr RAKOTO - CHU Ankatso • Dossier: FMMADA-MED-2025</p></div><button onClick={() => ctx?.showPopup({ title: "Médical", message: "Upload requis • PDF + Cachet médecin fédéral", type: "warning" })} className="mt-3 w-full h-8 border border-zinc-800 text-[11px] text-zinc-300">Régulariser</button></div>
          <div className="border border-zinc-900 bg-zinc-950 p-4"><h4 className="text-[11px] font-bold uppercase text-zinc-400 flex items-center gap-2"><Target className="h-3.5 w-3.5 text-amber-500"/>Objectifs Grade</h4><div className="mt-3 space-y-2 text-[11px]"><div className="flex justify-between"><span className="text-zinc-500">International C</span><span className="text-amber-400 font-bold">82%</span></div><div className="h-1.5 w-full bg-zinc-900"><div className="h-full bg-amber-500" style={{width:"82%"}}/></div><p className="text-[10px] text-zinc-600">Manque: 3 events internationaux + formation VAR</p></div></div>
          <div className="border border-zinc-900 bg-zinc-950 p-4"><h4 className="text-[11px] font-bold uppercase text-zinc-500">Actions rapides</h4><div className="mt-2 grid grid-cols-2 gap-2"><button className="h-8 bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300">Rapport incident</button><button className="h-8 bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300">Dispos Août</button><button className="h-8 bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300">Attestation</button><button className="h-8 bg-amber-500 text-black font-bold text-[10px]">Jugement LIVE</button></div></div>
        </div>
      </div>

      {/* NOUVEAU : ANALYTIQUE */}
      <div className="grid md:grid-cols-3 gap-3">
        <div className="border border-zinc-900 bg-zinc-950 p-5"><h4 className="text-xs font-bold text-white flex items-center gap-2"><PieChart className="h-4 w-4 text-zinc-500"/>Répartition par rôle</h4><div className="mt-3 space-y-2 text-[11px]"><div className="flex justify-between"><span className="text-zinc-400">Arbitre centre</span><span className="text-white font-bold">89 (60%)</span></div><div className="flex justify-between"><span className="text-zinc-400">Juge</span><span className="text-white font-bold">52 (35%)</span></div><div className="flex justify-between"><span className="text-zinc-400">Superviseur</span><span className="text-white font-bold">6 (5%)</span></div></div></div>
        <div className="border border-zinc-900 bg-zinc-950 p-5"><h4 className="text-xs font-bold text-white flex items-center gap-2"><Trophy className="h-4 w-4 text-amber-500"/>Par discipline</h4><div className="mt-3 space-y-2 text-[11px]"><div className="flex justify-between"><span className="text-zinc-400">MMA</span><span className="text-white font-bold">112</span></div><div className="flex justify-between"><span className="text-zinc-400">Kickboxing</span><span className="text-white font-bold">21</span></div><div className="flex justify-between"><span className="text-zinc-400">Judo / Grappling</span><span className="text-white font-bold">14</span></div></div></div>
        <div className="border border-zinc-900 bg-zinc-950 p-5"><h4 className="text-xs font-bold text-white flex items-center gap-2"><HeartPulse className="h-4 w-4 text-red-500"/>Sécurité</h4><div className="mt-3 space-y-1.5 text-[11px] text-zinc-400"><p>• 0 incident grave sous ta direction</p><p>• Temps moyen intervention médicale: 8s</p><p>• 100% protocoles commotion respectés</p><p className="text-emerald-400 font-bold mt-2">→ Référent sécurité FMMADA</p></div></div>
      </div>
    </div>
  )
}

function DesignationsModule() {
  const ctx = useContext(PopupContext)
  const fights = [
    { id: "d1", event: "MFN VI", fight: "Andry T. vs Sitraka R.", role: "Arbitre centre", date: "15/08/2026 20:30", status: "Confirmée", lieu:"Gymnase Mahajanga", cat:"-84kg", indemnite:"350k Ar", orga:"Hery R.", superviseur:"Andriamasy A", pesee:"14h00", briefing:"18h30" },
    { id: "d2", event: "Nosy Be Open", fight: "Finale -77kg", role: "Juge 1", date: "02/09/2026 16:00", status: "En attente", lieu:"Stade Ambatoloaka", cat:"-77kg", indemnite:"200k Ar", orga:"Joel S.", superviseur:"Rivo T.", pesee:"10h00", briefing:"14h00" },
    { id: "d3", event: "Antananarivo Fight Night", fight: "Lala vs Miora - Title", role: "Arbitre centre", date: "19/09/2026 21:00", status: "Proposée", lieu:"Palais des Sports", cat:"-61kg F", indemnite:"400k Ar", orga:"FMMADA", superviseur:"Fédéral", pesee:"15h00", briefing:"19h00" },
    { id: "d4", event: "Toliara Contender", fight: "2 combats prélim", role: "Juge 2", date: "26/09/2026 18:00", status: "Proposée", lieu:"Toliara Arena", cat:"Multi", indemnite:"180k Ar + vol", orga:"Ligue Atsimo", superviseur:"Ben M.", pesee:"12h00", briefing:"16h00" },
  ]
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center"><h3 className="text-sm font-bold text-white">Mes Désignations • Détails fédéraux</h3><div className="flex gap-2"><button className="h-7 px-2.5 bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400 flex items-center gap-1"><Filter className="h-3 w-3"/>Filtrer</button><button className="h-7 px-2.5 bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400 flex items-center gap-1"><Download className="h-3 w-3"/>Export ICS</button></div></div>
      <div className="grid gap-3">
        {fights.map((f) => (
          <div key={f.id} className="border border-zinc-900 bg-zinc-950 p-4 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div><p className="text-sm font-bold text-white">{f.event} • {f.fight} <span className="text-zinc-500 font-normal">[{f.cat}]</span></p><p className="text-[11px] text-zinc-500 flex items-center gap-2"><Clock className="h-3 w-3" />{f.date} • {f.role} • <MapPin className="h-3 w-3"/>{f.lieu}</p></div>
              <div className="flex items-center gap-2"><span className={`px-2 py-0.5 text-[10px] font-bold uppercase ${f.status === "Confirmée"? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : f.status === "En attente" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-zinc-800 text-zinc-400 border border-zinc-700"}`}>{f.status}</span><button onClick={() => ctx?.showConfirm({ title: "Confirmer désignation?", message: `${f.event} - ${f.fight}\nLieu: ${f.lieu}\nIndemnité: ${f.indemnite}\nPesée: ${f.pesee}`, confirmText: "Confirmer", onConfirm: () => ctx.showPopup({ title: "Confirmée", message: "Organisateur notifié • Convocation générée", type: "success" }) })} className="h-7 px-3 bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300">Gérer</button></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-[10px] border-t border-zinc-900 pt-3">
              <div className="bg-zinc-900/30 border border-zinc-900 p-2"><p className="text-zinc-500 uppercase font-bold">Indemnité</p><p className="text-white font-bold">{f.indemnite}</p></div>
              <div className="bg-zinc-900/30 border border-zinc-900 p-2"><p className="text-zinc-500 uppercase font-bold">Orga</p><p className="text-white font-bold">{f.orga}</p></div>
              <div className="bg-zinc-900/30 border border-zinc-900 p-2"><p className="text-zinc-500 uppercase font-bold">Superviseur</p><p className="text-white font-bold">{f.superviseur}</p></div>
              <div className="bg-zinc-900/30 border border-zinc-900 p-2"><p className="text-zinc-500 uppercase font-bold">Pesée</p><p className="text-white font-bold">{f.pesee}</p></div>
              <div className="bg-zinc-900/30 border border-zinc-900 p-2"><p className="text-zinc-500 uppercase font-bold">Briefing</p><p className="text-white font-bold">{f.briefing}</p></div>
            </div>
            <div className="flex flex-wrap gap-2 text-[9px]"><span className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-400">Check: Licence</span><span className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-400">Check: Tenue</span><span className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-400">Check: Déplacement</span><span className="px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400">Convocation à télécharger</span></div>
          </div>
        ))}
      </div>
    </div>
  )
}

function HistoriqueModule() {
  const rows = [
    { d: "12/04/2026", c: "Rakoto vs Razafy", r: "Centre", dec: "TKO R2 1:23", n: "4.9", event:"MFN V", cat:"-77kg", lieu:"Antananarivo", methode:"Ground & Pound", duree:"6:23", sup:"Andriamasy", video:"Oui", conteste:"Non" },
    { d: "08/02/2026", c: "Guillaume B. vs Rova K.", r: "Juge", dec: "Décision partagée", n: "4.7", event:"Nosy Be Open", cat:"-84kg", lieu:"Nosy Be", methode:"Points", duree:"15:00", sup:"Rivo T.", video:"Oui", conteste:"Oui - rejetée" },
    { d: "15/12/2025", c: "Sitrak a vs Andry T. II", r: "Centre", dec: "Soumission R3", n: "5.0", event:"Finale Nationale", cat:"-84kg", lieu:"Mahajanga", methode:"RNC", duree:"12:45", sup:"Fédéral", video:"Oui", conteste:"Non" },
    { d: "02/11/2025", c: "Fanja vs Lala", r: "Centre", dec: "Décision una.", n: "4.8", event:"AFN", cat:"-61kg F", lieu:"Tana", methode:"Points", duree:"15:00", sup:"Hery", video:"Oui", conteste:"Non" },
  ]
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center"><h3 className="text-sm font-bold text-white">Historique complet • 147 combats</h3><div className="flex gap-2"><button className="h-7 px-2.5 bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400">Filtre par année</button><button className="h-7 px-2.5 bg-amber-500 text-black font-bold text-[11px]">Exporter CSV complet</button></div></div>
      <div className="border border-zinc-900 bg-zinc-950 overflow-x-auto">
        <table className="w-full text-left min-w-[1100px]"><thead><tr className="bg-zinc-900/30 border-b border-zinc-900 text-[10px] uppercase font-bold text-zinc-500"><th className="p-3">Date</th><th className="p-3">Événement</th><th className="p-3">Combat</th><th className="p-3">Cat</th><th className="p-3">Rôle</th><th className="p-3">Décision / Méthode</th><th className="p-3">Durée</th><th className="p-3">Lieu</th><th className="p-3">Superviseur</th><th className="p-3">Vidéo</th><th className="p-3">Note</th></tr></thead>
        <tbody className="divide-y divide-zinc-900 text-[11px]">{rows.map((row) => (<tr key={row.d + row.c} className="hover:bg-zinc-900/20"><td className="p-3 text-zinc-400">{row.d}</td><td className="p-3 font-bold text-zinc-300">{row.event}</td><td className="p-3 font-bold text-white">{row.c}</td><td className="p-3 text-zinc-400">{row.cat}</td><td className="p-3 text-zinc-400">{row.r}</td><td className="p-3 text-zinc-300">{row.dec} • {row.methode}</td><td className="p-3 text-zinc-400">{row.duree}</td><td className="p-3 text-zinc-400">{row.lieu}</td><td className="p-3 text-zinc-400">{row.sup}</td><td className="p-3"><span className={`px-1.5 py-0.5 text-[9px] ${row.video==="Oui"?"bg-emerald-500/10 text-emerald-400":"bg-zinc-800 text-zinc-500"}`}>{row.video}</span></td><td className="p-3 text-amber-400 font-bold">{row.n}</td></tr>))}</tbody></table>
      </div>
      <div className="grid md:grid-cols-4 gap-3 text-[11px]">
        <div className="border border-zinc-900 bg-zinc-950 p-3"><p className="text-zinc-500 uppercase text-[10px] font-bold">Bilan par décision</p><p className="text-white mt-1">TKO 42% • Soum 28% • Décision 25% • DQ 5%</p></div>
        <div className="border border-zinc-900 bg-zinc-950 p-3"><p className="text-zinc-500 uppercase text-[10px] font-bold">Round moyen d'arrêt</p><p className="text-white mt-1">R2 - 2:14 • Précoce 18%</p></div>
        <div className="border border-zinc-900 bg-zinc-950 p-3"><p className="text-zinc-500 uppercase text-[10px] font-bold">Taux d'intervention médicale</p><p className="text-white mt-1">4.7% • Inférieur moyenne fédé 7.2%</p></div>
        <div className="border border-zinc-900 bg-zinc-950 p-3"><p className="text-zinc-500 uppercase text-[10px] font-bold">Contestations</p><p className="text-white mt-1">2 / 147 • 0 retenue</p></div>
      </div>
    </div>
  )
}

function ReglementsModule() {
  const ctx = useContext(PopupContext);
  const docs = [
    { t: "Règlement MMA FMMADA 2026", v: "v4.2 • PDF • 84p", cat:"MMA", obligatoire:true, date:"01/01/2026", maj:"Coups de coude amendés" },
    { t: "Protocole gestion KO / commotion", v: "Obligatoire • v2.1", cat:"Médical", obligatoire:true, date:"15/03/2026", maj:"SCAT6 intégré" },
    { t: "Formation Arbitrage Vidéo VAR", v: "Quiz 12/15 validé", cat:"Formation", obligatoire:false, date:"10/02/2026", maj:"Module 3/5" },
    { t: "Règles Judo IJF 2025-2026 adaptées", v: "v2025 • 42p", cat:"Judo", obligatoire:true, date:"01/09/2025", maj:"Ippon / Waza-ari" },
    { t: "Règlement Kickboxing WAKO", v: "v3.0", cat:"Kick", obligatoire:true, date:"01/01/2026", maj:"Comptage" },
    { t: "Charte éthique & impartialité", v: "Signée 12/01/2026", cat:"Éthique", obligatoire:true, date:"12/01/2026", maj:"Conflit d'intérêt" },
    { t: "Procédure pesée & hydratation", v: "v1.8", cat:"Pesée", obligatoire:true, date:"20/01/2026", maj:"Tolérance 0.5kg" },
    { t: "Grille sanctions & pénalités", v: "MMA / Kick / Judo", cat:"Sanction", obligatoire:true, date:"05/01/2026", maj:"Cartons" },
  ]
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center"><h3 className="text-sm font-bold text-white">Centre documentaire fédéral • 8 documents</h3><span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1">Conformité 7/8 • 1 formation en cours</span></div>
      <div className="grid md:grid-cols-2 gap-3">
        {docs.map((doc) => (
          <div key={doc.t} className="border border-zinc-900 bg-zinc-950 p-4 flex justify-between items-start gap-3">
            <div className="flex-1"><div className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-zinc-600" /><p className="text-sm font-bold text-white">{doc.t}</p>{doc.obligatoire && <span className="h-4 px-1.5 bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] font-bold">OBLIGATOIRE</span>}</div>
              <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-zinc-500"><span className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800">{doc.cat}</span><span>{doc.v}</span><span>• MAJ {doc.date}</span></div>
              <p className="mt-1 text-[10px] text-amber-500/70">Dernier changement: {doc.maj}</p>
            </div>
            <button onClick={() => ctx?.showPopup({ title: doc.t, message: `Ouverture du document\nCatégorie: ${doc.cat}\nVersion: ${doc.v}\nDernière MAJ: ${doc.maj}`, type: "info" })} className="h-7 w-7 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white"><Eye className="h-3 w-3" /></button>
          </div>
        ))}
      </div>
      <div className="border border-amber-500/20 bg-amber-500/5 p-4"><h4 className="text-xs font-bold text-amber-400 flex items-center gap-2"><GraduationCap className="h-4 w-4"/>Parcours formation lié</h4><p className="text-[11px] text-zinc-400 mt-1">Quiz arbitrage vidéo: 12/15 • Vidéos à revoir: 3 • Prochain séminaire fédéral: 28 Août 2026 • Lieu: Antananarivo</p></div>
    </div>
  )
}

function CertifsModule() {
  return (
    <div className="space-y-3">
      <div className="grid md:grid-cols-3 gap-3">
        <div className="border border-zinc-900 bg-zinc-950 p-5"><p className="text-[10px] uppercase font-bold text-zinc-500">Grade Fédéral</p><p className="mt-1 text-lg font-black text-white">Arbitre National A</p><p className="mt-2 text-[11px] text-zinc-500 flex items-center gap-2"><BadgeCheck className="h-3.5 w-3.5 text-emerald-500" />Certifié depuis 2022 • FMMADA • N° ARB-2026-0842</p><div className="mt-3 space-y-1 text-[10px]"><p className="text-zinc-400">• Passage Grade A: 18/06/2022 - Note 17/20</p><p className="text-zinc-400">• Juge National B: 2020 • Centre C: 2019</p><p className="text-amber-400">• Éligible International C - dossier 82%</p></div></div>
        <div className="border border-zinc-900 bg-zinc-950 p-5"><p className="text-[10px] uppercase font-bold text-zinc-500">Licence & Assurance</p><p className="mt-1 text-sm font-bold text-emerald-400">N° ARB-2026-0842 • Valide</p><div className="mt-3 h-1.5 w-full bg-zinc-900"><div className="h-full bg-emerald-500" style={{ width: "82%" }} /></div><p className="mt-1 text-[11px] text-zinc-500">Expire dans 142 jours • Assurance RC incluse • Mutuelle: ARO</p><div className="mt-3 text-[10px] space-y-1"><p className="text-zinc-400">• Licence fédérale 2026 payée: 120 000 Ar</p><p className="text-zinc-400">• Assurance accident: couverture 50M Ar</p></div></div>
        <div className="border border-zinc-900 bg-zinc-950 p-5"><p className="text-[10px] uppercase font-bold text-zinc-500">Médical Arbitre</p><p className="mt-1 text-sm font-bold text-amber-400">À renouveler dans 14j</p><div className="mt-2 space-y-1 text-[10px] text-zinc-400"><p>• Dernière visite: 18/07/2025 • Dr RAKOTO</p><p>• ECG: Normal • Ophtalmo: 10/10</p><p>• Vaccins: OK • Contre-indication: Aucune</p></div><div className="mt-3 h-1.5 w-full bg-zinc-900"><div className="h-full bg-amber-500" style={{width:"78%"}}/></div></div>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <div className="border border-zinc-900 bg-zinc-950 p-5"><h4 className="text-xs font-bold text-white">Diplômes & Formations validées</h4><div className="mt-3 space-y-2 text-[11px]"><div className="flex justify-between border-b border-zinc-900 pb-2"><span className="text-zinc-400">PSC1 - Secourisme</span><span className="text-emerald-400">Validé 03/2025 • Exp 03/2027</span></div><div className="flex justify-between border-b border-zinc-900 pb-2"><span className="text-zinc-400">Gestion commotion SCAT6</span><span className="text-emerald-400">Validé 01/2026</span></div><div className="flex justify-between border-b border-zinc-900 pb-2"><span className="text-zinc-400">Arbitrage Judo IJF</span><span className="text-emerald-400">Module 1 & 2 validés</span></div><div className="flex justify-between"><span className="text-zinc-400">VAR / Replay</span><span className="text-amber-400">En cours 60%</span></div></div></div>
        <div className="border border-zinc-900 bg-zinc-950 p-5"><h4 className="text-xs font-bold text-white">Historique grades</h4><div className="mt-3 relative border-l border-zinc-800 ml-2 space-y-4 text-[11px]"><div className="ml-4 relative"><div className="absolute -left-[21px] h-3 w-3 bg-amber-500 rounded-full"/><p className="text-white font-bold">2022 - National A</p><p className="text-zinc-500">Note fédérale 17/20 • Éligible Main Event</p></div><div className="ml-4 relative"><div className="absolute -left-[21px] h-3 w-3 bg-zinc-700 rounded-full"/><p className="text-white font-bold">2020 - National B</p><p className="text-zinc-500">Passage après 47 combats</p></div><div className="ml-4 relative"><div className="absolute -left-[21px] h-3 w-3 bg-zinc-700 rounded-full"/><p className="text-white font-bold">2019 - Régional</p><p className="text-zinc-500">Formation initiale FMMADA</p></div></div></div>
      </div>
    </div>
  )
}

function DisposModule() {
  const ctx = useContext(PopupContext);
  const days = Array.from({length:31},(_,i)=> {
    const d = i+1
    const status = d===15 ? "designation" : d%7===0 ? "indispo" : d%3===0 ? "dispo" : "libre"
    return {d, status}
  })
  return (
    <div className="space-y-4">
      <div className="border border-zinc-900 bg-zinc-950 p-5">
        <div className="flex justify-between items-center"><h3 className="text-sm font-bold text-white flex items-center gap-2"><Calendar className="h-4 w-4 text-amber-500" />Disponibilités Août 2026 • Vue complète fédérale</h3><div className="flex gap-2 text-[10px]"><span className="flex items-center gap-1"><span className="h-2 w-2 bg-emerald-500"/>Dispo</span><span className="flex items-center gap-1"><span className="h-2 w-2 bg-red-500"/>Indispo</span><span className="flex items-center gap-1"><span className="h-2 w-2 bg-amber-500"/>Désignation</span></div></div>
        <div className="mt-4 grid grid-cols-7 gap-1.5">
          {["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"].map(j=><div key={j} className="text-[10px] font-bold text-zinc-500 uppercase text-center">{j}</div>)}
          {days.map((day) => (
            <button key={day.d} onClick={() => ctx?.showPopup({ title: `${day.d} Août`, message: `Statut: ${day.status}\nBasculer dispo / indispo?\nMotif possible: déplacement, blessure, congé`, type: "info" })} className={`h-16 border text-[11px] font-bold flex flex-col items-center justify-center gap-1 ${day.status==="designation" ? "bg-amber-500/20 border-amber-500/50 text-amber-300" : day.status==="dispo" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300" : day.status==="indispo" ? "bg-red-500/10 border-red-500/20 text-red-300" : "bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:bg-zinc-900"}`}>
              <span>{day.d}</span><span className={`h-1 w-1 rounded-full ${day.status==="dispo"?"bg-emerald-500":day.status==="indispo"?"bg-red-500":day.status==="designation"?"bg-amber-500":"bg-zinc-600"}`} />
              {day.status==="designation" && <span className="text-[8px]">MFN VI</span>}
            </button>
          ))}
        </div>
        <div className="mt-4 grid md:grid-cols-3 gap-3 text-[11px]">
          <div className="bg-zinc-900/30 border border-zinc-900 p-3"><p className="text-zinc-500 uppercase font-bold text-[10px]">Contraintes déplacement</p><p className="text-white mt-1">Max 300km sauf défrayé • Vol requis {'>'}500km • Zone préférée: Boeny, Diana</p></div>
          <div className="bg-zinc-900/30 border border-zinc-900 p-3"><p className="text-zinc-500 uppercase font-bold text-[10px]">Indisponibilités déclarées</p><p className="text-white mt-1">24 Août - Congé familial • 31 Août - Formation Paris (visio)</p></div>
          <div className="bg-zinc-900/30 border border-zinc-900 p-3"><p className="text-zinc-500 uppercase font-bold text-[10px]">Sync calendrier</p><p className="text-white mt-1">Google Calendar connecté • Notifs SMS activées</p></div>
        </div>
      </div>
    </div>
  )
}

function EvaluationsModule() {
  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-3 gap-3">
        <div className="border border-zinc-900 bg-zinc-950 p-5"><p className="text-[10px] uppercase font-bold text-zinc-500">Note globale</p><p className="text-2xl font-black text-white">4.8 / 5</p><p className="text-[11px] text-emerald-400">Top 5% fédération • Progression +0.2</p><div className="mt-3 space-y-1.5 text-[11px]"><div className="flex justify-between"><span className="text-zinc-400">Placement</span><span className="text-white font-bold">4.9</span></div><div className="flex justify-between"><span className="text-zinc-400">Gestion KO</span><span className="text-white font-bold">5.0</span></div><div className="flex justify-between"><span className="text-zinc-400">Briefing</span><span className="text-white font-bold">4.7</span></div><div className="flex justify-between"><span className="text-zinc-400">Impartialité</span><span className="text-white font-bold">5.0</span></div><div className="flex justify-between"><span className="text-zinc-400">Ponctualité</span><span className="text-white font-bold">5.0</span></div></div></div>
        <div className="md:col-span-2 border border-zinc-900 bg-zinc-950 p-5"><h4 className="text-xs font-bold text-white">Évolution 12 mois</h4><div className="mt-3 h-20 flex items-end gap-1">{[4.2,4.3,4.4,4.5,4.6,4.6,4.7,4.7,4.8,4.8,4.9,4.8].map((v,i)=><div key={i} className="flex-1 bg-zinc-900 relative"><div className="absolute bottom-0 w-full bg-amber-500" style={{height:`${(v/5)*100}%`}}/><span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] text-zinc-500">{v}</span></div>)}</div><p className="text-[10px] text-zinc-600 mt-2">Jan → Déc • Moyenne mobile 3 mois</p></div>
      </div>
      <div className="space-y-3">
        {[
          { by: "Superviseur Fédéral - Andriamasy A", note: "4.9/5", com: "Excellent placement, gestion du KO très pro, arrêt au bon moment R2. Communication médicale parfaite.", date:"12/04/2026", event:"MFN V", criteres:{placement:5, securite:5, regles:4.8, comm:4.9} },
          { by: "Org. MFN V - Hery R.", note: "4.7/5", com: "Très bon briefing combattants, respect timing, attitude professionnelle. Petit retard de 2 min au briefing matinal.", date:"13/04/2026", event:"MFN V", criteres:{placement:4.6, securite:5, regles:4.8, comm:4.5} },
          { by: "Commission Judo", note: "4.8/5", com: "Maîtrise Ippon/Waza-ari, gestion Shido exemplaire. 14 combats sans contestation.", date:"20/03/2026", event:"Open Judo Tana", criteres:{placement:4.9, securite:4.8, regles:5, comm:4.7} },
        ].map((ev) => (
          <div key={ev.by} className="border border-zinc-900 bg-zinc-950 p-4">
            <div className="flex justify-between items-start"><div><p className="text-sm font-bold text-white">{ev.by}</p><p className="text-[11px] text-zinc-500">{ev.event} • {ev.date}</p></div><span className="text-amber-400 font-bold text-sm border border-amber-500/20 bg-amber-500/10 px-2 py-0.5">{ev.note}</span></div>
            <p className="text-[11px] text-zinc-400 mt-2 italic">"{ev.com}"</p>
            <div className="mt-3 grid grid-cols-4 gap-2 text-[10px]"><div className="bg-zinc-900/50 p-2 border border-zinc-900"><p className="text-zinc-500">Placement</p><p className="text-white font-bold">{ev.criteres.placement}</p></div><div className="bg-zinc-900/50 p-2 border border-zinc-900"><p className="text-zinc-500">Sécurité</p><p className="text-white font-bold">{ev.criteres.securite}</p></div><div className="bg-zinc-900/50 p-2 border border-zinc-900"><p className="text-zinc-500">Règles</p><p className="text-white font-bold">{ev.criteres.regles}</p></div><div className="bg-zinc-900/50 p-2 border border-zinc-900"><p className="text-zinc-500">Communication</p><p className="text-white font-bold">{ev.criteres.comm}</p></div></div>
          </div>
        ))}
      </div>
    </div>
  )
}

function RapportsModule() {
  const ctx = useContext(PopupContext);
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center"><h3 className="text-sm font-bold text-white">Centre rapports & incidents fédéraux</h3><button onClick={() => ctx?.showPopup({ title: "Nouveau rapport", message: "Types disponibles:\n• Incident combat\n• Disqualification\n• Blessure grave / KO\n• Comportement antisportif\n• Pesée non conforme\n• Contestation officielle", type: "prompt" })} className="h-8 px-3 bg-amber-500 text-black font-bold text-[11px] flex items-center gap-1"><Upload className="h-3.5 w-3.5"/>Nouveau rapport</button></div>
      <div className="grid md:grid-cols-4 gap-3 text-[11px]">
        <div className="border border-zinc-900 bg-zinc-950 p-3"><p className="text-zinc-500 uppercase text-[10px] font-bold">Rapports totaux</p><p className="text-xl font-black text-white">23</p><p className="text-zinc-500">dont 2 en 2026</p></div>
        <div className="border border-zinc-900 bg-zinc-950 p-3"><p className="text-zinc-500 uppercase text-[10px] font-bold">En attente validation</p><p className="text-xl font-black text-amber-400">1</p><p className="text-zinc-500">Commission discipline</p></div>
        <div className="border border-zinc-900 bg-zinc-950 p-3"><p className="text-zinc-500 uppercase text-[10px] font-bold">Cartons distribués</p><p className="text-white font-bold">Jaunes 12 • Rouges 2 • DQ 2</p></div>
        <div className="border border-zinc-900 bg-zinc-950 p-3"><p className="text-zinc-500 uppercase text-[10px] font-bold">Délai moyen rédaction</p><p className="text-white font-bold">4h 12min • Top 10%</p></div>
      </div>
      <div className="space-y-2">
        {[
          {id:"#RPT-2026-042", event:"MFN V", type:"Carton jaune", detail:"Coup bas R2 - Avertissement + récupération 5min accordée", statut:"Validé", date:"12/04/2026", suite:"Aucune", pieces:["Feuille match","Photo incident"]},
          {id:"#RPT-2025-118", event:"AFN 12", type:"Disqualification", detail:"Coup de tête intentionnel R1 - DQ immédiate", statut:"Clôturé - Sanction 6 mois combattant", date:"08/11/2025", suite:"Commission", pieces:["Vidéo","Rapport médical"]},
          {id:"#RPT-2025-097", event:"Nosy Be Open", type:"KO sévère", detail:"KO R2 - Protocole commotion 3min, évacuation CHU", statut:"Clôturé", date:"02/09/2025", suite:"Suivi médical 30j", pieces:["SCAT6","CR médecin"]},
        ].map(r=>(
          <div key={r.id} className="border border-zinc-900 bg-zinc-950 p-4 flex flex-col gap-2">
            <div className="flex justify-between items-start"><div><p className="text-sm font-bold text-white">{r.id} • {r.event} • <span className="text-amber-400">{r.type}</span></p><p className="text-[11px] text-zinc-500">{r.detail}</p></div><span className={`px-2 py-0.5 text-[10px] font-bold uppercase ${r.statut.includes("Validé")||r.statut.includes("Clôturé")?"bg-zinc-800 text-zinc-300":"bg-amber-500/10 text-amber-400 border border-amber-500/20"}`}>{r.statut}</span></div>
            <div className="flex flex-wrap gap-2 text-[10px]"><span className="bg-zinc-900 border border-zinc-800 px-2 py-0.5 text-zinc-400">Date: {r.date}</span><span className="bg-zinc-900 border border-zinc-800 px-2 py-0.5 text-zinc-400">Suite: {r.suite}</span>{r.pieces.map(p=><span key={p} className="bg-zinc-900 border border-zinc-800 px-2 py-0.5 text-zinc-300 flex items-center gap-1"><FileText className="h-3 w-3"/>{p}</span>)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function FinancesModule() {
  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-4 gap-3">
        <div className="border border-zinc-900 bg-zinc-950 p-4"><p className="text-[10px] uppercase text-zinc-500">Indemnités 30j</p><p className="text-xl font-black text-white mt-1">950 000 Ar</p><p className="text-[10px] text-emerald-400">+12% vs mois dernier</p><div className="mt-2 h-1 w-full bg-zinc-900"><div className="h-full bg-emerald-500" style={{width:"72%"}}/></div></div>
        <div className="border border-zinc-900 bg-zinc-950 p-4"><p className="text-[10px] uppercase text-zinc-500">En attente virement</p><p className="text-xl font-black text-amber-400 mt-1">250 000 Ar</p><p className="text-[10px] text-zinc-500">MFN VI - paiement J+7</p></div>
        <div className="border border-zinc-900 bg-zinc-950 p-4"><p className="text-[10px] uppercase text-zinc-500">Km défrayés 2026</p><p className="text-sm font-bold text-white mt-1">1 840 km • 368 000 Ar</p><p className="text-[10px] text-zinc-500">Barème 200Ar/km • Justificatifs OK</p></div>
        <div className="border border-zinc-900 bg-zinc-950 p-4"><p className="text-[10px] uppercase text-zinc-500">Total annuel 2026</p><p className="text-xl font-black text-white mt-1">4 250 000 Ar</p><p className="text-[10px] text-zinc-500">12 events • Moy 354k / event</p></div>
      </div>
      <div className="border border-zinc-900 bg-zinc-950 overflow-hidden">
        <div className="p-4 border-b border-zinc-900 flex justify-between items-center"><h4 className="text-xs font-bold text-white">Historique paiements détaillé</h4><button className="h-7 px-2.5 bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400 flex items-center gap-1"><FileSpreadsheet className="h-3 w-3"/>Export compta</button></div>
        <table className="w-full text-left"><thead><tr className="bg-zinc-900/30 border-b border-zinc-900 text-[10px] uppercase font-bold text-zinc-500"><th className="p-3">Date</th><th className="p-3">Événement</th><th className="p-3">Rôle</th><th className="p-3">Indemnité</th><th className="p-3">KM</th><th className="p-3">Prime</th><th className="p-3">Total</th><th className="p-3">Statut</th><th className="p-3">Facture</th></tr></thead><tbody className="divide-y divide-zinc-900 text-[11px]">{[
          {date:"12/04/2026", event:"MFN V", role:"Centre", indem:"300k", km:"120k", prime:"50k Main", total:"470k", statut:"Payé", fact:"F-042"},
          {date:"08/02/2026", event:"Nosy Be", role:"Juge", indem:"180k", km:"80k vol", prime:"0", total:"260k", statut:"Payé", fact:"F-039"},
          {date:"15/12/2025", event:"Finale Nat", role:"Centre", indem:"400k", km:"60k", prime:"100k Title", total:"560k", statut:"Payé", fact:"F-033"},
        ].map(r=><tr key={r.fact} className="hover:bg-zinc-900/20"><td className="p-3 text-zinc-400">{r.date}</td><td className="p-3 text-white font-bold">{r.event}</td><td className="p-3 text-zinc-400">{r.role}</td><td className="p-3 text-zinc-300">{r.indem}</td><td className="p-3 text-zinc-300">{r.km}</td><td className="p-3 text-amber-400">{r.prime}</td><td className="p-3 text-white font-bold">{r.total}</td><td className="p-3"><span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px]">{r.statut}</span></td><td className="p-3 text-zinc-500">{r.fact}</td></tr>)}</tbody></table>
      </div>
      <div className="grid md:grid-cols-3 gap-3 text-[11px]">
        <div className="border border-zinc-900 bg-zinc-950 p-4"><h4 className="text-[11px] font-bold uppercase text-zinc-400">RIB & Paiement</h4><p className="mt-2 text-white">MVola: 034 12 345 67 • RAKOTONDRABE M.</p><p className="text-zinc-500">BOA: 00012 34567 89 • Délai J+7 fédéral</p><p className="mt-2 text-[10px] text-emerald-400">✓ Certificat fiscal 2025 fourni</p></div>
        <div className="border border-zinc-900 bg-zinc-950 p-4"><h4 className="text-[11px] font-bold uppercase text-zinc-400">Barème FMMADA 2026</h4><p className="mt-2 text-zinc-300">Centre Prélim: 200k • Centre Main: 350-500k • Juge: 150-200k • Superviseur: 400k</p><p className="text-zinc-500 text-[10px]">KM 200Ar • Nuitée 80k • Prime Title 100k</p></div>
        <div className="border border-zinc-900 bg-zinc-950 p-4"><h4 className="text-[11px] font-bold uppercase text-zinc-400">Documents compta</h4><div className="mt-2 space-y-1"><p className="text-zinc-300 flex items-center gap-1"><FileCheck className="h-3 w-3"/>Attestations 2025 (PDF)</p><p className="text-zinc-300 flex items-center gap-1"><FileCheck className="h-3 w-3"/>Reçu indemnités T1 2026</p><p className="text-amber-400 flex items-center gap-1"><AlertCircle className="h-3 w-3"/>Justificatif vol Toliara à fournir</p></div></div>
      </div>
    </div>
  )
}

// ==================== NOUVEAUX MODULES MANQUANTS ====================
function MaterielModule(){
  const ctx = useContext(PopupContext)
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-white flex items-center gap-2"><Package className="h-4 w-4 text-amber-500"/>Dotation & Matériel arbitre fédéral</h3>
      <div className="grid md:grid-cols-3 gap-3">
        {[
          {item:"Polo Arbitre IM Noir", qte:"2", etat:"Neuf", taille:"L", date:"12/01/2026"},
          {item:"Pantalon Arbitre", qte:"2", etat:"Bon", taille:"L 42", date:"12/01/2026"},
          {item:"Gants MMA - Inspection", qte:"1 paire", etat:"Neuf", taille:"L", date:"01/03/2026"},
          {item:"Casque Judo / Protection", qte:"1", etat:"Bon", taille:"-", date:"2024"},
          {item:"Sifflet Fox 40", qte:"2", etat:"Neuf", taille:"-", date:"2025"},
          {item:"Cartons Jaune/Rouge", qte:"1 set", etat:"Neuf", taille:"-", date:"2026"},
        ].map(m=>(
          <div key={m.item} className="border border-zinc-900 bg-zinc-950 p-4"><p className="text-xs font-bold text-white">{m.item}</p><p className="text-[11px] text-zinc-500 mt-1">Qté: {m.qte} • État: {m.etat} • Taille: {m.taille}</p><p className="text-[10px] text-zinc-600">Dotation: {m.date}</p></div>
        ))}
      </div>
      <div className="border border-zinc-900 bg-zinc-950 p-5"><h4 className="text-xs font-bold text-white">Check-list obligatoire combat (Centre)</h4><div className="mt-3 grid md:grid-cols-2 gap-2 text-[11px]">{["Licence physique + CI","Certificat médical arbitre","Tenue complète + rechange","Gants latex inspection","Vaseline / Serviette","Feuilles de match + stylo","Cartons + sifflet","Téléphone chargé + powerbank"].map(c=><div key={c} className="flex items-center gap-2 text-zinc-400"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500"/>{c}</div>)}</div></div>
    </div>
  )
}

function MedicalModule(){
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-white flex items-center gap-2"><Stethoscope className="h-4 w-4 text-red-500"/>Suivi Médical & Sécurité - Responsabilité arbitre</h3>
      <div className="grid md:grid-cols-3 gap-3">
        <div className="border border-zinc-900 bg-zinc-950 p-4"><p className="text-[10px] uppercase font-bold text-zinc-500">Protocole commotion</p><p className="text-white font-bold text-sm mt-1">SCAT6 maîtrisé • Temps arrêt moyen 8s</p><p className="text-[11px] text-zinc-500 mt-2">7 interventions 2026 • 0 erreur protocolaire • Formation 01/2026 validée</p></div>
        <div className="border border-zinc-900 bg-zinc-950 p-4"><p className="text-[10px] uppercase font-bold text-zinc-500">Gestion saignement / Blessure</p><p className="text-white font-bold text-sm mt-1">Kit médical ringside checké</p><p className="text-[11px] text-zinc-500 mt-2">Liaison médecin fédéral • Dr RABEARIVELO • 034 88 123 45</p></div>
        <div className="border border-red-900/30 bg-red-950/10 p-4"><p className="text-[10px] uppercase font-bold text-red-400">Alertes combattants à risque</p><p className="text-white font-bold text-sm mt-1">2 combattants sous suspension médicale</p><p className="text-[11px] text-red-300/70 mt-2">Rakoto J. - KO 12/03 (suspendu jusqu'à 12/06) • Fanja M. - Coupure arcade 6pts</p></div>
      </div>
      <div className="border border-zinc-900 bg-zinc-950 p-5"><h4 className="text-xs font-bold text-white">Procédure d'arrêt - Checklist IM</h4><div className="mt-3 grid md:grid-cols-3 gap-3 text-[11px]"><div className="bg-zinc-900/40 border border-zinc-900 p-3"><p className="font-bold text-white">1. Évaluation immédiate</p><p className="text-zinc-400 mt-1">• Combattant conscient? • Défense intelligente? • Appel médecin si doute</p></div><div className="bg-zinc-900/40 border border-zinc-900 p-3"><p className="font-bold text-white">2. Décision</p><p className="text-zinc-400 mt-1">• TKO / KO / Soumission • Temps exact • Méthode • Annonce claire</p></div><div className="bg-zinc-900/40 border border-zinc-900 p-3"><p className="font-bold text-white">3. Post-combat</p><p className="text-zinc-400 mt-1">• Rapport médical • SCAT si KO • Suspension • Suivi J+7</p></div></div></div>
    </div>
  )
}

function FormationModule(){
  const ctx = useContext(PopupContext)
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-white flex items-center gap-2"><GraduationCap className="h-4 w-4 text-amber-500"/>Formation continue fédérale</h3>
      <div className="grid md:grid-cols-3 gap-3">
        <div className="border border-zinc-900 bg-zinc-950 p-4"><p className="text-[10px] uppercase font-bold text-zinc-500">Crédits formation 2026</p><p className="text-xl font-black text-white">18 / 24h</p><div className="h-1.5 w-full bg-zinc-900 mt-2"><div className="h-full bg-amber-500" style={{width:"75%"}}/></div><p className="text-[10px] text-zinc-500 mt-1">Manque 6h avant 31/12</p></div>
        <div className="border border-zinc-900 bg-zinc-950 p-4"><p className="text-[10px] uppercase font-bold text-zinc-500">Prochain séminaire</p><p className="text-sm font-bold text-white">28 Août 2026 - Antananarivo</p><p className="text-[11px] text-zinc-500">Thème: Gestion du clinch & arbitrage vidéo • 8h • Obligatoire Grade A</p></div>
        <div className="border border-zinc-900 bg-zinc-950 p-4"><p className="text-[10px] uppercase font-bold text-zinc-500">Certification VAR</p><p className="text-sm font-bold text-amber-400">60% - Module 3/5</p><p className="text-[11px] text-zinc-500">Quiz: 12/15 • Vidéos à corriger: 2 combats litigieux</p><button onClick={()=>ctx?.showPopup({title:"VAR", message:"Lancer le module 4 - Décisions partagées", type:"info"})} className="mt-2 h-7 px-3 bg-zinc-900 border border-zinc-800 text-[11px]">Continuer</button></div>
      </div>
      <div className="border border-zinc-900 bg-zinc-950 p-5"><h4 className="text-xs font-bold text-white">Historique formations</h4><div className="mt-3 space-y-2 text-[11px]">{["2026-01 - SCAT6 & Commotion - 4h - Validé","2025-11 - Judo IJF règles 2025 - 6h - Validé","2025-06 - MMA FMMADA v4.0 - 8h - Validé 16/20","2025-03 - Secourisme ringside - 4h - Validé"].map(f=><div key={f} className="flex justify-between border-b border-zinc-900 pb-2"><span className="text-zinc-400">{f}</span><span className="text-emerald-400">✓</span></div>)}</div></div>
    </div>
  )
}

function CommunicationModule(){
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-white flex items-center gap-2"><MessageSquare className="h-4 w-4 text-amber-500"/>Communication fédérale</h3>
      <div className="grid md:grid-cols-3 gap-3">
        <div className="md:col-span-2 border border-zinc-900 bg-zinc-950 p-5"><h4 className="text-xs font-bold text-white">Messages fédéraux • 3 non lus</h4><div className="mt-3 space-y-2">{[
          {from:"FMMADA - Commission Arbitrage", obj:"Convocation séminaire 28 Août - obligatoire", date:"18/07/2026", prior:"Haute"},
          {from:"Superviseur Andriamasy", obj:"Feedback MFN V - Excellent, dispo pour finale?", date:"14/04/2026", prior:"Normale"},
          {from:"Trésorerie FMMADA", obj:"Virement indemnité MFN V effectué", date:"20/04/2026", prior:"Basse"},
        ].map(m=><div key={m.obj} className="border border-zinc-900 bg-zinc-900/30 p-3 flex justify-between"><div><p className="text-[11px] font-bold text-white">{m.from} <span className={`ml-2 px-1.5 py-0.5 text-[9px] ${m.prior==="Haute"?"bg-red-500/10 text-red-400 border border-red-500/20":"bg-zinc-800 text-zinc-400"}`}>{m.prior}</span></p><p className="text-[11px] text-zinc-400">{m.obj}</p></div><span className="text-[10px] text-zinc-600">{m.date}</span></div>)}</div></div>
        <div className="border border-zinc-900 bg-zinc-950 p-5"><h4 className="text-xs font-bold text-white">Contacts clés</h4><div className="mt-3 space-y-2 text-[11px]"><div className="flex justify-between"><span className="text-zinc-500">Président FMMADA</span><span className="text-white">034 00 111 22</span></div><div className="flex justify-between"><span className="text-zinc-500">Commission Arbitrage</span><span className="text-white">034 00 111 33</span></div><div className="flex justify-between"><span className="text-zinc-500">Médecin fédéral</span><span className="text-white">034 88 123 45</span></div><div className="flex justify-between"><span className="text-zinc-500">Trésorerie</span><span className="text-white">034 00 111 44</span></div><div className="flex justify-between"><span className="text-zinc-500">Support IM ERP</span><span className="text-amber-400">support@indesy-mialy.mg</span></div></div></div>
      </div>
    </div>
  )
}

function StatistiquesModule(){
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-white flex items-center gap-2"><BarChart3 className="h-4 w-4 text-amber-500"/>Statistiques avancées • 147 combats d'analyse</h3>
      <div className="grid md:grid-cols-4 gap-3">
        <div className="border border-zinc-900 bg-zinc-950 p-4"><p className="text-[10px] uppercase text-zinc-500">Taux arrêt R1</p><p className="text-xl font-black text-white">18%</p><p className="text-[10px] text-zinc-500">Moyenne fédé 24% - tu laisses plus de chances</p></div>
        <div className="border border-zinc-900 bg-zinc-950 p-4"><p className="text-[10px] uppercase text-zinc-500">Décisions partagées jugées</p><p className="text-xl font-black text-white">8</p><p className="text-[10px] text-zinc-500">Dont 6 confirmées par superviseur (75%)</p></div>
        <div className="border border-zinc-900 bg-zinc-950 p-4"><p className="text-[10px] uppercase text-zinc-500">Temps moyen combat (centre)</p><p className="text-xl font-black text-white">7:42</p><p className="text-[10px] text-zinc-500">MMA uniquement</p></div>
        <div className="border border-zinc-900 bg-zinc-950 p-4"><p className="text-[10px] uppercase text-zinc-500">Score impartialité</p><p className="text-xl font-black text-emerald-400">5.0</p><p className="text-[10px] text-zinc-500">Aucun biais coin rouge/bleu détecté</p></div>
      </div>
      <div className="border border-zinc-900 bg-zinc-950 p-5"><h4 className="text-xs font-bold text-white">Analyse par catégorie de poids</h4><div className="mt-3 grid md:grid-cols-5 gap-2 text-[11px]">{[
        {cat:"-61kg", combats:18, tko:"33%"},
        {cat:"-66kg", combats:24, tko:"41%"},
        {cat:"-77kg", combats:42, tko:"45%"},
        {cat:"-84kg", combats:38, tko:"52%"},
        {cat:"+84kg", combats:25, tko:"68%"},
      ].map(s=><div key={s.cat} className="bg-zinc-900/40 border border-zinc-900 p-3"><p className="font-bold text-white">{s.cat}</p><p className="text-zinc-400">{s.combats} combats</p><p className="text-amber-400">TKO {s.tko}</p></div>)}</div></div>
    </div>
  )
}

// ============================================================================
// OUTIL DE JUGEMENT LIVE ULTRA COMPLET (TOUTES DISCIPLINES) - LOGIQUE CONSERVÉE 100%
// ============================================================================
type DisciplineType = "MMA" | "JUDO" | "KICKBOXING" | "GRAPPLING"

function JugementModule() {
  const ctx = useContext(PopupContext)
  const [discipline, setDiscipline] = useState<DisciplineType>("MMA")
  const [round, setRound] = useState(1)
  const [timer, setTimer] = useState(300)
  const [isRunning, setIsRunning] = useState(false)
  const [blueScore, setBlueScore] = useState({ points: 10, hits: 0, takedowns: 0, ipon: 0, waza: 0, penalties: 0, control: 0, subAttempts: 0 })
  const [redScore, setRedScore] = useState({ points: 9, hits: 0, takedowns: 0, ipon: 0, waza: 0, penalties: 0, control: 0, subAttempts: 0 })
  const [roundHistory, setRoundHistory] = useState<{r:number,b:number,ro:number}[]>([{r:1,b:10,ro:9}])

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
    setRoundHistory([{r:1,b:10,ro:9}])
    if (disc === "JUDO") {
      setTimer(240)
      setBlueScore({ points: 0, hits: 0, takedowns: 0, ipon: 0, waza: 0, penalties: 0, control: 0, subAttempts: 0 })
      setRedScore({ points: 0, hits: 0, takedowns: 0, ipon: 0, waza: 0, penalties: 0, control: 0, subAttempts: 0 })
    } else {
      setTimer(300)
      setBlueScore({ points: 10, hits: 0, takedowns: 0, ipon: 0, waza: 0, penalties: 0, control: 0, subAttempts: 0 })
      setRedScore({ points: 9, hits: 0, takedowns: 0, ipon: 0, waza: 0, penalties: 0, control: 0, subAttempts: 0 })
    }
  }

  const soumettreDecision = () => {
    ctx?.showPopup({
      title: "Soumission de la carte de score",
      message: `Feuille de match enregistrée avec succès pour la discipline [${discipline}].\nRound ${round} - Bleu ${blueScore.points} / Rouge ${redScore.points}\nHistorique: ${roundHistory.map(h=>`R${h.r}:${h.b}-${h.ro}`).join(' | ')}\nDonnées cryptées envoyées à la table centrale de la fédération.`,
      type: "success"
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-3 justify-between items-start lg:items-center bg-zinc-950 border border-zinc-900 p-4">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-amber-500 flex items-center gap-2">
            <Scale className="h-4 w-4" /> Console de Jugement d'Officiel • FMMADA OFFICIEL
          </h2>
          <p className="text-[11px] text-zinc-500 mt-0.5">Saisie synchronisée en temps réel • ID Combat: #CBT-2026-9942 • Event: MFN VI • Andry T. vs Sitraka R. -84kg • Superviseur: Andriamasy</p>
        </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-zinc-950 border border-zinc-900 p-4 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-2 left-3 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-500">Flux Live Synchronisé • Table centrale • Juge 2</span>
            </div>
            <div className="absolute top-2 right-3 flex items-center gap-2 text-[9px] text-zinc-500"><Video className="h-3 w-3"/> VAR disponible • <span className="text-emerald-400">Connecté</span></div>
            <div className="text-4xl font-mono font-black text-white tracking-widest my-1 flex items-center gap-3">
              <Timer className="h-6 w-6 text-amber-500" />
              {formatTime(timer)}
            </div>
            <div className="flex gap-2 mt-2">
              <button onClick={() => setIsRunning(!isRunning)} className={`h-7 px-4 text-[10px] font-bold uppercase ${isRunning ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-200 border border-zinc-700'}`}>{isRunning ? "Pause" : "Démarrer"}</button>
              <button onClick={() => { setIsRunning(false); resetScoresForDiscipline(discipline) }} className="h-7 px-3 bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 font-bold uppercase hover:text-white">Reset</button>
              <button onClick={()=>{ setRoundHistory(prev=>[...prev, {r:round, b:blueScore.points, ro:redScore.points}]); setRound(r=>Math.min(5,r+1)); setTimer(discipline==="JUDO"?240:300)}} className="h-7 px-3 bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-400 font-bold uppercase">Clore Round {round}</button>
            </div>
            {discipline !== "JUDO" && (
              <div className="flex items-center gap-1 mt-4 border-t border-zinc-900/60 pt-3 w-full justify-center">
                {[1, 2, 3, 4, 5].map((r) => (
                  <button key={r} onClick={() => setRound(r)} className={`h-6 w-12 font-bold text-[10px] rounded-none border transition-all ${round === r ? "bg-amber-500 text-black border-amber-500" : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700"}`}>R{r}</button>
                ))}
              </div>
            )}
            {roundHistory.length>1 && <div className="mt-3 text-[10px] text-zinc-500 flex gap-2">{roundHistory.map(h=><span key={h.r} className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800">R{h.r}: {h.b}-{h.ro}</span>)}</div>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-zinc-950 border-2 border-blue-900/50 p-4 relative">
              <div className="absolute top-0 right-0 bg-blue-600 text-white px-2 py-0.5 text-[8.5px] font-black uppercase tracking-wider">Coin Bleu</div>
              <h3 className="text-xs font-black uppercase text-white tracking-wide">R. ANDRIAMAHENINA</h3><p className="text-[10px] text-zinc-500 uppercase font-bold">Madagascar • 77.1 KG • 12V-3D • 28 ans</p>
              <div className="mt-4 bg-zinc-900/40 border border-zinc-900 p-3 flex items-center justify-between"><div><p className="text-[9px] uppercase font-bold text-zinc-400">Score de la reprise</p><p className="text-3xl font-black text-blue-400 mt-0.5">{blueScore.points}</p><p className="text-[9px] text-zinc-600">Critère: Dommage {'>'} Agressivité {'>'} Contrôle</p></div><div className="flex flex-col gap-1"><button onClick={() => setBlueScore(s => ({ ...s, points: s.points + 1 }))} className="h-6 w-8 bg-zinc-800 text-white font-bold text-xs hover:bg-zinc-700">+</button><button onClick={() => setBlueScore(s => ({ ...s, points: Math.max(0, s.points - 1) }))} className="h-6 w-8 bg-zinc-800 text-white font-bold text-xs hover:bg-zinc-700">-</button></div></div>
              <div className="mt-4 space-y-2">
                {discipline !== "JUDO" ? (
                  <>
                    <div className="flex justify-between items-center bg-zinc-900/20 p-2 border border-zinc-900"><span className="text-[11px] text-zinc-400 font-medium">Frappes Significatives</span><div className="flex items-center gap-2"><span className="text-xs font-mono font-bold text-white">{blueScore.hits}</span><button onClick={() => setBlueScore(s => ({ ...s, hits: s.hits + 1 }))} className="h-6 px-2 bg-zinc-800 text-[10px] font-bold text-zinc-300">+</button><button onClick={() => setBlueScore(s => ({ ...s, hits: Math.max(0,s.hits-1) }))} className="h-6 px-1 bg-zinc-900 text-[10px]">-</button></div></div>
                    <div className="flex justify-between items-center bg-zinc-900/20 p-2 border border-zinc-900"><span className="text-[11px] text-zinc-400 font-medium">Amenées au sol (TD)</span><div className="flex items-center gap-2"><span className="text-xs font-mono font-bold text-white">{blueScore.takedowns}</span><button onClick={() => setBlueScore(s => ({ ...s, takedowns: s.takedowns + 1 }))} className="h-6 px-2 bg-zinc-800 text-[10px] font-bold text-zinc-300">+</button></div></div>
                    <div className="flex justify-between items-center bg-zinc-900/20 p-2 border border-zinc-900"><span className="text-[11px] text-zinc-400 font-medium">Contrôle au sol (sec)</span><div className="flex items-center gap-2"><span className="text-xs font-mono font-bold text-white">{blueScore.control}</span><button onClick={() => setBlueScore(s => ({ ...s, control: s.control + 10 }))} className="h-6 px-2 bg-zinc-800 text-[10px] font-bold text-zinc-300">+10s</button></div></div>
                    <div className="flex justify-between items-center bg-zinc-900/20 p-2 border border-zinc-900"><span className="text-[11px] text-zinc-400 font-medium">Tentatives soumission</span><div className="flex items-center gap-2"><span className="text-xs font-mono font-bold text-white">{blueScore.subAttempts}</span><button onClick={() => setBlueScore(s => ({ ...s, subAttempts: s.subAttempts + 1 }))} className="h-6 px-2 bg-zinc-800 text-[10px] font-bold text-zinc-300">+</button></div></div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-center bg-zinc-900/20 p-2 border border-zinc-900"><span className="text-[11px] font-bold text-amber-500">IPPON</span><div className="flex items-center gap-2"><span className="text-xs font-mono font-bold text-white">{blueScore.ipon}</span><button onClick={() => setBlueScore(s => ({ ...s, ipon: Math.min(1, s.ipon + 1) }))} className="h-6 px-2 bg-amber-500 text-black text-[10px] font-black">IPPON</button></div></div>
                    <div className="flex justify-between items-center bg-zinc-900/20 p-2 border border-zinc-900"><span className="text-[11px] text-zinc-300 font-medium">WAZA-ARI</span><div className="flex items-center gap-2"><span className="text-xs font-mono font-bold text-white">{blueScore.waza}</span><button onClick={() => setBlueScore(s => ({ ...s, waza: s.waza + 1 }))} className="h-6 px-2 bg-zinc-800 text-[10px] font-bold text-zinc-300">+</button></div></div>
                  </>
                )}
                <div className="flex justify-between items-center border border-red-950/40 bg-red-950/5 p-2"><span className="text-[11px] text-red-400 font-bold flex items-center gap-1"><ShieldAlert className="h-3.5 w-3.5" /> Pénalités / Shido</span><div className="flex items-center gap-2"><span className="text-xs font-mono font-bold text-red-400">{blueScore.penalties}</span><button onClick={() => setBlueScore(s => ({ ...s, penalties: s.penalties + 1 }))} className="h-6 px-2 bg-red-950/40 border border-red-900 text-[10px] font-black text-red-400 hover:bg-red-900/40">+</button></div></div>
              </div>
            </div>

            <div className="bg-zinc-950 border-2 border-red-900/50 p-4 relative">
              <div className="absolute top-0 right-0 bg-red-600 text-white px-2 py-0.5 text-[8.5px] font-black uppercase tracking-wider">Coin Rouge</div>
              <h3 className="text-xs font-black uppercase text-white tracking-wide">F. RAZAFINDRAKOTO</h3><p className="text-[10px] text-zinc-500 uppercase font-bold">Madagascar • 76.9 KG • 9V-1D • 26 ans</p>
              <div className="mt-4 bg-zinc-900/40 border border-zinc-900 p-3 flex items-center justify-between"><div><p className="text-[9px] uppercase font-bold text-zinc-400">Score de la reprise</p><p className="text-3xl font-black text-red-400 mt-0.5">{redScore.points}</p><p className="text-[9px] text-zinc-600">Critère: Dommage {'>'} Agressivité {'>'} Contrôle</p></div><div className="flex flex-col gap-1"><button onClick={() => setRedScore(s => ({ ...s, points: s.points + 1 }))} className="h-6 w-8 bg-zinc-800 text-white font-bold text-xs hover:bg-zinc-700">+</button><button onClick={() => setRedScore(s => ({ ...s, points: Math.max(0, s.points - 1) }))} className="h-6 w-8 bg-zinc-800 text-white font-bold text-xs hover:bg-zinc-700">-</button></div></div>
              <div className="mt-4 space-y-2">
                {discipline !== "JUDO" ? (
                  <>
                    <div className="flex justify-between items-center bg-zinc-900/20 p-2 border border-zinc-900"><span className="text-[11px] text-zinc-400 font-medium">Frappes Significatives</span><div className="flex items-center gap-2"><span className="text-xs font-mono font-bold text-white">{redScore.hits}</span><button onClick={() => setRedScore(s => ({ ...s, hits: s.hits + 1 }))} className="h-6 px-2 bg-zinc-800 text-[10px] font-bold text-zinc-300">+</button><button onClick={() => setRedScore(s => ({ ...s, hits: Math.max(0,s.hits-1) }))} className="h-6 px-1 bg-zinc-900 text-[10px]">-</button></div></div>
                    <div className="flex justify-between items-center bg-zinc-900/20 p-2 border border-zinc-900"><span className="text-[11px] text-zinc-400 font-medium">Amenées au sol (TD)</span><div className="flex items-center gap-2"><span className="text-xs font-mono font-bold text-white">{redScore.takedowns}</span><button onClick={() => setRedScore(s => ({ ...s, takedowns: s.takedowns + 1 }))} className="h-6 px-2 bg-zinc-800 text-[10px] font-bold text-zinc-300">+</button></div></div>
                    <div className="flex justify-between items-center bg-zinc-900/20 p-2 border border-zinc-900"><span className="text-[11px] text-zinc-400 font-medium">Contrôle au sol (sec)</span><div className="flex items-center gap-2"><span className="text-xs font-mono font-bold text-white">{redScore.control}</span><button onClick={() => setRedScore(s => ({ ...s, control: s.control + 10 }))} className="h-6 px-2 bg-zinc-800 text-[10px] font-bold text-zinc-300">+10s</button></div></div>
                    <div className="flex justify-between items-center bg-zinc-900/20 p-2 border border-zinc-900"><span className="text-[11px] text-zinc-400 font-medium">Tentatives soumission</span><div className="flex items-center gap-2"><span className="text-xs font-mono font-bold text-white">{redScore.subAttempts}</span><button onClick={() => setRedScore(s => ({ ...s, subAttempts: s.subAttempts + 1 }))} className="h-6 px-2 bg-zinc-800 text-[10px] font-bold text-zinc-300">+</button></div></div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-center bg-zinc-900/20 p-2 border border-zinc-900"><span className="text-[11px] font-bold text-amber-500">IPPON</span><div className="flex items-center gap-2"><span className="text-xs font-mono font-bold text-white">{redScore.ipon}</span><button onClick={() => setRedScore(s => ({ ...s, ipon: Math.min(1, s.ipon + 1) }))} className="h-6 px-2 bg-amber-500 text-black text-[10px] font-black">IPPON</button></div></div>
                    <div className="flex justify-between items-center bg-zinc-900/20 p-2 border border-zinc-900"><span className="text-[11px] text-zinc-300 font-medium">WAZA-ARI</span><div className="flex items-center gap-2"><span className="text-xs font-mono font-bold text-white">{redScore.waza}</span><button onClick={() => setRedScore(s => ({ ...s, waza: s.waza + 1 }))} className="h-6 px-2 bg-zinc-800 text-[10px] font-bold text-zinc-300">+</button></div></div>
                  </>
                )}
                <div className="flex justify-between items-center border border-red-950/40 bg-red-950/5 p-2"><span className="text-[11px] text-red-400 font-bold flex items-center gap-1"><ShieldAlert className="h-3.5 w-3.5" /> Pénalités / Shido</span><div className="flex items-center gap-2"><span className="text-xs font-mono font-bold text-red-400">{redScore.penalties}</span><button onClick={() => setRedScore(s => ({ ...s, penalties: s.penalties + 1 }))} className="h-6 px-2 bg-red-950/40 border border-red-900 text-[10px] font-black text-red-400 hover:bg-red-900/40">+</button></div></div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-zinc-950 border border-zinc-900 p-4 flex flex-col justify-between h-full">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5"><Gavel className="h-3.5 w-3.5 text-amber-500" /> Critères de Jugement Officiels FMMADA</h3>
              <div className="space-y-2.5 text-[11px] border-b border-zinc-900 pb-4">
                <p className="text-zinc-400 leading-normal">Selon la charte fédérale <span className="text-amber-500 font-bold">Indesy Mialy v2026</span>, la notation doit respecter l'ordre d'importance strict suivant :</p>
                <div className="bg-zinc-900/40 p-2.5 border border-zinc-900 space-y-1.5 font-medium text-zinc-300">
                  <p className="flex items-center gap-2"><Zap className="h-3 w-3 text-amber-500 shrink-0" /> 1. Efficacité de l'impact / Dommages</p>
                  <p className="flex items-center gap-2"><Scale className="h-3 w-3 text-amber-500 shrink-0" /> 2. Combativité & Agressivité effective</p>
                  <p className="flex items-center gap-2"><MapPin className="h-3 w-3 text-amber-500 shrink-0" /> 3. Contrôle de la zone de combat</p>
                  <p className="flex items-center gap-2"><Clock className="h-3 w-3 text-amber-500 shrink-0" /> 4. Défense & Esquive</p>
                </div>
                <div className="mt-3 p-2.5 bg-amber-500/5 border border-amber-500/20"><p className="text-[10px] font-bold text-amber-400">RAPPEL 10-9 Must System:</p><p className="text-[10px] text-zinc-400 mt-1">10-9 serré, 10-8 dominant, 10-7 domination totale + dommage. Ne jamais donner 10-10 sauf cas extrême.</p></div>
              </div>
              <div className="mt-4 space-y-2">
                <h4 className="text-[10px] uppercase font-black text-zinc-500 tracking-wider">Fin de Match Prématurée</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => ctx?.showPopup({ title: "KO / Soumission", message: "Victoire enregistrée par arrêt de l'arbitre central.\nMéthode: KO/TKO/SUB\nTemps: auto chronomètre\nRapport médical à rédiger", type: "success" })} className="h-8 border border-zinc-800 bg-zinc-900 text-[10px] text-white font-bold uppercase hover:bg-zinc-850">KO / TKO / SUB</button>
                  <button onClick={() => ctx?.showPopup({ title: "Disqualification", message: "En attente du rapport d'incident formel de l'arbitre.\nMotif: coup illégal intentionnel / morsure / etc.", type: "warning" })} className="h-8 border border-red-900/50 bg-red-950/10 text-[10px] text-red-400 font-bold uppercase hover:bg-red-950/20">Disqualification</button>
                  <button onClick={() => ctx?.showPopup({ title: "No Contest", message: "Coup accidentel illégal rendant combattant incapable de continuer", type: "info" })} className="h-8 border border-zinc-800 bg-zinc-900 text-[10px] text-zinc-400 font-bold uppercase">No Contest</button>
                  <button onClick={() => ctx?.showPopup({ title: "Appel VAR", message: "Demande de revue vidéo - Table centrale", type: "info" })} className="h-8 border border-amber-500/20 bg-amber-500/10 text-[10px] text-amber-400 font-bold uppercase">VAR Review</button>
                </div>
              </div>
              <div className="mt-4 p-3 bg-zinc-900/50 border border-zinc-900"><h4 className="text-[10px] font-bold uppercase text-zinc-500">Comparatif live autres juges (anonymisé)</h4><div className="mt-2 space-y-1 text-[10px]"><div className="flex justify-between"><span className="text-zinc-500">Juge 1</span><span className="text-white">10-9 Bleu</span></div><div className="flex justify-between"><span className="text-zinc-500">Juge 3</span><span className="text-white">10-9 Bleu</span></div><p className="text-emerald-400 text-[10px] mt-1">✓ Consensus 100%</p></div></div>
            </div>
            <div className="mt-6 pt-4 border-t border-zinc-900 space-y-2">
              <button onClick={soumettreDecision} className="w-full h-10 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2"><Check className="h-4 w-4 stroke-[3px]" /> Transmettre la carte - R{round}</button>
              <button className="w-full h-7 border border-zinc-800 text-[10px] text-zinc-500">Exporter PDF feuille de match</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// COMPOSANT PRINCIPAL : DASHBOARD ULTRA COMPLET
// ============================================================================
export default function ArbitreDashboard() {
  const [active, setActive] = useState<ArbitreModule>("overview")
  const [search, setSearch] = useState("")
  const [popup, setPopup] = useState<PopupState>({ open: false, title: "", message: "", type: "info" })
  const showPopup = (o: Partial<PopupState> & { title: string; message: string }) => setPopup({ open: true, title: o.title || "Info", message: o.message, type: o.type || "info", confirmText: "Fermer" })
  const showConfirm = (o: Partial<PopupState> & { title: string; message: string; confirmText?: string; cancelText?: string; onConfirm?: (...a: unknown[]) => void; onCancel?: () => void }) => setPopup({ open: true, title: o.title || "Confirmation", message: o.message, type: o.type || "confirm", confirmText: o.confirmText || "Confirmer", cancelText: o.cancelText || "Annuler", onConfirm: o.onConfirm, onCancel: o.onCancel })

  const menu = [
    { id: "overview" as ArbitreModule, label: "Vue d'ensemble", icon: <LayoutDashboard className="h-5 w-5" />, badge: null },
    { id: "jugement" as ArbitreModule, label: "Jugement Live", icon: <Scale className="h-5 w-5" />, badge: "LIVE" },
    { id: "designations" as ArbitreModule, label: "Désignations", icon: <ClipboardList className="h-5 w-5" />, badge: "3" },
    { id: "historique" as ArbitreModule, label: "Historique combats", icon: <History className="h-5 w-5" />, badge: "147" },
    { id: "reglements" as ArbitreModule, label: "Règlements & Formations", icon: <BookOpen className="h-5 w-5" />, badge: null },
    { id: "certifs" as ArbitreModule, label: "Licence & Grade", icon: <BadgeCheck className="h-5 w-5" />, badge: null },
    { id: "dispos" as ArbitreModule, label: "Disponibilités", icon: <Calendar className="h-5 w-5" />, badge: null },
    { id: "evaluations" as ArbitreModule, label: "Évaluations", icon: <Star className="h-5 w-5" />, badge: "4.8" },
    { id: "rapports" as ArbitreModule, label: "Rapports & Incidents", icon: <FileWarning className="h-5 w-5" />, badge: "1" },
    { id: "finances" as ArbitreModule, label: "Indemnités", icon: <Wallet className="h-5 w-5" />, badge: null },
    { id: "materiel" as ArbitreModule, label: "Matériel & Dotation", icon: <Package className="h-5 w-5" />, badge: null },
    { id: "medical" as ArbitreModule, label: "Médical & Sécurité", icon: <HeartPulse className="h-5 w-5" />, badge: "!" },
    { id: "formation" as ArbitreModule, label: "Formation Continue", icon: <GraduationCap className="h-5 w-5" />, badge: "6h" },
    { id: "communication" as ArbitreModule, label: "Messagerie Fédérale", icon: <MessageSquare className="h-5 w-5" />, badge: "3" },
    { id: "stats" as ArbitreModule, label: "Stats Avancées", icon: <BarChart3 className="h-5 w-5" />, badge: null },
  ]

  return (
    <PopupContext.Provider value={{ showPopup, showConfirm, showPrompt: showConfirm }}>
      <div className="flex min-h-screen bg-black text-zinc-100">
        <aside className="fixed bottom-0 left-0 top-[var(--platform-header-height)] z-20 w-64 overflow-hidden border-r border-zinc-900 bg-zinc-950 flex flex-col justify-between p-4">
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="mt-4 flex items-center gap-3 border border-zinc-900 bg-zinc-900/30 p-3"><div className="h-10 w-10 bg-zinc-800 border border-zinc-700 flex items-center justify-center font-black">AR</div><div className="flex-1"><p className="text-xs font-bold">M. Rakotondrabe</p><p className="text-[10px] text-zinc-500">Arbitre National A • 147 combats</p><p className="text-[9px] text-emerald-400">Connecté • Licence valide • Grade A</p></div></div>
            <nav className="mt-6 min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">{menu.map((it) => (<button key={it.id} onClick={() => setActive(it.id)} className={`flex w-full items-center justify-between px-4 py-2.5 text-[11.5px] font-medium border-l-2 ${active === it.id? "bg-amber-500/10 text-amber-400 border-amber-500" : "text-zinc-400 border-transparent hover:bg-zinc-900 hover:text-zinc-200"}`}><span className="flex items-center gap-3 whitespace-nowrap text-xs font-semibold tracking-wide">{it.icon}{it.label}</span>{(it as any).badge && <span className={`h-4 min-w-4 px-1 text-[9px] font-black flex items-center justify-center ${it.id === "jugement" ? "bg-red-600 text-white animate-pulse px-1.5" : it.id==="medical" ? "bg-red-500 text-white" : "bg-amber-500 text-black"}`}>{(it as any).badge}</span>}</button>))}</nav>
          </div>
          <div className="mt-4 space-y-2">
            <div className="border border-zinc-900 bg-zinc-900/20 p-3"><div className="flex items-center gap-2 text-[10px] text-zinc-400"><Shield className="h-3.5 w-3.5 text-emerald-500" />Officiel FMMADA • Impartialité & sécurité</div></div>
          </div>
        </aside>

        <div className="pl-64 flex flex-col flex-1">
          <header className="sticky top-0 z-10 h-16 border-b border-zinc-900 bg-black/80 backdrop-blur-md flex items-center justify-between px-8">
            <div className="relative w-96"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher combat, event, règle, rapport, facture..." className="w-full bg-zinc-900/30 border border-zinc-800 py-2 pl-10 pr-3 text-xs outline-none focus:border-amber-500/30" /></div>
            <div className="flex items-center gap-3"><span className="hidden md:flex items-center gap-2 text-[11px] text-zinc-400"><Award className="h-3.5 w-3.5 text-amber-500" />Grade A • Éligible Main Event • Top 5%</span><div className="h-6 w-[1px] bg-zinc-800" /><button className="relative border border-zinc-800 bg-zinc-900/40 p-2 text-zinc-400"><Bell className="h-4 w-4" /><span className="absolute top-1 right-1 h-2 w-2 bg-amber-500 animate-pulse" /></button><button className="h-8 w-8 bg-zinc-800 border border-zinc-700 flex items-center justify-center font-black text-xs">AR</button></div>
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
                {active === "materiel" && <MaterielModule />}
                {active === "medical" && <MedicalModule />}
                {active === "formation" && <FormationModule />}
                {active === "communication" && <CommunicationModule />}
                {active === "stats" && <StatistiquesModule />}
              </motion.div>
            </AnimatePresence>
          </main>
          <footer className="border-t border-zinc-900 bg-zinc-950/50 px-8 py-3 flex justify-between text-[10px] text-zinc-600"><span>FMMADA • Fédération Malgache MMA • ERP Indesy Mialy v2.5 ULTRA - 15 modules complets • Données fédérales sécurisées</span><span>Support: support@indesy-mialy.mg • Urgence arbitrage: 034 00 111 33</span></footer>
        </div>
      </div>
      <BrandPopup popup={popup} setPopup={setPopup} />
    </PopupContext.Provider>
  )
}
