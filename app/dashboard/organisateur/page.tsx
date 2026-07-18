"use client"

import React, { useState, useEffect, createContext, useContext } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Swords, Calendar, Users, ShieldAlert, BarChart3,
  Settings, DollarSign, Plus, Search,
  Trophy, Layers, X, MapPin, Clock, Shield, ArrowLeft, Trash2, Edit2, Eye
} from "lucide-react"

type TabKey = "fightcard" | "athletes" | "finances" | "logistique"
type ModuleKey = "overview" | "events" | "analytics" | "settings"
type PopupType = "info" | "success" | "error" | "warning" | "confirm" | "prompt"

interface EventItem {
  id: string; name: string; slug: string; discipline: string; type: string
  startDate: string; venueName: string; city: string
  status: "brouillon" | "publie" | "archive"
  boutsCount: number; athletesCount: number; ticketsSoldPercent: number; revenue: string
}

interface PopupState {
  open: boolean; title: string; message: string; type: PopupType
  confirmText?: string; cancelText?: string
  onConfirm?: (...a: any[]) => void; onCancel?: () => void
  showInput?: boolean; showSecondInput?: boolean
  inputPlaceholder?: string; secondInputPlaceholder?: string
  inputValue?: string; secondInputValue?: string
}

interface PopupContextProps {
  showPopup: (o: { title?: string; message: string; type?: PopupType }) => void
  showConfirm: (o: { title?: string; message: string; type?: PopupType; confirmText?: string; cancelText?: string; onConfirm?: () => void; onCancel?: () => void }) => void
  showDoublePrompt: (o: { title: string; message: string; firstPlaceholder: string; secondPlaceholder: string; onConfirm: (a: string, b: string) => void }) => void
  showPrompt: (o: { title: string; message: string; firstPlaceholder: string; secondPlaceholder: string; onConfirm: (a: string, b: string) => void }) => void
}

const PopupContext = createContext<PopupContextProps | null>(null)

function BrandPopup({ popup, setPopup }: { popup: PopupState; setPopup: any }) {
  const [input, setInput] = useState(popup.inputValue || "")
  const [input2, setInput2] = useState(popup.secondInputValue || "")

  useEffect(() => { 
    if (popup.open) { 
      setInput(popup.inputValue || "")
      setInput2(popup.secondInputValue || "") 
    } 
  }, [popup.open, popup.inputValue, popup.secondInputValue])

  if (!popup.open) return null

  const close = () => setPopup((p: any) => ({ ...p, open: false }))
  
  const confirm = () => {
    if (popup.showInput && popup.showSecondInput) { 
      if (!input.trim() || !input2.trim()) return
      popup.onConfirm?.(input.trim(), input2.trim()) 
    } else if (popup.showInput) { 
      if (!input.trim()) return
      popup.onConfirm?.(input.trim()) 
    } else {
      popup.onConfirm?.()
    }
    close()
  }

  const cancel = () => { popup.onCancel?.(); close() }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={cancel} />
        <motion.div initial={{ opacity: 0, y: 6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.98 }} transition={{ duration: 0.15 }} className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 shadow-xl overflow-hidden">
          <div className="h-1 w-full bg-amber-500" />
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="h-5 w-5 bg-amber-500 text-black font-black text-xs flex items-center justify-center">IM</div>
                <span className="text-xs font-bold tracking-[0.16em] uppercase text-zinc-400">Indesy Mialy</span>
              </div>
              <button onClick={cancel} className="-mr-1 p-1 text-zinc-600 hover:text-zinc-300"><X className="h-3 w-3" /></button>
            </div>
            
            <div className="mt-3">
              <h4 className="text-[12px] font-bold uppercase text-white leading-tight">{popup.title}</h4>
              <p className="mt-1.5 text-xs leading-[1.5] text-zinc-400 whitespace-pre-wrap">{popup.message}</p>
            </div>

            {popup.showInput && (
              <div className="mt-3 space-y-1.5">
                <input autoFocus value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && confirm()} placeholder={popup.inputPlaceholder} className="h-8 w-full bg-zinc-900 border border-zinc-800 px-2.5 text-xs text-white outline-none focus:border-amber-500" />
                {popup.showSecondInput && <input value={input2} onChange={e => setInput2(e.target.value)} onKeyDown={e => e.key === 'Enter' && confirm()} placeholder={popup.secondInputPlaceholder} className="h-8 w-full bg-zinc-900 border border-zinc-800 px-2.5 text-xs text-white outline-none focus:border-amber-500" />}
              </div>
            )}

            <div className="mt-4 flex justify-end gap-1.5">
              {(popup.type === "confirm" || popup.showInput) && <button onClick={cancel} className="h-7 px-3 text-[11px] border border-zinc-800 text-zinc-400 hover:text-white transition-colors">{popup.cancelText || "Annuler"}</button>}
              <button onClick={confirm} className="h-7 px-3 text-[11px] font-bold bg-amber-500 text-black hover:bg-amber-400 transition-colors">{popup.confirmText || "OK"}</button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

