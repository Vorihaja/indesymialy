"use client"

import React, { useState, useEffect, createContext, useContext } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard, FileText, Eye, MapPinned, Users, Wallet, BarChart3, FileCheck,
  Search, Bell, Plus, X, Calendar, MapPin, CheckCircle2, AlertTriangle, Award, Shield,
  TrendingUp, Megaphone, Target, Zap, Download, ArrowUpRight, Building2, Crown
} from "lucide-react"

type SponsorModule = "overview" | "contrats" | "visibilite" | "activations" | "leads" | "finances" | "roi" | "documents"
type PopupType = "info" | "success" | "warning" | "confirm" | "prompt"
interface PopupState { open: boolean; title: string; message: string; type: PopupType; confirmText?: string; cancelText?: string; onConfirm?: (...a: any[]) => void; onCancel?: () => void; showInput?: boolean; inputPlaceholder?: string; inputValue?: string }
const PopupContext = createContext<any>(null)

function BrandPopup({ popup, setPopup }: { popup: PopupState; setPopup: any }) {
  const [input, setInput] = useState(popup.inputValue || "")
  useEffect(() => { if (popup.open) setInput(popup.inputValue || "") }, [popup.open, popup.inputValue])
  if (!popup.open) return null
  const close = () => setPopup((p: any) => ({...p, open: false }))
  const ok = () => { if (popup.showInput && !input.trim()) return; popup.onConfirm?.(input.trim()); close() }
  const cancel = () => { popup.onCancel?.(); close() }
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={cancel} />
      <div className="relative w-full max-w-sm bg-zinc-950 border border-zinc-800 shadow-xl overflow-hidden">
        <div className="h-1 w-full bg-amber-500" />
        <div className="p-3.5">
          <div className="flex justify-between">
            <div className="flex items-center gap-1.5">
              <div className="h-5 w-5 bg-amber-500 text-black font-black text-[10px] flex items-center justify-center">IM</div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Indesy Mialy • Sponsor</span>
            </div>
            <button onClick={cancel}><X className="h-3 w-3 text-zinc-600 hover:text-zinc-300" /></button>
          </div>
          <h4 className="mt-3 text-[11.5px] font-bold uppercase text-white">{popup.title}</h4>
          <p className="mt-1 text-[11px] leading-[1.5] text-zinc-400 whitespace-pre-wrap">{popup.message}</p>
          {popup.showInput && <input autoFocus value={input} onChange={e => setInput(e.target.value)} placeholder={popup.inputPlaceholder} className="mt-3 h-8 w-full bg-zinc-900 border border-zinc-800 px-2.5 text-[11px] text-white outline-none" />}
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
        <div className="border border-zinc-900 bg-zinc-950 p-4"><p className="text-[10px] uppercase font-bold text-zinc-500">Investi 2026</p><p className="mt-1 text-xl font-black text-white">12 500 000 Ar</p><p className="text-[10px] text-zinc-500">3 contrats actifs</p></div>
        <div className="border border-zinc-900 bg-zinc-950 p-4"><p className="text-[10px] uppercase font-bold text-zinc-500">Impressions totales</p><p className="mt-1 text-xl font-black text-white">482K</p><p className="text-[10px] text-emerald-400 flex items-center gap-1"><TrendingUp className="h-3 w-3" />+34% vs dernier event</p></div>
        <div className="border border-zinc-900 bg-zinc-950 p-4"><p className="text-[10px] uppercase font-bold text-zinc-500">Leads générés</p><p className="mt-1 text-xl font-black text-amber-400">127</p><p className="text-[10px] text-zinc-500">QR scans + formulaires</p></div>
        <div className="border border-zinc-900 bg-zinc-950 p-4"><p className="text-[10px] uppercase font-bold text-zinc-500">ROI estimé</p><p className="mt-1 text-xl font-black text-emerald-400">2.8x</p><p className="text-[10px] text-zinc-500">35M Ar valeur média</p></div>
      </div>
      <div className="grid md:grid-cols-3 gap-3">
        <div className="md:col-span-2 border border-amber-500/20 bg-amber-500/5 p-5">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2"><Crown className="h-4 w-4 text-amber-500" />Prochain event sponsorisé</h3>
              <p className="text-sm font-black text-white mt-2">MAHAJANGA FIGHT NIGHT VI - Title Sponsor</p>
              <p className="text-[11px] text-zinc-400 flex items-center gap-2 mt-1"><Calendar className="h-3 w-3" />15 Août 2026 • <MapPin className="h-3 w-3" />Gymnase Couvert • 2500 spectateurs attendus</p>
            </div>
            <span className="px-2 py-1 bg-amber-500 text-black text-[10px] font-black uppercase">Gold</span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-[11px]">
            <div className="bg-zinc-950 border border-zinc-900 p-2.5"><p className="text-zinc-500 uppercase text-[9px] font-bold">Logo cage</p><p className="text-white font-bold mt-1">Centre + 2 côtés</p></div>
            <div className="bg-zinc-950 border border-zinc-900 p-2.5"><p className="text-zinc-500 uppercase text-[9px] font-bold">Mention live</p><p className="text-white font-bold mt-1">8x / event</p></div>
            <div className="bg-zinc-950 border border-zinc-900 p-2.5"><p className="text-zinc-500 uppercase text-[9px] font-bold">Stand</p><p className="text-white font-bold mt-1">Zone A1 3x3m</p></div>
          </div>
        </div>
        <div className="border border-zinc-900 bg-zinc-950 p-5">
          <h3 className="text-sm font-bold text-white">Activation à valider</h3>
          <div className="mt-3 bg-zinc-900/50 border border-zinc-800 p-3">
            <p className="text-xs text-zinc-300">Distribution échantillons + QR concours</p>
            <p className="text-[11px] text-zinc-500 mt-1">Deadline orga : 10 Août</p>
          </div>
          <button onClick={() => ctx?.showConfirm({ title: "Confirmer activation?", message: "Confirmer présence stand + 2 hôtesses le 15/08?", confirmText: "Confirmer", onConfirm: () => ctx.showPopup({ title: "Confirmé", message: "Organisateur notifié, badge accès envoyé", type: "success" }) })} className="mt-3 w-full h-8 bg-amber-500 text-black text-xs font-bold">Confirmer activation</button>
        </div>
      </div>
    </div>
  )
}