function EventsListView({ events, onSelect, onEdit, onDelete }: { events: EventItem[]; onSelect: (e: EventItem) => void; onEdit: (e: EventItem) => void; onDelete: (id: string) => void }) {
  if (events.length === 0) {
    return <div className="border border-dashed border-zinc-800 bg-zinc-950/30 py-16 text-center"><p className="text-sm font-bold text-zinc-300">Aucun évènement</p><p className="text-xs text-zinc-500 mt-1">Crée ton premier gala</p></div>
  }
  return (
    <div className="space-y-5">
      <div><h2 className="text-lg font-black uppercase text-white">Mes Évènements</h2><p className="text-xs text-zinc-500 mt-1">{events.length} évènement(s) • Clique pour voir le détail</p></div>
      <div className="grid gap-2.5">
        {events.map((ev) => (
          <div key={ev.id} onClick={() => onSelect(ev)} className="flex flex-col md:flex-row md:items-center justify-between gap-3 border border-zinc-900 bg-zinc-950 p-4 hover:border-zinc-800 cursor-pointer">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="h-10 w-10 bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xs font-black text-zinc-500">{ev.discipline.slice(0, 2).toUpperCase()}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white truncate">{ev.name}</span>
                  <span className={`px-1.5 py-0.5 text-[10px] font-bold uppercase ${ev.status === "publie" ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-800 text-zinc-400"}`}>{ev.status}</span>
                </div>
                <div className="flex flex-wrap gap-3 mt-1 text-xs text-zinc-500">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{ev.startDate || "Date à définir"}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{ev.city}</span>
                  <span className="flex items-center gap-1"><Swords className="h-3 w-3" />{ev.boutsCount} combats</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => onSelect(ev)} className="h-7 px-2.5 border border-zinc-800 bg-zinc-900/50 text-zinc-400 text-xs font-bold flex items-center gap-1 hover:text-white"><Eye className="h-3 w-3" />Voir</button>
              <button onClick={() => onEdit(ev)} className="h-7 w-7 border border-zinc-800 bg-zinc-900/40 text-zinc-500 hover:text-white flex items-center justify-center"><Edit2 className="h-3 w-3" /></button>
              <button onClick={() => onDelete(ev.id)} className="h-7 w-7 border border-zinc-800 bg-zinc-900/40 text-zinc-600 hover:text-red-400 flex items-center justify-center"><Trash2 className="h-3 w-3" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function EventDetailView({ event, onBack, activeTab, setActiveTab }: { event: EventItem; onBack: () => void; activeTab: TabKey; setActiveTab: (k: TabKey) => void }) {
  const tabs = [
    { id: "fightcard" as TabKey, label: "Fight Card", icon: <Swords className="h-4 w-4" /> },
    { id: "athletes" as TabKey, label: "Athlètes", icon: <Users className="h-4 w-4" /> },
    { id: "finances" as TabKey, label: "Billetterie", icon: <DollarSign className="h-4 w-4" /> },
    { id: "logistique" as TabKey, label: "Staff", icon: <ShieldAlert className="h-4 w-4" /> },
  ]
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="border border-zinc-800 bg-zinc-900/50 p-2 text-zinc-400 hover:text-white"><ArrowLeft className="h-4 w-4" /></button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-black uppercase text-white truncate">{event.name}</h2>
            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase ${event.status === "publie" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>{event.status}</span>
          </div>
          <p className="text-xs text-zinc-500 truncate">{event.venueName} • {event.city} • {event.startDate} • {event.discipline}</p>
        </div>
      </div>
      <div className="flex border-b border-zinc-900">
        {tabs.map((t) => {
          const sel = activeTab === t.id
          return <button key={t.id} onClick={() => setActiveTab(t.id)} className={`relative flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase ${sel ? "text-amber-400 bg-zinc-950 border-t border-x border-zinc-900" : "text-zinc-500 hover:text-zinc-300"}`}>{t.icon}{t.label}{sel && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />}</button>
        })}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}>
          {activeTab === "fightcard" && <FightCardView />}
          {activeTab === "athletes" && <AthletesView />}
          {activeTab === "finances" && <FinancesView />}
          {activeTab === "logistique" && <LogistiqueView />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function PlaceholderModule({ label }: { label: string }) {
  if (label === "Vue d'Ensemble") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-black uppercase text-white">Tableau de bord global</h2>
          <p className="text-xs text-zinc-500 mt-1">Aperçu en temps réel de votre écosystème promotionnel Indesy Mialy</p>
        </div>


        {/* 1. KPIs Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border border-zinc-900 bg-zinc-950 p-4">
            <div className="flex justify-between items-start text-zinc-500">
              <span className="text-xs font-bold uppercase tracking-wider">Événements Totaux</span>
              <Calendar className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-2xl font-black text-white mt-2">2</p>
            <span className="text-[10px] text-emerald-400 font-medium">1 publié • 1 brouillon</span>
          </div>
          <div className="border border-zinc-900 bg-zinc-950 p-4">
            <div className="flex justify-between items-start text-zinc-500">
              <span className="text-xs font-bold uppercase tracking-wider">Combats Planifiés</span>
              <Swords className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-2xl font-black text-white mt-2">19</p>
            <span className="text-[10px] text-zinc-500">Moyenne de 9.5 combats / gala</span>
          </div>
          <div className="border border-zinc-900 bg-zinc-950 p-4">
            <div className="flex justify-between items-start text-zinc-500">
              <span className="text-xs font-bold uppercase tracking-wider">Athlètes Engagés</span>
              <Users className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-2xl font-black text-white mt-2">38</p>
            <span className="text-[10px] text-emerald-400 font-medium">100% profils vérifiés</span>
          </div>
          <div className="border border-zinc-900 bg-zinc-950 p-4">
            <div className="flex justify-between items-start text-zinc-500">
              <span className="text-xs font-bold uppercase tracking-wider">Revenus Billetterie</span>
              <DollarSign className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-2xl font-black text-white mt-2">4,250,000 Ar</p>
            <span className="text-[10px] text-zinc-500">Basé sur les ventes à Mahajanga</span>
          </div>
        </div>


        {/* 2. Centre de contrôle & Informations d'organisation */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="border border-zinc-900 bg-zinc-950 p-4">
              <h3 className="text-xs font-black uppercase text-white mb-3 tracking-wider">Disciplines & Activité Sportive</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-zinc-300">Mixed Martial Arts (MMA)</span>
                    <span className="text-zinc-500">1 Gala Actif</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-900"><div className="h-full bg-amber-500" style={{ width: "50%" }} /></div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-zinc-300">Judo / Grappling</span>
                    <span className="text-zinc-500">1 Tournoi Préparé</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-900"><div className="h-full bg-amber-500" style={{ width: "50%" }} /></div>
                </div>
              </div>
            </div>


            <div className="border border-zinc-900 bg-zinc-950 p-4">
              <h3 className="text-xs font-black uppercase text-white mb-3 tracking-wider">Logs Récents du Système</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1.5 border-b border-zinc-900/60 text-zinc-400">
                  <span>Mise à jour des règles du combat de gala à Mahajanga</span>
                  <span className="text-[10px] text-zinc-600">Il y a 10 min</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-zinc-900/60 text-zinc-400">
                  <span>Ouverture des dépôts de licence de combat d'arène</span>
                  <span className="text-[10px] text-zinc-600">Il y a 2h</span>
                </div>
                <div className="flex justify-between items-center py-1.5 text-zinc-400">
                  <span>Initialisation du module promoteur Indesy Mialy</span>
                  <span className="text-[10px] text-zinc-600">Hier</span>
                </div>
              </div>
            </div>
          </div>


          {/* Alertes de Sécurité / Logistique Ring */}
          <div className="border border-zinc-900 bg-zinc-950 p-4 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-black uppercase text-white mb-3 flex items-center gap-1.5 tracking-wider text-amber-400">
                <ShieldAlert className="h-3.5 w-3.5" /> Vigilance Logistique
              </h3>
              <div className="space-y-3 mt-4">
                <div className="p-2.5 bg-amber-500/5 border border-amber-500/20 text-xs">
                  <p className="font-bold text-amber-400 uppercase text-[10px]">Pesée officielle à venir</p>
                  <p className="text-zinc-400 mt-1">Assurez-vous de valider l'emplacement du rassemblement 24h avant le combat principal.</p>
                </div>
                <div className="p-2.5 bg-zinc-900/40 border border-zinc-800 text-xs">
                  <p className="font-bold text-zinc-400 uppercase text-[10px]">Accréditations Presse</p>
                  <p className="text-zinc-500 mt-1">Le quota des demandes de pass médias approche de la limite autorisée par l'arène.</p>
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-zinc-900 mt-4 text-[11px] text-zinc-600 text-center">
              Statut Infrastructure : Opérationnel
            </div>
          </div>
        </div>
      </div>
    )
  }
  return <div className="border border-dashed border-zinc-800 bg-zinc-950/20 py-20 text-center"><p className="text-sm font-bold text-zinc-300">{label}</p><p className="text-xs text-zinc-600 mt-1">Module en cours de développement</p></div>
}

function FightCardView() {
  const ctx = useContext(PopupContext)
  const [bouts, setBouts] = useState([{ id: 1, type: "Main Event", f1: "Rakoto", f2: "Razafy", status: "Confirmé", time: "22:30" }])
  const add = () => ctx?.showDoublePrompt({ title: "Ajouter un Combat", message: "Deux noms requis", firstPlaceholder: "Combattant 1", secondPlaceholder: "Combattant 2", onConfirm: (a: string, b: string) => setBouts((p) => [...p, { id: p.length + 1, type: "Undercard", f1: a, f2: b, status: "En attente", time: "20:00" }]) })
  return <div className="space-y-3"><div className="flex justify-between items-center"><h3 className="text-sm font-bold text-white">Fight Card</h3><button onClick={add} className="border border-zinc-800 bg-zinc-900/40 px-3 py-1.5 text-xs hover:bg-zinc-900 transition-colors">Ajouter</button></div>{bouts.map((b) => (<div key={b.id} className="border border-zinc-900 bg-zinc-950 p-4 flex justify-between items-center"><span className="text-sm font-bold text-white">{b.f1} vs {b.f2}</span><span className="text-xs text-zinc-500">{b.status}</span></div>))}</div>
}
function AthletesView() { return <div className="border border-zinc-900 bg-zinc-950 p-6 text-xs text-zinc-500">Roster - Logique des athlètes</div> }
function FinancesView() { const ctx = useContext(PopupContext); return <div className="border border-zinc-900 bg-zinc-950 p-6"><button onClick={() => ctx?.showConfirm({ title: "Sécuriser les fonds ?", message: "Voulez-vous bloquer les bourses ?", onConfirm: () => ctx.showPopup({ title: "Succès", message: "Séquestre envoyé avec succès", type: "success" }) })} className="border border-amber-500/20 bg-amber-500/5 px-3 py-1.5 text-xs font-bold text-amber-400 hover:bg-amber-500/10 transition-colors">Sécuriser Payouts</button></div> }
function LogistiqueView() { return <div className="border border-zinc-900 bg-zinc-950 p-6 text-xs text-zinc-500">Logistique du ring & officiels</div> }

export default function OrganisateurERP() {
  const [activeTab, setActiveTab] = useState<TabKey>("fightcard")
  const [currentModule, setCurrentModule] = useState<ModuleKey>("events")
  const [searchQuery, setSearchQuery] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeFormSection, setActiveFormSection] = useState("general")
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null)
  const [eventsList, setEventsList] = useState<EventItem[]>([
    { id: "evt_001", name: "MAHAJANGA FIGHT NIGHT V", slug: "mahajanga-fight-night-v", discipline: "MMA", type: "gala", startDate: "2026-08-15", venueName: "Gymnase Couvert", city: "Mahajanga", status: "publie", boutsCount: 7, athletesCount: 14, ticketsSoldPercent: 65, revenue: "4,250,000 Ar" },
    { id: "evt_002", name: "NOSY BE GRAPPLING OPEN", slug: "nosy-be-grappling", discipline: "Judo", type: "tournoi", startDate: "2026-09-02", venueName: "Dojo Régional", city: "Nosy Be", status: "brouillon", boutsCount: 12, athletesCount: 24, ticketsSoldPercent: 0, revenue: "0 Ar" },
  ])
  
  const [popup, setPopup] = useState<PopupState>({ open: false, title: "", message: "", type: "info" })
  const showPopup = (o: any) => setPopup({ open: true, title: o.title || "Info", message: o.message, type: o.type || "info", confirmText: "Fermer" })
  const showConfirm = (o: any) => setPopup({ open: true, title: o.title || "Confirmation", message: o.message, type: o.type || "confirm", confirmText: o.confirmText || "Confirmer", cancelText: o.cancelText || "Annuler", onConfirm: o.onConfirm, onCancel: o.onCancel })
  const showDoublePrompt = (o: any) => setPopup({ open: true, title: o.title, message: o.message, type: "prompt", confirmText: "Ajouter", cancelText: "Annuler", showInput: true, showSecondInput: true, inputPlaceholder: o.firstPlaceholder, secondInputPlaceholder: o.secondPlaceholder, onConfirm: o.onConfirm })

  // State du formulaire enrichi pour correspondre au cahier des charges d'Indesy Mialy
  const [formData, setFormData] = useState<any>({
    eventName: "",
    mainDiscipline: "MMA",
    eventType: "gala",
    startDate: "",
    startTime: "18:00",
    venueName: "",
    city: "Mahajanga",
    // 1. Sportif & Combats
    ruleset: "Unified Rules of MMA",
    ringType: "Cage Octogonale",
    roundsCount: "3",
    roundDuration: "5",
    // 2. Logistique & Officiels
    sanctioningBody: "Fédération Nationale",
    refereesCount: "2",
    judgesCount: "3",
    medicalStaff: "1 Médecin + 2 Secouristes",
    // 3. Organisation & Médias
    promoterName: "",
    broadcaster: "Aucun / Streaming Local",
    pressPasses: "10",
    // 4. Billetterie & Tarifs
    vipPrice: "50000",
    standardPrice: "15000",
    totalCapacity: "1000",
    // 5. Pesée officielle
    weighInDate: "",
    weighInLocation: ""
  })

  // Menu latéral du formulaire enrichi
  const formSections = [
    { id: "general", label: "1. Info Générales", icon: <Trophy className="h-3.5 w-3.5" /> },
    { id: "sportif", label: "2. Règles & Combats", icon: <Swords className="h-3.5 w-3.5" /> },
    { id: "logistique", label: "3. Staff & Officiels", icon: <Shield className="h-3.5 w-3.5" /> },
    { id: "medias", label: "4. Médias & Orga", icon: <Users className="h-3.5 w-3.5" /> },
    { id: "billetterie", label: "5. Tarifs & Billets", icon: <DollarSign className="h-3.5 w-3.5" /> },
    { id: "pesee", label: "6. Pesée Officielle", icon: <Clock className="h-3.5 w-3.5" /> },
  ]

  const currentIndex = formSections.findIndex((s) => s.id === activeFormSection)
  const safeIndex = currentIndex < 0 ? 0 : currentIndex

  const openCreate = () => { 
    setEditingEventId(null)
    setFormData({
      eventName: "", mainDiscipline: "MMA", eventType: "gala", startDate: "", startTime: "18:00", venueName: "", city: "Mahajanga",
      ruleset: "Unified Rules of MMA", ringType: "Cage Octogonale", roundsCount: "3", roundDuration: "5",
      sanctioningBody: "Fédération Nationale", refereesCount: "2", judgesCount: "3", medicalStaff: "1 Médecin + 2 Secouristes",
      promoterName: "", broadcaster: "Aucun / Streaming Local", pressPasses: "10",
      vipPrice: "50000", standardPrice: "15000", totalCapacity: "1000",
      weighInDate: "", weighInLocation: ""
    })
    setActiveFormSection("general")
    setIsModalOpen(true) 
  }

  const openEdit = (ev: EventItem) => { 
    setEditingEventId(ev.id)
    setFormData({ 
      ...formData,
      eventName: ev.name, 
      mainDiscipline: ev.discipline, 
      eventType: ev.type, 
      startDate: ev.startDate, 
      venueName: ev.venueName, 
      city: ev.city 
    })
    setActiveFormSection("general")
    setIsModalOpen(true) 
  }

  const handleFormAction = (action: "create" | "draft" | "publish" | "preview") => {
    if (!formData.eventName || !formData.startDate) { showPopup({ type: "error", title: "Champs requis", message: "Le nom et la date sont obligatoires." }); return }
    const title = formData.eventName.toUpperCase()
    if (action === "preview") { showPopup({ type: "info", title: "Aperçu", message: `Aperçu généré pour ${title}. Format : ${formData.ringType}, Règlement : ${formData.ruleset}` }); return }
    const status = action === "publish" ? "publie" as const : "brouillon" as const
    
    if (editingEventId) {
      setEventsList((prev) => prev.map((ev) => ev.id === editingEventId ? { ...ev, name: title, discipline: formData.mainDiscipline, type: formData.eventType, startDate: formData.startDate, venueName: formData.venueName || ev.venueName, city: formData.city || ev.city, status } : ev))
      if (selectedEvent?.id === editingEventId) setSelectedEvent((prev) => prev ? { ...prev, name: title, status } as EventItem : null)
      showPopup({ type: "success", title: "Mis à jour", message: `L'événement "${title}" a été modifié avec succès.` }); setIsModalOpen(false); setEditingEventId(null); return
    }
    
    const newEv: EventItem = { id: `evt_${Date.now()}`, name: title, slug: title.toLowerCase().replace(/\s+/g, "-"), discipline: formData.mainDiscipline, type: formData.eventType, startDate: formData.startDate, venueName: formData.venueName || "À définir", city: formData.city || "Mahajanga", status, boutsCount: 0, athletesCount: 0, ticketsSoldPercent: 0, revenue: "0 Ar" }
    setEventsList((p) => [newEv, ...p]); showPopup({ type: "success", title: status === "publie" ? "Publié" : "Créé", message: `L'événement "${title}" a bien été initialisé sur votre plateforme Indesy Mialy.` }); setIsModalOpen(false)
  }

  const handleDelete = (id: string) => showConfirm({ title: "Supprimer ?", message: "Cette action est irréversible. Confirmer la suppression ?", type: "warning", confirmText: "Supprimer", onConfirm: () => { setEventsList((p) => p.filter((e) => e.id !== id)); if (selectedEvent?.id === id) setSelectedEvent(null); showPopup({ type: "success", title: "Supprimé", message: "Évènement supprimé avec succès." }) } })
  const filteredEvents = eventsList.filter((e) => searchQuery ? e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.city.toLowerCase().includes(searchQuery.toLowerCase()) : true)

  const sidebarItems = [
    { id: "overview" as ModuleKey, icon: <Layers className="h-5 w-5" />, label: "Vue d'Ensemble" },
    { id: "events" as ModuleKey, icon: <Calendar className="h-5 w-5" />, label: "Mes Événements" },
    { id: "analytics" as ModuleKey, icon: <BarChart3 className="h-5 w-5" />, label: "Analyses" },
    { id: "settings" as ModuleKey, icon: <Settings className="h-5 w-5" />, label: "Configs" },
  ]

  return (
    <PopupContext.Provider value={{ showPopup, showConfirm, showDoublePrompt, showPrompt: showDoublePrompt }}>
      <div className="flex min-h-screen bg-black text-zinc-100">
        <aside className="fixed inset-y-0 left-0 z-20 w-64 border-r border-zinc-900 bg-zinc-950 flex flex-col justify-between p-4">
          <div>
            <div className="flex items-center gap-3 px-2 py-3 border-b border-zinc-900">
              <div className="h-9 w-9 bg-amber-500 text-black font-black flex items-center justify-center">IM</div>
              <div><h1 className="text-sm font-black uppercase">INDESY MIALY</h1><span className="text-xs text-amber-500 font-bold uppercase">Espace Promoteur</span></div>
            </div>
            <nav className="mt-6 space-y-1">
              {sidebarItems.map((it) => (
                <button key={it.id} onClick={() => { setCurrentModule(it.id); if (it.id === "events") setSelectedEvent(null) }} className={`flex w-full items-center gap-3 px-4 py-3 text-sm border-l-2 transition-all ${currentModule === it.id ? "bg-amber-500/10 text-amber-400 border-amber-500" : "text-zinc-400 border-transparent hover:bg-zinc-900"}`}>
                  {it.icon}{it.label}
                </button>
              ))}
            </nav>
          </div>
          <div className="border border-zinc-900 bg-zinc-900/20 p-3 flex gap-3 items-center">
            <div className="h-9 w-9 bg-zinc-800 flex items-center justify-center text-xs font-bold">OP</div>
            <div><p className="text-xs font-bold">Mahajanga Arena</p><p className="text-[10px] text-zinc-500">Organisateur Agréé</p></div>
          </div>
        </aside>

        <div className="pl-64 flex flex-col flex-1">
          <header className="sticky top-0 z-10 h-16 border-b border-zinc-900 bg-black/80 backdrop-blur-md flex items-center justify-between px-8">
            <div className="relative w-96"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" /><input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Rechercher un événement..." className="w-full bg-zinc-900/30 border border-zinc-800 py-2 pl-10 pr-3 text-xs outline-none focus:border-amber-500/50" /></div>
            <div className="flex items-center gap-4"><span className="text-xs font-bold uppercase text-emerald-500 flex items-center gap-1.5"><span className="h-1.5 w-1.5 bg-emerald-500 animate-pulse" />{eventsList.length} actifs</span><button onClick={openCreate} className="flex items-center gap-2 bg-amber-500 px-4 py-2 text-xs font-bold text-black hover:bg-amber-400 transition-colors"><Plus className="h-4 w-4" />Nouvel Événement</button></div>
          </header>

          <AnimatePresence>
            {isModalOpen && (
              <div className="fixed inset-0 z-50 bg-black/95 p-6 flex items-center justify-center">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="w-full max-w-5xl h-[85vh] bg-zinc-950 border border-zinc-900 flex flex-col overflow-hidden">
                  <div className="flex justify-between items-center p-5 border-b border-zinc-900"><div><p className="text-xs font-bold uppercase text-amber-500">Formulaire d'édition global</p><h2 className="font-black uppercase text-white">{editingEventId ? "Modifier" : "Créer"} un Événement Sportif</h2></div><button onClick={() => setIsModalOpen(false)} className="border border-zinc-800 p-2 text-zinc-400 hover:text-white"><X className="h-4 w-4" /></button></div>
                  <div className="flex flex-1 overflow-hidden">
                    <aside className="w-56 border-r border-zinc-900 p-3 hidden md:flex flex-col gap-1 bg-zinc-950">
                      {formSections.map((s) => { 
                        const a = activeFormSection === s.id; 
                        return <button key={s.id} onClick={() => setActiveFormSection(s.id)} className={`text-left flex items-center gap-2 px-3 py-2.5 text-xs font-bold border-l-2 transition-all ${a ? "bg-amber-500/10 border-amber-500 text-amber-400" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}>{s.icon}{s.label}</button> 
                      })}
                      <div className="mt-auto pt-3 border-t border-zinc-900"><div className="h-1 bg-zinc-900"><div className="h-full bg-amber-500" style={{ width: `${((safeIndex + 1) / formSections.length) * 100}%` }} /></div></div>
                    </aside>
                    <div className="flex-1 overflow-y-auto p-6 bg-black flex flex-col justify-between">
                      <div className="flex-1">
                        
                        {/* SECTION 1: GENERAL */}
                        {activeFormSection === "general" && (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 flex flex-col gap-1.5"><label className="text-xs uppercase font-bold text-zinc-400">Nom complet de l'événement / Titre du Gala *</label><input value={formData.eventName} onChange={(e) => setFormData({ ...formData, eventName: e.target.value })} className="bg-zinc-900 border border-zinc-800 p-2.5 text-xs text-white outline-none focus:border-amber-500" placeholder="Ex: MAHAJANGA FIGHT NIGHT VI" /></div>
                            <div className="flex flex-col gap-1.5"><label className="text-xs uppercase font-bold text-zinc-400">Discipline Principale</label><select value={formData.mainDiscipline} onChange={(e) => setFormData({ ...formData, mainDiscipline: e.target.value })} className="bg-zinc-900 border border-zinc-800 p-2.5 text-xs text-white outline-none focus:border-amber-500"><option>MMA</option><option>Judo</option><option>Boxe K1</option><option>Grappling</option></select></div>
                            <div className="flex flex-col gap-1.5"><label className="text-xs uppercase font-bold text-zinc-400">Format</label><select value={formData.eventType} onChange={(e) => setFormData({ ...formData, eventType: e.target.value })} className="bg-zinc-900 border border-zinc-800 p-2.5 text-xs text-white outline-none focus:border-amber-500"><option value="gala">Gala Principal (Main Card)</option><option value="tournoi">Tournoi à Élimination</option><option value="championnat">Championnat National</option></select></div>
                            <div className="flex flex-col gap-1.5"><label className="text-xs uppercase font-bold text-zinc-400">Date du Gala *</label><input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="bg-zinc-900 border border-zinc-800 p-2.5 text-xs text-white outline-none focus:border-amber-500" /></div>
                            <div className="flex flex-col gap-1.5"><label className="text-xs uppercase font-bold text-zinc-400">Heure d'ouverture des portes</label><input type="time" value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} className="bg-zinc-900 border border-zinc-800 p-2.5 text-xs text-white outline-none focus:border-amber-500" /></div>
                            <div className="flex flex-col gap-1.5"><label className="text-xs uppercase font-bold text-zinc-400">Ville</label><input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="bg-zinc-900 border border-zinc-800 p-2.5 text-xs text-white outline-none focus:border-amber-500" /></div>
                            <div className="flex flex-col gap-1.5"><label className="text-xs uppercase font-bold text-zinc-400">Nom du Complexe / Stade / Amphithéâtre</label><input value={formData.venueName} onChange={(e) => setFormData({ ...formData, venueName: e.target.value })} className="bg-zinc-900 border border-zinc-800 p-2.5 text-xs text-white outline-none focus:border-amber-500" placeholder="Ex: Gymnase Couvert Mahajanga" /></div>
                          </div>
                        )}

                        {/* SECTION 2: SPORTIF & REGLES */}
                        {activeFormSection === "sportif" && (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5"><label className="text-xs uppercase font-bold text-zinc-400">Règlementation / Règles appliquées</label><input value={formData.ruleset} onChange={(e) => setFormData({ ...formData, ruleset: e.target.value })} className="bg-zinc-900 border border-zinc-800 p-2.5 text-xs text-white outline-none focus:border-amber-500" placeholder="Ex: Unified Rules of MMA / FIJ Rules" /></div>
                            <div className="flex flex-col gap-1.5"><label className="text-xs uppercase font-bold text-zinc-400">Aire de combat</label><select value={formData.ringType} onChange={(e) => setFormData({ ...formData, ringType: e.target.value })} className="bg-zinc-900 border border-zinc-800 p-2.5 text-xs text-white outline-none focus:border-amber-500"><option>Cage Octogonale</option><option>Ring Traditionnel</option><option>Tatami (Double surface)</option></select></div>
                            <div className="flex flex-col gap-1.5"><label className="text-xs uppercase font-bold text-zinc-400">Nombre de rounds standard</label><input type="number" value={formData.roundsCount} onChange={(e) => setFormData({ ...formData, roundsCount: e.target.value })} className="bg-zinc-900 border border-zinc-800 p-2.5 text-xs text-white outline-none focus:border-amber-500" /></div>
                            <div className="flex flex-col gap-1.5"><label className="text-xs uppercase font-bold text-zinc-400">Durée d'un round (minutes)</label><input type="number" value={formData.roundDuration} onChange={(e) => setFormData({ ...formData, roundDuration: e.target.value })} className="bg-zinc-900 border border-zinc-800 p-2.5 text-xs text-white outline-none focus:border-amber-500" /></div>
                          </div>
                        )}

                        {/* SECTION 3: STAFF & OFFICIELS */}
                        {activeFormSection === "logistique" && (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 flex flex-col gap-1.5"><label className="text-xs uppercase font-bold text-zinc-400">Comité ou Fédération de Sanction</label><input value={formData.sanctioningBody} onChange={(e) => setFormData({ ...formData, sanctioningBody: e.target.value })} className="bg-zinc-900 border border-zinc-800 p-2.5 text-xs text-white outline-none focus:border-amber-500" placeholder="Ex: Commission Mixte de Combat Sportif" /></div>
                            <div className="flex flex-col gap-1.5"><label className="text-xs uppercase font-bold text-zinc-400">Nombre d'arbitres de centre requis</label><input type="number" value={formData.refereesCount} onChange={(e) => setFormData({ ...formData, refereesCount: e.target.value })} className="bg-zinc-900 border border-zinc-800 p-2.5 text-xs text-white outline-none focus:border-amber-500" /></div>
                            <div className="flex flex-col gap-1.5"><label className="text-xs uppercase font-bold text-zinc-400">Nombre de juges de table</label><input type="number" value={formData.judgesCount} onChange={(e) => setFormData({ ...formData, judgesCount: e.target.value })} className="bg-zinc-900 border border-zinc-800 p-2.5 text-xs text-white outline-none focus:border-amber-500" /></div>
                            <div className="col-span-2 flex flex-col gap-1.5"><label className="text-xs uppercase font-bold text-zinc-400">Dispositif Médical minimum obligatoire</label><input value={formData.medicalStaff} onChange={(e) => setFormData({ ...formData, medicalStaff: e.target.value })} className="bg-zinc-900 border border-zinc-800 p-2.5 text-xs text-white outline-none focus:border-amber-500" /></div>
                          </div>
                        )}

                        {/* SECTION 4: MEDIAS & ORGANISATION */}
                        {activeFormSection === "medias" && (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5"><label className="text-xs uppercase font-bold text-zinc-400">Nom du Promoteur responsable</label><input value={formData.promoterName} onChange={(e) => setFormData({ ...formData, promoterName: e.target.value })} className="bg-zinc-900 border border-zinc-800 p-2.5 text-xs text-white outline-none focus:border-amber-500" placeholder="Ex: Indesy Mialy Orga" /></div>
                            <div className="flex flex-col gap-1.5"><label className="text-xs uppercase font-bold text-zinc-400">Diffuseur Média / Partenaire TV</label><input value={formData.broadcaster} onChange={(e) => setFormData({ ...formData, broadcaster: e.target.value })} className="bg-zinc-900 border border-zinc-800 p-2.5 text-xs text-white outline-none focus:border-amber-500" /></div>
                            <div className="col-span-2 flex flex-col gap-1.5"><label className="text-xs uppercase font-bold text-zinc-400">Nombre max de pass presse / accréditations photo</label><input type="number" value={formData.pressPasses} onChange={(e) => setFormData({ ...formData, pressPasses: e.target.value })} className="bg-zinc-900 border border-zinc-800 p-2.5 text-xs text-white outline-none focus:border-amber-500" /></div>
                          </div>
                        )}

                        {/* SECTION 5: BILLETTERIE & TARIFS */}
                        {activeFormSection === "billetterie" && (
                          <div className="grid grid-cols-3 gap-4">
                            <div className="flex flex-col gap-1.5"><label className="text-xs uppercase font-bold text-zinc-400">Prix Ticket Standard (Ar)</label><input type="number" value={formData.standardPrice} onChange={(e) => setFormData({ ...formData, standardPrice: e.target.value })} className="bg-zinc-900 border border-zinc-800 p-2.5 text-xs text-white outline-none focus:border-amber-500" /></div>
                            <div className="flex flex-col gap-1.5"><label className="text-xs uppercase font-bold text-zinc-400">Prix Siège VIP (Ar)</label><input type="number" value={formData.vipPrice} onChange={(e) => setFormData({ ...formData, vipPrice: e.target.value })} className="bg-zinc-900 border border-zinc-800 p-2.5 text-xs text-white outline-none focus:border-amber-500" /></div>
                            <div className="flex flex-col gap-1.5"><label className="text-xs uppercase font-bold text-zinc-400">Jauge Maximale (Places)</label><input type="number" value={formData.totalCapacity} onChange={(e) => setFormData({ ...formData, totalCapacity: e.target.value })} className="bg-zinc-900 border border-zinc-800 p-2.5 text-xs text-white outline-none focus:border-amber-500" /></div>
                          </div>
                        )}

                        {/* SECTION 6: PESEE OFFICIELLE */}
                        {activeFormSection === "pesee" && (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5"><label className="text-xs uppercase font-bold text-zinc-400">Date et Heure de la Pesée</label><input type="datetime-local" value={formData.weighInDate} onChange={(e) => setFormData({ ...formData, weighInDate: e.target.value })} className="bg-zinc-900 border border-zinc-800 p-2.5 text-xs text-white outline-none focus:border-amber-500" /></div>
                            <div className="flex flex-col gap-1.5"><label className="text-xs uppercase font-bold text-zinc-400">Lieu de rassemblement de la pesée</label><input value={formData.weighInLocation} onChange={(e) => setFormData({ ...formData, weighInLocation: e.target.value })} className="bg-zinc-900 border border-zinc-800 p-2.5 text-xs text-white outline-none focus:border-amber-500" placeholder="Ex: Hôtel de Ville / Grand Hall" /></div>
                          </div>
                        )}

                      </div>
                      
                      {/* BOUTONS NAVIGATION DU FORMULAIRE */}
                      <div className="flex justify-between mt-8 pt-6 border-t border-zinc-900"><button onClick={() => setActiveFormSection(formSections[Math.max(0, safeIndex - 1)].id)} disabled={safeIndex === 0} className="px-4 py-2 text-xs border border-zinc-800 disabled:opacity-30 text-zinc-300 transition-opacity">Précédent</button><button onClick={() => setActiveFormSection(formSections[Math.min(formSections.length - 1, safeIndex + 1)].id)} disabled={safeIndex === formSections.length - 1} className="px-4 py-2 text-xs bg-zinc-900 border border-zinc-800 disabled:opacity-30 text-zinc-300 transition-opacity">Suivant</button></div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-4 border-t border-zinc-900 bg-zinc-950"><button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors">Annuler</button><div className="flex gap-2"><button onClick={() => handleFormAction("preview")} className="px-4 py-2 text-xs border border-zinc-800 text-zinc-400 hover:text-white transition-colors">Aperçu</button><button onClick={() => handleFormAction("draft")} className="px-4 py-2 text-xs border border-zinc-800 text-zinc-400 hover:text-white transition-colors">Brouillon</button><button onClick={() => handleFormAction("publish")} className="px-5 py-2 text-xs font-black uppercase bg-amber-500 text-black hover:bg-amber-400 transition-colors">Publier</button></div></div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          <main className="flex-1 p-8 overflow-y-auto">
            {currentModule === "events" ? (
              selectedEvent ? <EventDetailView event={selectedEvent} onBack={() => setSelectedEvent(null)} activeTab={activeTab} setActiveTab={setActiveTab} /> : <EventsListView events={filteredEvents} onSelect={setSelectedEvent} onEdit={openEdit} onDelete={handleDelete} />
            ) : (
              <PlaceholderModule label={sidebarItems.find((s) => s.id === currentModule)?.label || ""} />
            )}
          </main>
        </div>
      </div>
      <BrandPopup popup={popup} setPopup={setPopup} />
    </PopupContext.Provider>
  )
}