function ContratsModule() {
  const ctx = useContext(PopupContext)
  const contrats = [{ id: "c1", event: "MFN VI", tier: "Gold - Title", montant: "8 000 000 Ar", statut: "Actif", expo: "Logo cage centre + interview" }, { id: "c2", event: "Nosy Be Open", tier: "Silver", montant: "3 000 000 Ar", statut: "Actif", expo: "Bâche ring + flyers" }, { id: "c3", event: "Boeny Boxing Cup", tier: "Bronze", montant: "1 500 000 Ar", statut: "Clôturé", expo: "Logo affiche" }]
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold text-white">Mes Contrats • {contrats.length}</h3>
        <button onClick={() => ctx?.showPopup({ title: "Nouveau sponsoring", message: "Catalogue events disponibles Q3 2026", type: "info" })} className="h-8 px-3 bg-amber-500 text-black text-xs font-bold flex items-center gap-1.5"><Plus className="h-3.5 w-3.5" />Sponsoriser un event</button>
      </div>
      <div className="border border-zinc-900 bg-zinc-950 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-zinc-900/30 border-b border-zinc-900 text-[10px] uppercase font-bold text-zinc-500">
              <th className="p-3">Event</th>
              <th className="p-3">Tier</th>
              <th className="p-3">Montant</th>
              <th className="p-3">Exposition</th>
              <th className="p-3">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900 text-xs">
            {contrats.map((c) => (
              <tr key={c.id} className="hover:bg-zinc-900/20">
                <td className="p-3 font-bold text-white">{c.event}</td>
                <td className="p-3">
                  <span className={`px-1.5 py-0.5 text-[10px] font-bold uppercase ${c.tier.includes("Gold")? "bg-amber-500/20 text-amber-400" : c.tier.includes("Silver")? "bg-zinc-700 text-zinc-300" : "bg-zinc-800 text-zinc-400"}`}>{c.tier}</span>
                </td>
                <td className="p-3 text-zinc-300">{c.montant}</td>
                <td className="p-3 text-zinc-500 max-w-[200px] truncate">{c.expo}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase ${c.statut === "Actif"? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-800 text-zinc-400"}`}>{c.statut}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function VisibiliteModule() {
  return (
    <div className="grid md:grid-cols-3 gap-3">
      <div className="md:col-span-2 border border-zinc-900 bg-zinc-950 p-5">
        <h3 className="text-sm font-bold text-white flex items-center gap-2"><Eye className="h-4 w-4 text-amber-500" />Preuves d'exposition</h3>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {[{ l: "Logo cage centre", v: "12 photos HD", s: "Validé" }, { l: "Mention speaker", v: "8 mentions", s: "Audio dispo" }, { l: "Post Facebook orga", v: "Reach 84K", s: "Boosté" }, { l: "Story Instagram", v: "12.4K vues", s: "Swipe-up 340" }].map((m) => (
            <div key={m.l} className="border border-zinc-800 bg-zinc-900/30 p-3 flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-white">{m.l}</p>
                <p className="text-[11px] text-zinc-500">{m.v}</p>
              </div>
              <span className="text-[11px] font-bold text-emerald-400">{m.s}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="border border-zinc-900 bg-zinc-950 p-5">
        <h3 className="text-sm font-bold text-white">Reach total</h3>
        <p className="mt-2 text-2xl font-black text-white">482 300</p>
        <p className="text-[11px] text-zinc-500">Impressions cumulées</p>
        <div className="mt-4 space-y-2 text-[11px]">
          <div className="flex justify-between"><span className="text-zinc-500">Facebook</span><span className="text-white font-bold">210K</span></div>
          <div className="flex justify-between"><span className="text-zinc-500">Sur place</span><span className="text-white font-bold">2 500</span></div>
          <div className="flex justify-between"><span className="text-zinc-500">Live Stream</span><span className="text-white font-bold">180K</span></div>
        </div>
      </div>
    </div>
  )
}

function ActivationsModule() {
  const ctx = useContext(PopupContext)
  return (
    <div className="space-y-3">
      <div className="flex justify-between">
        <h3 className="text-sm font-bold text-white">Activations terrain</h3>
        <button onClick={() => ctx?.showPopup({ title: "Nouvelle activation", message: "Demande stand, sampling, concours", type: "prompt" })} className="h-7 px-3 border border-zinc-800 bg-zinc-900 text-[11px] text-zinc-300">Demander activation</button>
      </div>
      {[{ t: "Stand dégustation Zone A1", d: "15 Août • 2 hôtesses • 500 échantillons", st: "Confirmé" }, { t: "Tombola QR code - Lot 1M Ar", d: "Collecte leads • 127 participants", st: "En cours" }].map((a) => (
        <div key={a.t} className="border border-zinc-900 bg-zinc-950 p-4 flex justify-between items-center">
          <div>
            <p className="text-sm font-bold text-white">{a.t}</p>
            <p className="text-[11px] text-zinc-500">{a.d}</p>
          </div>
          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase ${a.st === "Confirmé"? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>{a.st}</span>
        </div>
      ))}
    </div>
  )
}

function LeadsModule() { 
  return (
    <div className="border border-zinc-900 bg-zinc-950 overflow-hidden">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-zinc-900/30 border-b border-zinc-900 text-[10px] uppercase font-bold text-zinc-500">
            <th className="p-3">Date</th>
            <th className="p-3">Source</th>
            <th className="p-3">Contact</th>
            <th className="p-3">Intérêt</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-900 text-xs">
          {[{ d: "15/08", s: "QR Stand", c: "Andry R. • 034...", i: "Devis partenariat" }, { d: "15/08", s: "Tombola", c: "Sitraka M. • sitraka@mail", i: "Produit X" }].map((l) => (
            <tr key={l.c} className="hover:bg-zinc-900/20">
              <td className="p-3 text-zinc-400">{l.d}</td>
              <td className="p-3"><span className="px-1.5 py-0.5 bg-zinc-800 text-[10px] text-zinc-300">{l.s}</span></td>
              <td className="p-3 font-bold text-white">{l.c}</td>
              <td className="p-3 text-zinc-400">{l.i}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) 
}

function FinancesModule() { 
  return (
    <div className="grid md:grid-cols-3 gap-3">
      <div className="border border-zinc-900 bg-zinc-950 p-4"><p className="text-[10px] uppercase text-zinc-500">Budget engagé</p><p className="text-xl font-black text-white mt-1">12.5M Ar</p></div>
      <div className="border border-zinc-900 bg-zinc-950 p-4"><p className="text-[10px] uppercase text-zinc-500">Payé</p><p className="text-xl font-black text-emerald-400 mt-1">9.5M Ar</p><p className="text-[11px] text-zinc-500">Factures soldées</p></div>
      <div className="border border-zinc-900 bg-zinc-950 p-4"><p className="text-[10px] uppercase text-zinc-500">Reste dû</p><p className="text-xl font-black text-amber-400 mt-1">3M Ar</p><p className="text-[11px] text-zinc-500">Échéance 01/09</p></div>
    </div>
  ) 
}

function RoiModule() { 
  return (
    <div className="grid md:grid-cols-2 gap-3">
      <div className="border border-zinc-900 bg-zinc-950 p-5">
        <h3 className="text-sm font-bold text-white flex items-center gap-2"><BarChart3 className="h-4 w-4 text-amber-500" />ROI détaillé</h3>
        <div className="mt-4 space-y-3 text-xs">
          <div className="flex justify-between"><span className="text-zinc-500">Coût / 1000 impressions</span><span className="text-white font-bold">26 000 Ar</span></div>
          <div className="flex justify-between"><span className="text-zinc-500">Coût / lead</span><span className="text-white font-bold">98 400 Ar</span></div>
          <div className="flex justify-between border-t border-zinc-800 pt-3"><span className="text-zinc-400 font-bold">Valeur média équivalente</span><span className="text-emerald-400 font-black">35 000 000 Ar</span></div>
        </div>
      </div>
      <div className="border border-zinc-900 bg-zinc-950 p-5">
        <h3 className="text-sm font-bold text-white">Recommandation IA</h3>
        <p className="text-xs text-zinc-400 mt-2 leading-relaxed">Le stand Zone A1 a généré 3.2x plus de leads que la bâche seule. Pour MFN VII, passe en Gold + activation concours pour viser 200 leads.</p>
        <button className="mt-4 w-full h-8 bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-300">Télécharger rapport complet PDF</button>
      </div>
    </div>
  ) 
}

function DocumentsModule() { 
  return (
    <div className="space-y-2">
      {[{ n: "Contrat Sponsoring MFN VI - Gold.pdf", s: "Signé", d: "08/07/2026" }, { n: "Facture #INV-2026-042 - 8M Ar", s: "Payée", d: "10/07/2026" }, { n: "Preuves exposition - Photos HD.zip", s: "Disponible", d: "16/08/2026" }].map((doc) => (
        <div key={doc.n} className="flex justify-between items-center border border-zinc-900 bg-zinc-950 p-4">
          <div className="flex items-center gap-3">
            <FileCheck className="h-4 w-4 text-zinc-500" />
            <div>
              <p className="text-sm font-bold text-white">{doc.n}</p>
              <p className="text-[11px] text-zinc-500">{doc.d} • <span className={doc.s === "Signé" || doc.s === "Payée"? "text-emerald-400" : "text-amber-400"}>{doc.s}</span></p>
            </div>
          </div>
          <button className="h-7 w-7 border border-zinc-800 flex items-center justify-center text-zinc-500"><Download className="h-3.5 w-3.5" /></button>
        </div>
      ))}
    </div>
  ) 
}

export default function SponsorDashboard() {
  const [active, setActive] = useState<SponsorModule>("overview")
  const [search, setSearch] = useState("")
  const [popup, setPopup] = useState<PopupState>({ open: false, title: "", message: "", type: "info" })
  const showPopup = (o: any) => setPopup({ open: true, title: o.title || "Info", message: o.message, type: o.type || "info", confirmText: "Fermer" })
  const showConfirm = (o: any) => setPopup({ open: true, title: o.title || "Confirmation", message: o.message, type: o.type || "confirm", confirmText: o.confirmText || "Confirmer", cancelText: "Annuler", onConfirm: o.onConfirm, onCancel: o.onCancel })
  
  const menu = [
    { id: "overview" as SponsorModule, label: "Vue d'ensemble", icon: <LayoutDashboard className="h-5 w-5" /> },
    { id: "contrats" as SponsorModule, label: "Mes Contrats", icon: <FileText className="h-5 w-5" />, badge: "3" },
    { id: "visibilite" as SponsorModule, label: "Visibilité & Médias", icon: <Eye className="h-5 w-5" />, badge: "12 photos" },
    { id: "activations" as SponsorModule, label: "Activations Terrain", icon: <MapPinned className="h-5 w-5" /> },
    { id: "leads" as SponsorModule, label: "Leads & Réseau", icon: <Users className="h-5 w-5" />, badge: "127" },
    { id: "finances" as SponsorModule, label: "Facturation", icon: <Wallet className="h-5 w-5" /> },
    { id: "roi" as SponsorModule, label: "ROI & Analytics", icon: <BarChart3 className="h-5 w-5" /> },
    { id: "documents" as SponsorModule, label: "Contrats & Preuves", icon: <FileCheck className="h-5 w-5" /> },
  ]

  return (
    <PopupContext.Provider value={{ showPopup, showConfirm, showPrompt: showConfirm }}>
      <div className="flex min-h-screen bg-black text-zinc-100">
        <aside className="fixed inset-y-0 left-0 z-20 w-64 border-r border-zinc-900 bg-zinc-950 flex flex-col justify-between p-4">
          <div>
            <div className="flex items-center gap-3 px-2 py-3 border-b border-zinc-900">
              <div className="h-9 w-9 bg-amber-500 text-black font-black flex items-center justify-center">IM</div>
              <div>
                <h1 className="text-sm font-black uppercase">INDESY MIALY</h1>
                <span className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">Espace Sponsor</span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3 border border-amber-500/20 bg-amber-500/5 p-3">
              <div className="h-10 w-10 bg-zinc-900 border border-amber-500/20 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-1.5">Star Oil Madagascar<Crown className="h-3 w-3 text-amber-500" /></p>
                <p className="text-[10px] text-amber-400 font-bold uppercase">Gold Sponsor • Depuis 2024</p>
              </div>
            </div>
            <nav className="mt-6 space-y-1">
              {menu.map((it) => (
                <button key={it.id} onClick={() => setActive(it.id)} className={`flex w-full items-center justify-between px-4 py-2.5 text-[11.5px] font-medium border-l-2 ${active === it.id? "bg-amber-500/10 text-amber-400 border-amber-500" : "text-zinc-400 border-transparent hover:bg-zinc-900 hover:text-zinc-200"}`}>
                  <span className="flex items-center gap-3">{it.icon}{it.label}</span>
                  {it.badge && <span className="h-4 min-w-4 px-1 bg-zinc-800 text-[9px] font-bold text-zinc-300 flex items-center justify-center">{it.badge}</span>}
                </button>
              ))}
            </nav>
          </div>
          <div className="border border-zinc-900 bg-zinc-900/20 p-3">
            <div className="flex items-center gap-2 text-[10px] text-zinc-400">
              <Shield className="h-3.5 w-3.5 text-emerald-500 shrink-0" />Contrat Gold • Exposition garantie • Facturation sécurisée
            </div>
          </div>
        </aside>

        <div className="pl-64 flex flex-col flex-1">
          <header className="sticky top-0 z-10 h-16 border-b border-zinc-900 bg-black/80 backdrop-blur-md flex items-center justify-between px-8">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher contrat, event, facture..." className="w-full bg-zinc-900/30 border border-zinc-800 py-2 pl-10 pr-3 text-xs outline-none focus:border-amber-500/30" />
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden md:flex items-center gap-2 text-[11px] text-zinc-400">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />ROI 2.8x • 482K impressions
              </span>
              <div className="h-6 w-[1px] bg-zinc-800" />
              <button className="relative border border-zinc-800 bg-zinc-900/40 p-2 text-zinc-400">
                <Bell className="h-4 w-4" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-amber-500" />
              </button>
              <button onClick={() => showPopup({ title: "Nouveau sponsoring", message: "Catalogue Q4 2026 disponible", type: "info" })} className="flex items-center gap-2 bg-amber-500 px-4 py-2 text-xs font-bold text-black hover:bg-amber-400">
                <Plus className="h-4 w-4" />Sponsoriser
              </button>
            </div>
          </header>
          <main className="flex-1 p-8 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div key={active} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
                {active === "overview" && <OverviewModule />}
                {active === "contrats" && <ContratsModule />}
                {active === "visibilite" && <VisibiliteModule />}
                {active === "activations" && <ActivationsModule />}
                {active === "leads" && <LeadsModule />}
                {active === "finances" && <FinancesModule />}
                {active === "roi" && <RoiModule />}
                {active === "documents" && <DocumentsModule />}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
      <BrandPopup popup={popup} setPopup={setPopup} />
    </PopupContext.Provider>
  )
}